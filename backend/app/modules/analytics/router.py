from fastapi import APIRouter, Depends

from app.common.responses import ApiResponse
from app.core.security import CurrentUser, require_roles
from app.core.supabase import get_supabase_admin

router = APIRouter()


@router.get("/overview", response_model=ApiResponse[dict])
async def overview(_: CurrentUser = Depends(require_roles("admin"))) -> ApiResponse[dict]:
    client = get_supabase_admin()
    patients = client.table("patients").select("id", count="exact").execute().count or 0
    alerts = client.table("alerts").select("id", count="exact").is_("acknowledged_at", "null").execute().count or 0
    predictions = client.table("predictions").select("id", count="exact").execute().count or 0
    return ApiResponse(data={"patients": patients, "open_alerts": alerts, "predictions": predictions})


@router.get("/icu-occupancy", response_model=ApiResponse[dict])
async def icu_occupancy(_: CurrentUser = Depends(require_roles("admin"))) -> ApiResponse[dict]:
    client = get_supabase_admin()
    active = client.table("patients").select("id", count="exact").eq("status", "active").execute().count or 0
    critical = client.table("alerts").select("patient_id", count="exact").eq("severity", "critical").is_("acknowledged_at", "null").execute().count or 0
    return ApiResponse(data={"active_patients": active, "critical_patients": critical, "estimated_icu_occupancy": critical})


@router.get("/critical-patients", response_model=ApiResponse[dict])
async def critical_patients(_: CurrentUser = Depends(require_roles("doctor", "admin"))) -> ApiResponse[dict]:
    rows = (
        get_supabase_admin()
        .table("alerts")
        .select("patient_id,severity,title,created_at")
        .eq("severity", "critical")
        .is_("acknowledged_at", "null")
        .order("created_at", desc=True)
        .limit(100)
        .execute()
        .data
    )
    patient_ids = sorted({row["patient_id"] for row in rows})
    return ApiResponse(data={"count": len(patient_ids), "patient_ids": patient_ids, "alerts": rows})


@router.get("/sepsis-trends", response_model=ApiResponse[dict])
async def sepsis_trends(_: CurrentUser = Depends(require_roles("admin"))) -> ApiResponse[dict]:
    rows = (
        get_supabase_admin()
        .table("predictions")
        .select("created_at,result")
        .order("created_at", desc=True)
        .limit(500)
        .execute()
        .data
    )
    buckets: dict[str, dict[str, float]] = {}
    for row in rows:
        day = row["created_at"][:10]
        result = row.get("result") or {}
        bucket = buckets.setdefault(day, {"total": 0, "sepsis_positive": 0, "avg_probability": 0})
        bucket["total"] += 1
        bucket["sepsis_positive"] += 1 if result.get("sepsis") else 0
        bucket["avg_probability"] += float(result.get("sepsis_probability") or result.get("probability") or 0)
    for bucket in buckets.values():
        if bucket["total"]:
            bucket["avg_probability"] = round(bucket["avg_probability"] / bucket["total"], 4)
    return ApiResponse(data={"trends": buckets})


@router.get("/mortality", response_model=ApiResponse[dict])
async def mortality_analytics(_: CurrentUser = Depends(require_roles("admin"))) -> ApiResponse[dict]:
    rows = get_supabase_admin().table("predictions").select("result").limit(1000).execute().data
    risks = [float((row.get("result") or {}).get("mortality_risk") or 0) for row in rows]
    high = len([risk for risk in risks if risk >= 0.6])
    avg = round(sum(risks) / len(risks), 4) if risks else 0
    return ApiResponse(data={"average_mortality_risk": avg, "high_mortality_risk_count": high})


@router.get("/recovery", response_model=ApiResponse[dict])
async def recovery_analytics(_: CurrentUser = Depends(require_roles("admin"))) -> ApiResponse[dict]:
    client = get_supabase_admin()
    discharged = client.table("patients").select("id", count="exact").eq("status", "discharged").execute().count or 0
    active = client.table("patients").select("id", count="exact").eq("status", "active").execute().count or 0
    total = active + discharged
    return ApiResponse(data={"discharged": discharged, "active": active, "recovery_rate": discharged / total if total else 0})


@router.get("/alerts", response_model=ApiResponse[dict])
async def alert_analytics(_: CurrentUser = Depends(require_roles("admin"))) -> ApiResponse[dict]:
    rows = get_supabase_admin().table("alerts").select("severity,acknowledged_at,created_at").limit(1000).execute().data
    by_severity: dict[str, int] = {}
    acknowledged = 0
    for row in rows:
        by_severity[row["severity"]] = by_severity.get(row["severity"], 0) + 1
        acknowledged += 1 if row.get("acknowledged_at") else 0
    return ApiResponse(data={"total": len(rows), "acknowledged": acknowledged, "open": len(rows) - acknowledged, "by_severity": by_severity})
