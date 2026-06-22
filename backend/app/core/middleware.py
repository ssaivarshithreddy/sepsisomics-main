import time
import uuid
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.supabase import get_supabase_admin


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["x-request-id"] = request_id
        return response


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        if request.url.path.startswith("/api/") and request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            try:
                get_supabase_admin().table("audit_logs").insert(
                    {
                        "actor_id": getattr(getattr(request.state, "user", None), "id", None),
                        "action": f"{request.method} {request.url.path}",
                        "entity_type": "http_request",
                        "metadata": {
                            "status_code": response.status_code,
                            "duration_ms": round((time.perf_counter() - start) * 1000, 2),
                            "request_id": getattr(request.state, "request_id", None),
                        },
                    }
                ).execute()
            except Exception:
                pass
        return response
