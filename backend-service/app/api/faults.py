from fastapi import APIRouter
from app.repositories import FaultRepository
from app.services.simulator_client import simulator_client

router = APIRouter(prefix="/api", tags=["Faults"])
fault_repo = FaultRepository()

@router.get("/faults")
async def get_faults():
    return fault_repo.get_latest_faults()

@router.get("/faults/active")
async def get_active_faults():
    try:
        return await simulator_client._get("/api/faults")
    except Exception:
        return {"activeFaults": [], "active_faults": []}

@router.post("/faults/inject")
async def inject_fault(payload: dict):
    return await simulator_client.inject_fault(payload)

@router.post("/faults/clear")
async def clear_fault(payload: dict):
    return await simulator_client.clear_fault(payload)
