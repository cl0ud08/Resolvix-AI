from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.listener import start_listener_thread
from app.store import get_notifications

app = FastAPI(title="Notification Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    start_listener_thread()


@app.get("/health")
def health():
    return {"status": "ok", "service": "notification-service"}


@app.get("/notifications")
def list_notifications(limit: int = 50):
    return get_notifications(limit)