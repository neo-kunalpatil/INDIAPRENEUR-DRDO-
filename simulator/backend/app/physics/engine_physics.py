import random

class EnginePhysics:
    def __init__(self):
        self.state = {
            "rpm": 1200.0,
            "oil_temp_c": 80.0,
            "oil_pressure_kpa": 300.0,
            "cht_c": 150.0,
            "egt_c": 600.0,
            "fuel_flow_lph": 10.0,
            "throttle_pct": 10.0,
            "map_kpa": 100.0,
            "lambda": 1.0,
            "battery_v": 28.0,
            "current_a": 5.0,
            "vib_x_g": 0.1,
            "vib_y_g": 0.1,
            "vib_z_g": 0.1,
            "load_pct": 10.0,
            "torque_nm": 20.0
        }

        self.mission = {
            "altitude_m": 0.0,
            "speed_mps": 0.0,
            "oat_c": 15.0,
            "humidity_pct": 50.0,
            "pressure_kpa": 101.0,
            "mission_phase": "GROUND"
        }

        self.faults = {
            "sensorDrift": False,
            "rpmSensorFailure": False,
            "overheat": False,
            "oilLeak": False,
            "fuelStarvation": False
        }

    def _noise(self, std: float) -> float:
        return (random.random() + random.random() + random.random() - 1.5) * std

    def tick(self):
        # 10Hz Tick Simulation
        target_rpm = 0.0 if self.faults["rpmSensorFailure"] else 1200.0 + (self.state["throttle_pct"] * 48.0)
        self.state["rpm"] += (target_rpm - self.state["rpm"]) * 0.05 + self._noise(2.0)

        target_egt = 600.0 + (self.state["throttle_pct"] * 3.0) + (200.0 if self.faults["overheat"] else 0.0)
        self.state["egt_c"] += (target_egt - self.state["egt_c"]) * 0.01 + self._noise(1.0)

        self.state["cht_c"] += (target_egt * 0.3 - self.state["cht_c"]) * 0.005 + self._noise(0.5)

        if self.faults["oilLeak"]:
            self.state["oil_pressure_kpa"] = max(0.0, self.state["oil_pressure_kpa"] - 0.5)
        else:
            self.state["oil_pressure_kpa"] = 200.0 + (self.state["rpm"] * 0.04) + self._noise(1.0)

        if self.faults["fuelStarvation"]:
            self.state["fuel_flow_lph"] = max(0.0, self.state["fuel_flow_lph"] - 1.0)
        else:
            self.state["fuel_flow_lph"] = (self.state["rpm"] * 0.005) + self._noise(0.1)

        self.state["vib_x_g"] = (self.state["rpm"] / 5000.0) * 0.5 + self._noise(0.05)

        self.state["load_pct"] = (self.state["throttle_pct"] * 0.8) + (self.state["rpm"] / 6000.0 * 20.0)
        self.state["torque_nm"] = self.state["load_pct"] * 1.5
