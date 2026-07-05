from collections import deque
from datetime import datetime
from threading import Lock

_lock = Lock()
_notifications = deque(maxlen=500)


def add_notification(event_type: str, ticket_id: str, message: str) -> None:
    with _lock:
        _notifications.appendleft({
            "event_type": event_type,
            "ticket_id": ticket_id,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        })


def get_notifications(limit: int = 50) -> list[dict]:
    with _lock:
        return list(_notifications)[:limit]