from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import ClassifyRequest, ClassifyResponse
from app.llm import classify_ticket
from app.vector_store import search_similar_tickets, store_ticket_embedding, _store
from app.worker import start_worker_thread

app = FastAPI(title="AI Triage Service", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    start_worker_thread()


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-triage-service", "version": "v3-event-driven"}


@app.get("/ai/store-size")
def store_size():
    return {
        "store_size": len(_store),
        "sample": [e["text"][:60] for e in _store]
    }


@app.post("/ai/classify", response_model=ClassifyResponse)
def classify(payload: ClassifyRequest):
    """
    Synchronous HTTP route — kept for direct testing.
    In normal operation, classification is triggered by
    TicketCreated events via the background worker, not this route.
    """
    ticket_text = f"{payload.subject} {payload.description}"
    similar_tickets = search_similar_tickets(ticket_text, n_results=3)
    result = classify_ticket(
        subject=payload.subject,
        description=payload.description,
        similar_tickets=similar_tickets,
    )

    try:
        response = ClassifyResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI classification failed: {str(e)}"
        )

    store_ticket_embedding(
        ticket_id=f"{payload.subject[:20]}_{len(payload.description)}",
        text=ticket_text,
        category=result.get("category", "general"),
        priority=result.get("priority", "medium"),
    )

    return response