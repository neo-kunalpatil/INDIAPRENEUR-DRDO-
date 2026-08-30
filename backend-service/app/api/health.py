from fastapi import APIRouter
from app.repositories import HealthRepository, AIAnomalyRepository

router = APIRouter(prefix="/api", tags=["Health"])
health_repo = HealthRepository()
ai_repo = AIAnomalyRepository()

@router.get("/health")
async def get_health():
    return health_repo.get_latest_health()

@router.get("/anomalies")
async def get_anomalies():
    return ai_repo.get_latest_anomalies()
