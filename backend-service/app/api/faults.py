from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any
from app.repositories import FaultRepository
from app.services.simulator_client import simulator_client

router = APIRouter(prefix="/api", tags=["Faults"])
fault_repo = FaultRepository()

@router.get("/faults")
async def get_faults(active: Optional[bool] = True):
    """Fetch active or all persistent faults from TimescaleDB"""
    try:
        if active:
            db_faults = fault_repo.get_active_faults()
            return {"activeFaults": db_faults, "active_faults": db_faults}
        return fault_repo.get_latest_faults()
    except Exception as e:
        print(f"[Fault API GET Error] {e}")
        return {"activeFaults": [], "active_faults": []}

@router.get("/faults/history")
async def get_fault_history():
    """Fetch full historical audit log of injected & removed faults"""
    return fault_repo.get_fault_history()

@router.post("/faults/inject")
@router.post("/faults")
async def inject_fault(payload: dict):
    """Store fault in TimescaleDB and inject into live simulator telemetry stream"""
    uav_id = payload.get("uavId") or payload.get("uav_id") or "UAV-TAPAS-201"
    engine_id = payload.get("engineId") or payload.get("engine_id") or "ROTAX-914-9982"
    fault_type = payload.get("faultType") or payload.get("type") or payload.get("fault_type") or "ENGINE_OVERHEAT"
    severity = payload.get("severity") or payload.get("severityPercent") or "HIGH"
    created_by = payload.get("createdBy") or payload.get("created_by") or "Tactical Operator / ADE GCS"
    description = payload.get("description") or f"Injected fault: {fault_type}"
    mission_id = payload.get("missionId") or payload.get("mission_id") or "MSN-IND-7701"

    # 1. Store in TimescaleDB
    db_record = fault_repo.inject_fault_db(
        uav_id=uav_id,
        engine_id=engine_id,
        fault_type=fault_type,
        severity=str(severity),
        created_by=created_by,
        description=description,
        mission_id=mission_id
    )

    # 2. Forward to simulator engine client
    try:
        await simulator_client.inject_fault(payload)
    except Exception as e:
        print(f"[Simulator Inject Sync Error] {e}")

    return db_record or {"status": "INJECTED", "fault": payload}

@router.patch("/faults/{fault_id}/remove")
@router.post("/faults/clear")
async def clear_fault(payload: dict, fault_id: Optional[str] = None):
    """Soft-remove fault in TimescaleDB (active=false, status='REMOVED') and clear from simulator"""
    target_id = fault_id or payload.get("id") or payload.get("faultId") or payload.get("fault_id")
    
    # 1. Update in TimescaleDB
    if target_id:
        fault_repo.remove_fault_db(target_id)

    # 2. Clear from simulator client
    try:
        await simulator_client.clear_fault(payload)
    except Exception as e:
        print(f"[Simulator Clear Sync Error] {e}")

    return {"status": "REMOVED", "id": target_id}

