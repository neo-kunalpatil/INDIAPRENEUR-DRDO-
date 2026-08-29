import asyncio
from typing import Dict, Any

class DegradationEngine:
    def __init__(self):
        self.state = {
            "oil": 12.0, "fuel": 8.0, "thermal": 15.0, "electrical": 5.0,
            "vibration": 10.0, "sensor": 2.0, "turbo": 18.0, "battery": 11.0
        }

    def update(self, telemetry: Dict[str, Any]):
        dt = 1.0
        oil_temp = telemetry.get("oilTemp", telemetry.get("oil_temp_c", 80))
        egt = telemetry.get("egt", telemetry.get("egt_c", 600))
        if isinstance(egt, list):
            egt = egt[0]
        vib_z = telemetry.get("vibZ", telemetry.get("vib_z_g", 0.1))

        if oil_temp > 115:
            self.state["oil"] += 0.005 * dt
        if egt > 850:
            self.state["thermal"] += 0.008 * dt
        if vib_z > 2.0:
            self.state["vibration"] += 0.01 * dt
            self.state["turbo"] += 0.015 * dt

        for k in self.state:
            self.state[k] = min(100.0, self.state[k])


class ReliabilityEngine:
    def calculate(self, degradation: Dict[str, float]):
        max_deg = max(degradation.values())
        reliability = max(0.0, 100.0 - (max_deg * 1.2))
        return {
            "reliability_score": reliability,
            "availability_score": min(100.0, reliability + 10.0),
            "mission_success_probability": max(0.0, reliability - 5.0)
        }


class MissionRiskEngine:
    def evaluate(self, telemetry: Dict[str, Any], reliability: float):
        risk_score = 100.0 - reliability
        mission_phase = telemetry.get("missionPhase", telemetry.get("mission_phase", "UNKNOWN"))
        if mission_phase == "TAKEOFF":
            risk_score += 15
        elif mission_phase == "CLIMB":
            risk_score += 10

        risk_level = "LOW"
        if risk_score > 85:
            risk_level = "CRITICAL"
        elif risk_score > 60:
            risk_level = "HIGH"
        elif risk_score > 30:
            risk_level = "MODERATE"

        return {
            "mission_phase": mission_phase,
            "risk_score": min(100.0, risk_score),
            "risk_level": risk_level,
            "failure_probability": min(1.0, risk_score / 100.0)
        }


class MaintenancePlanner:
    def plan(self, degradation: Dict[str, float]):
        actions = []
        if degradation.get("turbo", 0) > 40:
            actions.append({"priority": "LONG-TERM", "action": "Turbo Overhaul within 100 Hours", "reason": "Turbo degradation exceeded 40%", "recommended_by": "RUL Engine"})
        if degradation.get("thermal", 0) > 60:
            actions.append({"priority": "SHORT-TERM", "action": "Inspect Cooling System", "reason": "High thermal stress accumulation", "recommended_by": "AI Analytics"})
        if degradation.get("oil", 0) > 80:
            actions.append({"priority": "IMMEDIATE", "action": "Replace Oil & Filter", "reason": "Critical oil breakdown", "recommended_by": "Degradation Engine"})
        if not actions:
            actions.append({"priority": "LOG", "action": "Continue Standard Operations", "reason": "All systems nominal", "recommended_by": "System"})
        return actions


class RULService:
    def __init__(self, ws_manager):
        self.deg_engine = DegradationEngine()
        self.rel_engine = ReliabilityEngine()
        self.risk_engine = MissionRiskEngine()
        self.planner = MaintenancePlanner()
        self.ws_manager = ws_manager
        self.latest_telemetry = None
        self.op_hours = 1245.5
        self.running = False

    def feed_data(self, data: Dict[str, Any]):
        self.latest_telemetry = data

    async def start(self):
        self.running = True
        while self.running:
            await self.process()
            await asyncio.sleep(1.0)

    async def process(self):
        if not self.latest_telemetry:
            return

        self.op_hours += (1.0 / 3600.0)
        self.deg_engine.update(self.latest_telemetry)
        deg = self.deg_engine.state
        rel = self.rel_engine.calculate(deg)
        risk = self.risk_engine.evaluate(self.latest_telemetry, rel["reliability_score"])
        maint = self.planner.plan(deg)

        max_deg = max(deg.values())
        rul_hours = max(0.0, (100.0 - max_deg) * 5.5)
        rul_cycles = int(rul_hours / 2.5)

        predicted_failure = "None"
        if max_deg == deg["turbo"]:
            predicted_failure = "Turbo Failure"
        elif max_deg == deg["thermal"]:
            predicted_failure = "Thermal Runaway"

        rul_data = {
            "rul_hours": rul_hours,
            "rul_cycles": rul_cycles,
            "confidence": 92.5,
            "predicted_failure": predicted_failure,
            "failure_probability": risk["failure_probability"],
            "reason": f"{predicted_failure} signatures expanding. High frequency vibration correlation.",
            "opHours": self.op_hours
        }

        await self.ws_manager.broadcast("rul:update", rul_data)
        await self.ws_manager.broadcast("degradation:update", deg)
        await self.ws_manager.broadcast("reliability:update", rel)
        await self.ws_manager.broadcast("mission-risk:update", risk)
        await self.ws_manager.broadcast("maintenance:update", maint)
