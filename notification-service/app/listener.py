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
        return f'New ticket created: "{event.get("subject", "")}"'

    if event_type == "ticket_updated":
        return f"Ticket status changed to '{event.get('status', '')}'"

    return f"Unhandled event type: {event_type}"


def listen_for_ticket_events() -> None:
    try:
        # Connect to Upstash Redis
        r = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
        )

        # Test the connection
        r.ping()

        pubsub = r.pubsub()
        pubsub.subscribe("ticket_events")

        logger.info("✅ Notification service subscribed to 'ticket_events'")

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

                logger.info(f"Processed event: {event.get('event')}")

            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON payload: {message['data']}")

            except Exception as e:
                logger.exception(f"Error processing event: {e}")

    except Exception as e:
        logger.exception(f"Failed to connect to Redis: {e}")


def start_listener_thread() -> None:
    thread = threading.Thread(
        target=listen_for_ticket_events,
        daemon=True,
    )
    thread.start()