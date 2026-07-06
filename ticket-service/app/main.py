import uuid

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import Ticket, TicketMessage, SenderType
from app.schemas import TicketCreate, TicketUpdate, TicketOut, MessageCreate, MessageOut
from app.auth import get_current_user, CurrentUser
from app.clients import publish_ticket_event
from app.ai_listener import start_ai_listener_thread

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ticket Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    start_ai_listener_thread()


@app.get("/health")
def health():
    return {"status": "ok", "service": "ticket-service"}


@app.post("/tickets", response_model=TicketOut, status_code=201)
def create_ticket(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    ticket = Ticket(
        customer_id=user.user_id,
        subject=payload.subject,
        description=payload.description,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Publish TicketCreated — ai-triage-service picks this up
    # asynchronously and publishes AIAnalysisComplete when done.
    # No waiting — ticket is returned to user immediately.
    publish_ticket_event(
        "ticket_created",
        str(ticket.id),
        {
            "subject": ticket.subject,
            "description": ticket.description,
            "customer_id": str(ticket.customer_id),
        },
    )

    return ticket


@app.get("/tickets", response_model=list[TicketOut])
def list_tickets(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    query = db.query(Ticket)
    if user.role == "customer":
        query = query.filter(Ticket.customer_id == user.user_id)
    return query.order_by(Ticket.created_at.desc()).all()


@app.get("/tickets/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if user.role == "customer" and str(ticket.customer_id) != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return ticket


@app.patch("/tickets/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: uuid.UUID,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    if user.role == "customer":
        raise HTTPException(status_code=403, detail="Customers cannot update tickets")

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(ticket, field, value)

    db.commit()
    db.refresh(ticket)
    return ticket


@app.post("/tickets/{ticket_id}/messages", response_model=MessageOut, status_code=201)
def add_message(
    ticket_id: uuid.UUID,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if user.role == "customer" and str(ticket.customer_id) != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    sender_type = SenderType.customer if user.role == "customer" else SenderType.agent

    msg = TicketMessage(
        ticket_id=ticket_id,
        sender_type=sender_type,
        sender_id=uuid.UUID(user.user_id),
        message=payload.message,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@app.get("/tickets/{ticket_id}/messages", response_model=list[MessageOut])
def list_messages(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if user.role == "customer" and str(ticket.customer_id) != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return (
        db.query(TicketMessage)
        .filter(TicketMessage.ticket_id == ticket_id)
        .order_by(TicketMessage.created_at.asc())
        .all()
    )