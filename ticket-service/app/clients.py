import json
import logging
import os
import httpx
import redis

logger = logging.getLogger(__name__)


REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
AI_SERVICE_URL = "http://localhost:8003"

redis_client = redis.from_url(REDIS_URL, decode_responses=True, ssl_cert_reqs=None)


def call_ai_classify(subject: str, description: str) -> dict | None:
    """
    Calls ai-triage-service synchronously to classify a ticket.
    Returns None if the call fails — deliberately non-blocking,
    so a slow or down AI service never prevents ticket creation.
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


def publish_ticket_event(event_type: str, ticket_id: str, payload: dict) -> None:
    message = json.dumps({"event": event_type, "ticket_id": ticket_id, **payload})
    redis_client.publish("ticket_events", message)