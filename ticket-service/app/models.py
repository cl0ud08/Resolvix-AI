import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum, Text, Integer
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class TicketStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class TicketPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    assigned_agent_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    subject = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    status = Column(Enum(TicketStatus), default=TicketStatus.open, nullable=False)
    priority = Column(Enum(TicketPriority), default=TicketPriority.medium, nullable=False)

    ai_category = Column(String, nullable=True)
    ai_sentiment = Column(String, nullable=True)
    ai_suggested_reply = Column(Text, nullable=True)

    sla_minutes = Column(Integer, default=1440)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)