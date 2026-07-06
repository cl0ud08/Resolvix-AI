from typing import Literal, Optional

from pydantic import BaseModel


class ClassifyRequest(BaseModel):
    subject: str
    description: str


class ClassifyResponse(BaseModel):
    category: str
    sentiment: Literal["positive", "neutral", "negative"]
    priority: Literal["low", "medium", "high", "urgent"]
    suggested_reply: str


class ReplyRequest(BaseModel):
    subject: str
    description: str
    customer_message: str


class ReplyResponse(BaseModel):
    reply: str