import json
import logging

from groq import Groq

from app.config import settings

logger = logging.getLogger(__name__)
client = Groq(api_key=settings.GROQ_API_KEY)

CLASSIFY_SYSTEM_PROMPT = """You are a customer support triage assistant.
Given a support ticket's subject and description, and optionally some similar
past tickets for context, respond with ONLY a JSON object
(no markdown, no extra text, no backticks) with exactly these keys:

- "category": one short label, choose from: "billing", "technical", "account", "shipping", "general"
- "sentiment": one of "positive", "neutral", "negative"
- "priority": one of "low", "medium", "high", "urgent"
- "suggested_reply": a short 2-4 sentence draft reply an agent could send,
  professional and empathetic in tone.

Priority guidance:
- "urgent" = service completely down, payment failure, security issue
- "high" = customer blocked from using the product
- "medium" = inconvenience but workaround exists
- "low" = general question or minor request

Language guidance for "suggested_reply" (read carefully, this is strict):
- First, check: does the customer's subject and description contain ANY
  Hindi words, Devanagari script, or Hinglish phrasing (e.g. "kar diya",
  "hai", "nahi", "paisa", "jaldi", "aapka")?
- If YES (any Hindi/Hinglish present) → reply in natural Hinglish.
- If NO (the message is entirely in standard English, with no Hindi words
  at all) → reply ONLY in plain, professional English. Do not use any Hindi
  or Hinglish words in this case, even a single one.
- When in doubt, or if the message is fully in English, default to English.
  Do not introduce Hinglish into an English-only conversation.

Example: "The file only contains 60% of expected rows" → this is fully
English → reply must be fully English, no Hindi words.

Example: "Maine kal UPI se payment kiya tha" → this contains Hindi words
→ reply in Hinglish.

If similar past tickets are provided, use them to inform your classification
and make the suggested_reply more specific and helpful.
"""


def _build_user_message(subject: str, description: str,
                         similar_tickets: list[dict]) -> str:
    """
    Builds the user message with optional RAG context.
    If similar tickets exist, they're included as examples
    before the current ticket — this is the core of RAG:
    retrieved context + new query → better LLM output.
    """
    message = f"Subject: {subject}\n\nDescription: {description}"

    if similar_tickets:
        context_lines = ["\n\nSimilar past tickets for context:"]
        for i, ticket in enumerate(similar_tickets, 1):
            context_lines.append(
                f"\n[{i}] Category: {ticket['category']} | "
                f"Priority: {ticket['priority']} | "
                f"Similarity: {ticket['score']}\n"
                f"Text: {ticket['text']}"
            )
        message += "\n".join(context_lines)

    return message


def classify_ticket(subject: str, description: str,
                    similar_tickets: list[dict] | None = None) -> dict:
    """
    LLM call with optional RAG context.
    similar_tickets=None → v1 behavior (no retrieval)
    similar_tickets=[]   → cold start (retrieval ran but found nothing)
    similar_tickets=[..] → full RAG (retrieved context included in prompt)
    """
    if similar_tickets is None:
        similar_tickets = []

    user_message = _build_user_message(subject, description, similar_tickets)

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": CLASSIFY_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.3,
    )

    raw = response.choices[0].message.content
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.error(f"Failed to parse LLM JSON output: {raw}")
        return {
            "category": "general",
            "sentiment": "neutral",
            "priority": "medium",
            "suggested_reply": "Thank you for reaching out — our team will review your request shortly.",
        }