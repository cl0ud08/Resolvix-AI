import json
import logging
import threading
import os
import redis

from app.llm import classify_ticket
from app.vector_store import search_similar_tickets, store_ticket_embedding

logger = logging.getLogger(__name__)


REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)


def process_ticket_created(event: dict) -> None:
    """
    Handles a TicketCreated event:
    1. Extract ticket details from event
    2. Run full RAG classification
    3. Publish AIAnalysisComplete back to Redis
    ticket-service subscribes to AIAnalysisComplete and
    updates the ticket row with the results.
    """
    ticket_id = event.get("ticket_id")
    subject = event.get("subject", "")
    description = event.get("description", "")

    if not ticket_id or not subject:
        logger.warning(f"Incomplete TicketCreated event: {event}")
        return

    logger.info(f"Processing ticket {ticket_id}")

    try:
        ticket_text = f"{subject} {description}"

        # RAG: query before classify before store
        similar_tickets = search_similar_tickets(ticket_text, n_results=3)
        result = classify_ticket(
            subject=subject,
            description=description,
            similar_tickets=similar_tickets,
        )

        store_ticket_embedding(
            ticket_id=ticket_id,
            text=ticket_text,
            category=result.get("category", "general"),
            priority=result.get("priority", "medium"),
        )

        # Publish result back — ticket-service picks this up
        # and updates the ticket row with AI fields
        ai_result_event = json.dumps({
            "event": "ai_analysis_complete",
            "ticket_id": ticket_id,
            "category": result.get("category"),
            "sentiment": result.get("sentiment"),
            "priority": result.get("priority"),
            "suggested_reply": result.get("suggested_reply"),
        })
        redis_client.publish("ai_events", ai_result_event)
        logger.info(f"Published AIAnalysisComplete for ticket {ticket_id}")

    except Exception as e:
        logger.error(f"Failed to process ticket {ticket_id}: {e}")


def listen_for_ticket_events() -> None:
    """
    Background worker that subscribes to ticket_events channel.
    Runs forever, processing TicketCreated events as they arrive.
    This is the event-driven counterpart to the synchronous
    HTTP /ai/classify route we used in v1/v2.
    """
    r = redis.from_url(REDIS_URL, decode_responses=True, ssl_cert_reqs=None)
    pubsub = r.pubsub()
    pubsub.subscribe("ticket_events")
    logger.info("ai-triage-service worker: subscribed to ticket_events")

    for message in pubsub.listen():
        if message["type"] != "message":
            continue
        try:
            event = json.loads(message["data"])
            if event.get("event") == "ticket_created":
                process_ticket_created(event)
        except json.JSONDecodeError:
            logger.warning(f"Bad event payload: {message['data']}")


def start_worker_thread() -> None:
    thread = threading.Thread(target=listen_for_ticket_events, daemon=True)
    thread.start()
    logger.info("ai-triage-service worker thread started")