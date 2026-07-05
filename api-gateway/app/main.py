import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

app = FastAPI(title="API Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route map: URL prefix → downstream service URL
# This is the entire routing table — adding a new service
# means adding one line here, nothing else changes.
ROUTE_MAP = {
    "/api/auth": settings.AUTH_SERVICE_URL,
    "/api/tickets": settings.TICKET_SERVICE_URL,
    "/api/notifications": settings.NOTIFICATION_SERVICE_URL,
}


@app.get("/health")
def health():
    return {"status": "ok", "service": "api-gateway"}


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PATCH", "PUT", "DELETE"])
async def proxy(path: str, request: Request):
    """
    Generic reverse proxy — catches ALL /api/* routes and
    forwards them to the correct downstream service.
    The gateway doesn't know or care about specific routes —
    it just matches the prefix and forwards everything else.
    This is the 'dumb pipe' pattern: gateway routes, services decide.
    """
    full_path = f"/api/{path}"

    # Find which service owns this path prefix
    target_base = None
    matched_prefix = None
    for prefix, base_url in ROUTE_MAP.items():
        if full_path.startswith(prefix):
            target_base = base_url
            matched_prefix = prefix
            break

    if not target_base:
        return Response(content="Route not found", status_code=404)

    # Build downstream URL:
    # /api/auth/login → http://localhost:8001/auth/login
    # /api/tickets    → http://localhost:8002/tickets
    downstream_path = full_path.replace("/api", "", 1)
    url = f"{target_base}{downstream_path}"

    # Forward the request — preserving method, headers, body, query params
    body = await request.body()
    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("accept-encoding", None)
    headers.pop("content-length", None)
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.request(
            method=request.method,
            url=url,
            params=request.query_params,
            content=body,
            headers=headers,
        )

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        media_type=resp.headers.get("content-type"),
    )