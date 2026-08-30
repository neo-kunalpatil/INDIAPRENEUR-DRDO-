import httpx
import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException
from app.config import settings

logger = logging.getLogger("SimulatorClient")

class SimulatorClient:
    def __init__(self):
        self.base_url = settings.SIMULATOR_API.rstrip("/")
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=5.0)

    async def _get(self, endpoint: str) -> Dict[str, Any]:
        try:
            response = await self.client.get(endpoint)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as exc:
            logger.error(f"Simulator GET request failed ({endpoint}): {exc}")
            raise HTTPException(
                status_code=503,
                detail={"status": "offline", "message": "Simulator service unavailable", "error": str(exc)}
            )
        except httpx.HTTPStatusError as exc:
            logger.error(f"Simulator returned status error ({endpoint}): {exc.response.status_code}")
            raise HTTPException(
                status_code=exc.response.status_code,
                detail={"status": "error", "message": f"Simulator error {exc.response.status_code}"}
            )

    async def _post(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            response = await self.client.post(endpoint, json=data)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as exc:
            logger.error(f"Simulator POST request failed ({endpoint}): {exc}")
            raise HTTPException(
                status_code=503,
                detail={"status": "offline", "message": "Simulator service unavailable", "error": str(exc)}
            )
        except httpx.HTTPStatusError as exc:
            logger.error(f"Simulator returned status error ({endpoint}): {exc.response.status_code}")
            raise HTTPException(
                status_code=exc.response.status_code,
                detail={"status": "error", "message": f"Simulator error {exc.response.status_code}"}
            )

    async def get_telemetry_latest(self) -> Dict[str, Any]:
        return await self._get("/api/telemetry/latest")

    async def get_engine(self) -> Dict[str, Any]:
        return await self._get("/api/engine")

    async def get_environment(self) -> Dict[str, Any]:
        return await self._get("/api/environment")

    async def get_history(self) -> Dict[str, Any]:
        return await self._get("/api/history")

    async def get_alerts(self) -> Dict[str, Any]:
        return await self._get("/api/alerts")

    async def get_health(self) -> Dict[str, Any]:
        return await self._get("/api/status")

    async def post_telemetry(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._post("/api/telemetry", data)

    async def post_mission(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._post("/api/mission", data)

    async def post_faults(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._post("/api/faults", data)

    async def post_health(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._post("/api/health", data)

    async def post_fft(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._post("/api/fft", data)

simulator_client = SimulatorClient()
