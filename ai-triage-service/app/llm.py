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

CRITICAL RULE for "suggested_reply" — the DEFAULT is always English:
1. Write "suggested_reply" in ENGLISH by default. This is the default for
   every ticket unless step 2 applies.
2. ONLY switch to Hinglish if the customer's subject or description contains
   actual Hindi/Devanagari words (such as "hai", "nahi", "kar diya", "paisa",
   "jaldi", "aapka", "kyunki", "maine"). A single English word like "hey",
   "please", or "resolve" does NOT count as Hindi — the customer must use
   genuine Hindi vocabulary, not just casual/informal English.
3. If you are unsure whether the input counts as Hindi or Hinglish, choose
   ENGLISH. English is always the safe default.
4. Never mix languages within a single reply. Pick one: English or Hinglish,
   based on the rule above.

Remember: the default is English. Only use Hinglish when genuine Hindi words
are clearly present in the customer's own message.

If similar past tickets are provided, use them to inform your classification
and make the suggested_reply more specific and helpful.
"""

REPLY_SYSTEM_PROMPT = """You are a helpful customer support AI assistant
replying inside an ongoing support conversation.

You will be given the original ticket (subject + description) and the
customer's latest follow-up message. Write a short, direct, helpful reply
(2-4 sentences) to the customer's latest message specifically — not a
generic restatement of the original ticket.

CRITICAL RULE — the DEFAULT is always English:
1. Reply in ENGLISH by default.
2. ONLY reply in Hinglish if the customer's latest message contains genuine
   Hindi/Devanagari vocabulary (e.g. "hai", "nahi", "kar diya", "paisa",
   "kyunki", "maine"). Casual English slang ("hey", "lol", "kinda") does NOT
   count as Hindi.
3. If unsure, default to English.

Respond with ONLY the reply text — no JSON, no labels, no extra commentary.
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


def generate_conversation_reply(subject: str, description: str, customer_message: str) -> str:
    """
    Generates a contextual AI reply to a customer's follow-up message
    inside an existing ticket's conversation thread.
    """
    user_message = (
        f"Original ticket subject: {subject}\n"
        f"Original ticket description: {description}\n\n"
        f"Customer's latest message: {customer_message}"
    )

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": REPLY_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.4,
    )

    return response.choices[0].message.content.strip()