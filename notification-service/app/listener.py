import json
import logging
import threading

import redis

from app.config import settings
from app.store import add_notification

logger = logging.getLogger(__name__)


def _format_message(event: dict) -> str:
    event_type = event.get("event")
    if event_type == "ticket_created":
        return f"New ticket created: \"{event.get('subject', '')}\""
    if event_type == "ticket_updated":
        return f"Ticket status changed to '{event.get('status', '')}'"
    return f"Unhandled event type: {event_type}"


def listen_for_ticket_events() -> None:
    r = redis.from_url(
    settings.REDIS_URL,
    decode_responses=True
)
    pubsub = r.pubsub()
    pubsub.subscribe("ticket_events")
    logger.info("notification-service: subscribed to ticket_events channel")

    for message in pubsub.listen():
        if message["type"] != "message":
            continue
        try:
            event = json.loads(message["data"])
            add_notification(
                event_type=event.get("event", "unknown"),
                ticket_id=event.get("ticket_id", ""),
                message=_format_message(event),
            )
        except json.JSONDecodeError:
            logger.warning(f"notification-service: bad event payload: {message['data']}")


def start_listener_thread() -> None:
    thread = threading.Thread(target=listen_for_ticket_events, daemon=True)
    thread.start()