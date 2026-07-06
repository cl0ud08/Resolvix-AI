import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models import TicketStatus, TicketPriority, SenderType


class TicketCreate(BaseModel):
    subject: str
    description: str


class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assigned_agent_id: Optional[uuid.UUID] = None


class TicketOut(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    assigned_agent_id: Optional[uuid.UUID]
    subject: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    ai_category: Optional[str]
    ai_sentiment: Optional[str]
    ai_suggested_reply: Optional[str]
    sla_minutes: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    message: str


class MessageOut(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    sender_type: SenderType
    sender_id: Optional[uuid.UUID]
    message: str
    created_at: datetime

    class Config:
        from_attributes = True