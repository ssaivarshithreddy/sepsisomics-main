from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.common.responses import ApiResponse
from app.core.cache import cache_get, cache_set
from app.core.security import CurrentUser, require_roles
from app.core.supabase import get_supabase_admin

router = APIRouter()


@router.get("/diagnostics", response_model=ApiResponse[dict])
async def diagnostics(_: CurrentUser = Depends(require_roles("admin"))) -> ApiResponse[dict]:
    db_ok = True
    redis_ok = True
    try:
        get_supabase_admin().table("patients").select("id").limit(1).execute()
    except Exception:
        db_ok = False
    try:
        await cache_set("diagnostics:last_check", {"at": datetime.now(timezone.utc).isoformat()}, 10)
        await cache_get("diagnostics:last_check")
    except Exception:
        redis_ok = False
    return ApiResponse(data={"database": "ok" if db_ok else "error", "redis": "ok" if redis_ok else "degraded"})


@router.get("/realtime", response_model=ApiResponse[dict])
async def realtime_monitor(_: CurrentUser = Depends(require_roles("admin"))) -> ApiResponse[dict]:
    return ApiResponse(data={"status": "ready", "transport": ["supabase_realtime", "websocket"], "vitals_poll_interval_seconds": 3})
