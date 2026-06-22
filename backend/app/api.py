from fastapi import APIRouter

from app.modules.alerts.router import router as alerts_router
from app.modules.analytics.router import router as analytics_router
from app.modules.auth.router import router as auth_router
from app.modules.collaboration.router import router as collaboration_router
from app.modules.ml.router import router as ml_router
from app.modules.monitoring.router import router as monitoring_router
from app.modules.notes.router import router as notes_router
from app.modules.notifications.router import router as notifications_router
from app.modules.patients.router import router as patients_router
from app.modules.predictions.router import router as predictions_router
from app.modules.realtime.router import router as realtime_router
from app.modules.summaries.router import router as summaries_router
from app.modules.timeline.router import router as timeline_router
from app.modules.vitals.router import router as vitals_router

router = APIRouter()
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(patients_router, prefix="/patients", tags=["patients"])
router.include_router(vitals_router, prefix="/vitals", tags=["vitals"])
router.include_router(alerts_router, prefix="/alerts", tags=["alerts"])
router.include_router(predictions_router, prefix="/predictions", tags=["predictions"])
router.include_router(notes_router, prefix="/notes", tags=["notes"])
router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
router.include_router(realtime_router, prefix="/realtime", tags=["realtime"])
router.include_router(ml_router, prefix="/ml", tags=["ml"])
router.include_router(timeline_router, prefix="/timeline", tags=["timeline"])
router.include_router(summaries_router, prefix="/summaries", tags=["summaries"])
router.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
router.include_router(collaboration_router, prefix="/collaboration", tags=["collaboration"])
router.include_router(monitoring_router, prefix="/monitoring", tags=["monitoring"])
