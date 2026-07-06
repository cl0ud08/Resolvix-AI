import json
import logging
import httpx
import redis

from app.config import settings

logger = logging.getLogger(__name__)


REDIS_URL = settings.REDIS_URL
AI_SERVICE_URL = settings.AI_SERVICE_URL

redis_client = redis.from_url(REDIS_URL, decode_responses=True, ssl_cert_reqs=None)


def call_ai_classify(subject: str, description: str) -> dict | None:
    """
    Calls ai-triage-service synchronously to classify a ticket.
    Returns None if the call fails — deliberately non-blocking,
    so a slow or down AI service never prevents ticket creation.
    Note: not currently used by main.py, which uses the async
    Redis pub/sub flow via publish_ticket_event instead.
    """
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(
                f"{AI_SERVICE_URL}/ai/classify",
                json={"subject": subject, "description": description},
            )
            resp.raise_for_status()
            return resp.json()
    except (httpx.HTTPError, httpx.TimeoutException) as e:
        logger.warning(f"ai-triage-service call failed: {e}")
        return None


def get_ai_reply(subject: str, description: str, customer_message: str) -> str | None:
    """
    Calls ai-triage-service's /ai/reply endpoint to get a contextual
    response to a customer's follow-up message in the conversation thread.
    Returns None if the call fails, so a slow/down AI service never
    blocks the customer's message from being saved.
    """
    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(
                f"{AI_SERVICE_URL}/ai/reply",
                json={
                    "subject": subject,
                    "description": description,
                    "customer_message": customer_message,
                },
            )
            resp.raise_for_status()
            return resp.json().get("reply")
    except (httpx.HTTPError, httpx.TimeoutException) as e:
        logger.warning(f"ai-triage-service /ai/reply call failed: {e}")
        return None


def publish_ticket_event(event_type: str, ticket_id: str, payload: dict) -> None:
    message = json.dumps({"event": event_type, "ticket_id": ticket_id, **payload})
    redis_client.publish("ticket_events", message)