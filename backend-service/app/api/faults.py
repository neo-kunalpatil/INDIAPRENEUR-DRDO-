from fastapi import APIRouter
from app.repositories import FaultRepository

router = APIRouter(prefix="/api", tags=["Faults"])
fault_repo = FaultRepository()

@router.get("/faults")
async def get_faults():
    return fault_repo.get_latest_faults()
