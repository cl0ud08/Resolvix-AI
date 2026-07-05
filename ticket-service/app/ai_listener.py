import json
import logging
import threading
import os
import redis
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Ticket

logger = logging.getLogger(__name__)


REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

def process_ai_analysis_complete(event: dict, db: Session) -> None:
    """
    Receives AIAnalysisComplete event and updates the ticket row
    with the AI-generated fields.
    This is the async counterpart to the synchronous call_ai_classify()
    we used in v1/v2 — same end result, different timing.
    """
    ticket_id = event.get("ticket_id")
    if not ticket_id:
        logger.warning(f"AIAnalysisComplete missing ticket_id: {event}")
        return

    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        logger.warning(f"Ticket {ticket_id} not found for AI update")
        return

    # Update AI fields from the event payload
    ticket.ai_category = event.get("category")
    ticket.ai_sentiment = event.get("sentiment")
    ticket.ai_suggested_reply = event.get("suggested_reply")

    # Only update priority if AI returned one
    new_priority = event.get("priority")
    if new_priority:
        ticket.priority = new_priority

    db.commit()
    logger.info(f"Updated ticket {ticket_id} with AI results")


def listen_for_ai_events() -> None:
    """
    Background worker subscribing to ai_events channel.
    Runs alongside ticket-service's main HTTP server.
    This is what makes the system event-driven end to end:
    ticket-service no longer waits for AI — it just listens
    for results when they arrive.
    """
    r = redis.from_url(REDIS_URL, decode_responses=True)
    pubsub = r.pubsub()
    pubsub.subscribe("ai_events")
    logger.info("ticket-service: subscribed to ai_events channel")

    for message in pubsub.listen():
        if message["type"] != "message":
            continue
        try:
            event = json.loads(message["data"])
            if event.get("event") == "ai_analysis_complete":
                # Each event gets its own DB session — same reason
                # we use per-request sessions in HTTP routes:
                # isolated unit of work, guaranteed cleanup
                db = SessionLocal()
                try:
                    process_ai_analysis_complete(event, db)
                finally:
                    db.close()
        except json.JSONDecodeError:
            logger.warning(f"Bad ai_event payload: {message['data']}")
        except Exception as e:
            logger.error(f"Error processing ai_event: {e}")


def start_ai_listener_thread() -> None:
    thread = threading.Thread(target=listen_for_ai_events, daemon=True)
    thread.start()