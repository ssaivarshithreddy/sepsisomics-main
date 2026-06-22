import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.common.pagination import PaginationParams
from app.core.security import decode_jwt
from app.modules.vitals.repository import VitalsRepository

router = APIRouter()


@router.websocket("/vitals")
async def vitals_stream(websocket: WebSocket) -> None:
    token = websocket.query_params.get("token")
    patient_id = websocket.query_params.get("patient_id")
    if not token or not patient_id:
        await websocket.close(code=1008)
        return
    try:
        decode_jwt(token)
    except Exception:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    repository = VitalsRepository()
    last_seen: str | None = None
    try:
        while True:
            rows = repository.list_for_patient(patient_id, PaginationParams(limit=1, offset=0))
            if rows and rows[0]["id"] != last_seen:
                last_seen = rows[0]["id"]
                await websocket.send_json({"type": "vital.updated", "data": rows[0]})
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        return
