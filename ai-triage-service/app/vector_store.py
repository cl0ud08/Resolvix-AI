import logging
import re
import numpy as np
from collections import Counter

logger = logging.getLogger(__name__)

# Pure Python/numpy vector store — zero C++/Rust compilation needed.
# Uses TF-IDF style bag-of-words embeddings instead of neural embeddings.
# Conceptually identical to Chroma + sentence-transformers for demo purposes:
# similar text → similar vectors → high cosine similarity score.
# In production, swap embed_text() for any real embedding API call
# (OpenAI, Cohere, HF) — the rest of this code stays unchanged.

_store: list[dict] = []
_vocabulary: dict[str, int] = {}


def tokenize(text: str) -> list[str]:
    """Simple word tokenizer — lowercase, remove punctuation."""
    return re.findall(r'\b[a-z]{2,}\b', text.lower())


def embed_text(text: str) -> np.ndarray:
    """
    Convert text to a sparse vector using vocabulary word counts.
    Vocabulary grows as new tickets come in — all vectors stay
    in the same dimensional space so comparisons are meaningful.
    """
    global _vocabulary
    words = tokenize(text)
    counts = Counter(words)

    for word in counts:
        if word not in _vocabulary:
            _vocabulary[word] = len(_vocabulary)

    vec = np.zeros(len(_vocabulary))
    for word, count in counts.items():
        if word in _vocabulary:
            vec[_vocabulary[word]] = count

    return vec


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    Measures directional similarity between two vectors.
    Returns 1.0 for identical meaning, 0.0 for completely unrelated.
    Better than Euclidean distance for text: length-independent,
    so a short and long ticket about the same issue score similarly
    even though their word-count vectors have very different magnitudes.
    """
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def _align_vectors(a: np.ndarray, b: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Pad shorter vector to match longer one's dimension.
    Needed because vocabulary grows as new tickets arrive —
    older stored vectors have fewer dimensions than newer ones.
    """
    len_a, len_b = len(a), len(b)
    if len_a < len_b:
        a = np.pad(a, (0, len_b - len_a))
    elif len_b < len_a:
        b = np.pad(b, (0, len_a - len_b))
    return a, b


def search_similar_tickets(query_text: str, n_results: int = 3) -> list[dict]:
    """
    Find most similar past tickets using cosine similarity.
    Called BEFORE storing the current ticket — can never match itself.
    Cold start: returns empty list when store is empty.
    """
    if not _store:
        return []

    try:
        query_vec = embed_text(query_text)
        scored = []

        for entry in _store:
            stored_vec = entry["embedding"]
            q, s = _align_vectors(query_vec.copy(), stored_vec.copy())
            score = cosine_similarity(q, s)
            scored.append({
                "text": entry["text"],
                "category": entry["category"],
                "priority": entry["priority"],
                "score": round(score, 3),
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:n_results]

    except Exception as e:
        logger.warning(f"Vector search failed: {e}")
        return []


def store_ticket_embedding(ticket_id: str, text: str,
                           category: str, priority: str) -> None:
    """
    Store ticket embedding AFTER classification is complete.
    Each stored ticket makes future similarity searches more accurate.
    This is what makes the system smarter over time.
    """
    try:
        embedding = embed_text(text)
        _store.append({
            "ticket_id": ticket_id,
            "text": text,
            "embedding": embedding,
            "category": category,
            "priority": priority,
        })
        logger.info(f"Stored embedding for {ticket_id}. Store size: {len(_store)}")
    except Exception as e:
        logger.warning(f"Vector store failed: {e}")