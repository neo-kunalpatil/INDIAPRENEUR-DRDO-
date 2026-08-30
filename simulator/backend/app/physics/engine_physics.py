import random
import math

class EnginePhysics:
    def __init__(self):
        # Accumulating physical engine wear (never decreases automatically)
        self.wear = 0.0

        # Dynamic state controls
        self.is_paused = False

        # State vector (supports both camelCase and snake_case for full UI/API compatibility)
        self.state = {
            "rpm": 1200.0,
            "raw_rpm": 1200.0,
            "throttle": 10.0,
            "throttle_pct": 10.0,
            "map": 100.0,
            "map_kpa": 100.0,
            "raw_map": 100.0,
            "fuelFlow": 10.0,
            "fuel_flow_lph": 10.0,
            "fuelRemaining": 150.0,
            "egt": 600.0,
            "egt_c": 600.0,
            "raw_egt": 600.0,
            "cht": 150.0,
            "cht_c": 150.0,
            "raw_cht": 150.0,
            "oilTemp": 80.0,
            "oil_temp_c": 80.0,
            "oilPressure": 300.0,
            "oil_pressure_kpa": 300.0,
            "batteryVoltage": 28.0,
            "battery_v": 28.0,
            "altitude": 0.0,
            "airspeed": 0.0,
            "verticalSpeed": 0.0,
            "health": 100.0,
            "lambda": 1.0,
            "current_a": 5.0,
            "vib_x_g": 0.1,
            "vib_y_g": 0.1,
            "vib_z_g": 0.1,
            "vibZ": 0.1,
            "vibration": 0.1,
            "load_pct": 10.0,
            "torque_nm": 20.0,
            "power_kw": 2.5,
            "turbo_boost": 0.2,
            "fuel_pressure_kpa": 300.0,
            "afr": 14.7,
            "active_fault_count": 0
        }

        self.mission = {
            "altitude_m": 0.0,
            "speed_mps": 0.0,
            "oat_c": 15.0,
            "humidity_pct": 50.0,
            "pressure_kpa": 101.0,
            "mission_phase": "GROUND"
        }

        # Dynamic Fault Registry tracking active status and severity multiplier
        self.faults = {
            "Oil Leak": {"active": False, "sev": 1.0},
            "Fuel Leak": {"active": False, "sev": 1.0},
            "Turbo Failure": {"active": False, "sev": 1.0},
            "Injector Failure": {"active": False, "sev": 1.0},
            "Spark Plug Failure": {"active": False, "sev": 1.0},
            "Battery Failure": {"active": False, "sev": 1.0},
            "Alternator Failure": {"active": False, "sev": 1.0},
            "RPM Sensor Failure": {"active": False, "sev": 1.0},
            "EGT Sensor Failure": {"active": False, "sev": 1.0},
            "CHT Sensor Failure": {"active": False, "sev": 1.0},
            "Oil Pressure Loss": {"active": False, "sev": 1.0},
            "Overheating": {"active": False, "sev": 1.0},
            "Excessive Vibration": {"active": False, "sev": 1.0},
            "Throttle Failure": {"active": False, "sev": 1.0},
            "MAP Sensor Failure": {"active": False, "sev": 1.0},
            "Fuel Pump Failure": {"active": False, "sev": 1.0},
            "Fuel Filter Clogging": {"active": False, "sev": 1.0},
            "Air Filter Blockage": {"active": False, "sev": 1.0},
            "Turbo Boost Leak": {"active": False, "sev": 1.0},
            "Turbo Overspeed": {"active": False, "sev": 1.0},
            "Cylinder Compression Loss": {"active": False, "sev": 1.0},
            "Valve Timing Fault": {"active": False, "sev": 1.0},
            "Bearing Wear": {"active": False, "sev": 1.0},
            "ECU Failure": {"active": False, "sev": 1.0},
            "Propeller Imbalance": {"active": False, "sev": 1.0},
            "Cooling Failure": {"active": False, "sev": 1.0},
            # Legacy alias keys for backwards compatibility
            "sensorDrift": {"active": False, "sev": 1.0},
            "rpmSensorFailure": {"active": False, "sev": 1.0},
            "overheat": {"active": False, "sev": 1.0},
            "oilLeak": {"active": False, "sev": 1.0},
            "fuelStarvation": {"active": False, "sev": 1.0}
        }

    def set_fault(self, fault_name: str, active: bool, severity_str: str = "MEDIUM"):
        sev_mult = 1.0
        if severity_str == "LOW": sev_mult = 0.5
        elif severity_str == "MEDIUM": sev_mult = 1.0
        elif severity_str == "HIGH": sev_mult = 1.8
        elif severity_str == "CRITICAL": sev_mult = 2.8

        if fault_name in self.faults:
            self.faults[fault_name] = {"active": active, "sev": sev_mult}

        # Handle mapped aliases
        alias_map = {
            "Oil Leak": "oilLeak",
            "Fuel Pump Failure": "fuelStarvation",
            "Overheating": "overheat",
            "RPM Sensor Failure": "rpmSensorFailure"
        }
        if fault_name in alias_map:
            self.faults[alias_map[fault_name]] = {"active": active, "sev": sev_mult}

    def _is_active(self, fault_name: str) -> bool:
        f = self.faults.get(fault_name, {})
        if isinstance(f, dict):
            return f.get("active", False)
        return bool(f)

    def _get_sev(self, fault_name: str) -> float:
        f = self.faults.get(fault_name, {})
        if isinstance(f, dict):
            return f.get("sev", 1.0) if f.get("active", False) else 0.0
        return 1.0 if bool(f) else 0.0

    def _noise(self, std: float) -> float:
        return (random.random() + random.random() + random.random() - 1.5) * std

    def tick(self):
        # 10Hz Thermodynamics & Flight Physics Loop
        dt = 0.1

        # If mission is PAUSED, freeze all telemetry values completely
        if self.is_paused:
            return

        # -------------------------------------------------------------
        # 1. THROTTLE & CONTROL INFLUENCES
        # -------------------------------------------------------------
        effective_throttle = self.state["throttle_pct"]
        if self._is_active("Throttle Failure"):
            sev = self._get_sev("Throttle Failure")
            # Stuck or oscillating throttle
            effective_throttle = 45.0 + math.sin(random.random() * 10) * (15.0 * sev)

        # -------------------------------------------------------------
        # 2. MANIFOLD ABSOLUTE PRESSURE (MAP) & TURBO BOOST PHYSICS
        # MAP = AtmosphericPressure + TurboBoost - ThrottleLoss - FilterLoss
        # -------------------------------------------------------------
        base_turbo_boost = (effective_throttle / 100.0) * 0.85
        if self._is_active("Turbo Failure"):
            base_turbo_boost *= 0.1
        if self._is_active("Turbo Boost Leak"):
            base_turbo_boost *= (1.0 - 0.6 * self._get_sev("Turbo Boost Leak"))
        if self._is_active("Turbo Overspeed"):
            base_turbo_boost *= 1.45

        filter_loss = 0.0
        if self._is_active("Air Filter Blockage"):
            filter_loss = 25.0 * self._get_sev("Air Filter Blockage")

        calc_map = 101.3 + (base_turbo_boost * 100.0) - ((100.0 - effective_throttle) * 0.4) - filter_loss
        if self._is_active("Cylinder Compression Loss"):
            calc_map -= 18.0 * self._get_sev("Cylinder Compression Loss")

        self.state["turbo_boost"] = base_turbo_boost
        self.state["raw_map"] = max(20.0, calc_map)

        # MAP Sensor Failure
        if self._is_active("MAP Sensor Failure"):
            self.state["map"] = -999.0 if random.random() > 0.5 else 0.0
        else:
            self.state["map"] = self.state["raw_map"]
        self.state["map_kpa"] = self.state["map"]

        # -------------------------------------------------------------
        # 3. COMBUSTION, MISFIRE & ENGINE TORQUE -> RPM
        # -------------------------------------------------------------
        misfire_penalty = 0.0
        if self._is_active("Spark Plug Failure"):
            misfire_penalty += 150.0 * self._get_sev("Spark Plug Failure")
        if self._is_active("Injector Failure"):
            misfire_penalty += 250.0 * self._get_sev("Injector Failure")
        if self._is_active("Valve Timing Fault"):
            misfire_penalty += 200.0 * self._get_sev("Valve Timing Fault")
        if self._is_active("ECU Failure"):
            misfire_penalty += random.random() * 400.0

        target_rpm = 1200.0 + (effective_throttle * 48.0) * (self.state["raw_map"] / 100.0) - misfire_penalty

        if self._is_active("Fuel Pump Failure") or self._is_active("fuelStarvation"):
            target_rpm *= 0.15
        if self._is_active("Fuel Filter Clogging"):
            target_rpm *= (1.0 - 0.25 * self._get_sev("Fuel Filter Clogging"))

        # Smooth RPM inertia lerp
        self.state["raw_rpm"] += (target_rpm - self.state["raw_rpm"]) * 0.05 + self._noise(2.0)
        self.state["raw_rpm"] = max(0.0, self.state["raw_rpm"])

        # RPM Sensor Failure
        if self._is_active("RPM Sensor Failure") or self._is_active("rpmSensorFailure"):
            self.state["rpm"] = 0.0 if random.random() > 0.5 else 9999.0
        else:
            self.state["rpm"] = self.state["raw_rpm"]

        # Power & Torque output
        self.state["load_pct"] = (effective_throttle * 0.8) + (self.state["raw_rpm"] / 6000.0 * 20.0)
        self.state["torque_nm"] = max(0.0, self.state["load_pct"] * 1.65 - (misfire_penalty * 0.1))
        self.state["power_kw"] = (self.state["torque_nm"] * self.state["raw_rpm"]) / 9549.0

        # -------------------------------------------------------------
        # 4. FUEL SYSTEM PHYSICS (Fuel Flow, Pressure & AFR)
        # -------------------------------------------------------------
        base_fuel_flow = (self.state["raw_rpm"] * 0.005) + (effective_throttle * 0.15) + self._noise(0.1)
        if self._is_active("Fuel Leak"):
            base_fuel_flow *= (1.0 + 0.4 * self._get_sev("Fuel Leak"))
        if self._is_active("Fuel Pump Failure"):
            base_fuel_flow *= 0.05
        if self._is_active("Fuel Filter Clogging"):
            base_fuel_flow *= (1.0 - 0.3 * self._get_sev("Fuel Filter Clogging"))

        self.state["fuel_flow_lph"] = max(0.0, base_fuel_flow)
        self.state["fuelFlow"] = self.state["fuel_flow_lph"]

        # Deplete fuel remaining continuously
        drain_mult = 1.8 if self._is_active("Fuel Leak") else 1.0
        self.state["fuelRemaining"] = max(0.0, self.state["fuelRemaining"] - (self.state["fuelFlow"] * drain_mult / 36000.0))

        # -------------------------------------------------------------
        # 5. THERMODYNAMICS: EGT, CHT & OIL TEMP
        # -------------------------------------------------------------
        lean_mixture_heat = 0.0
        if self._is_active("Fuel Leak") or self._is_active("Fuel Filter Clogging"):
            lean_mixture_heat = 150.0

        target_egt = 600.0 + (effective_throttle * 3.2) + lean_mixture_heat
        if self._is_active("Overheating") or self._is_active("overheat"):
            target_egt += 250.0 * self._get_sev("Overheating")
        if self._is_active("Turbo Overspeed"):
            target_egt += 180.0

        self.state["raw_egt"] += (target_egt - self.state["raw_egt"]) * 0.01 + self._noise(1.0)
        
        if self._is_active("EGT Sensor Failure"):
            self.state["egt_c"] = 0.0
        else:
            self.state["egt_c"] = self.state["raw_egt"]
        self.state["egt"] = self.state["egt_c"]

        # CHT Physics
        target_cht = (self.state["raw_egt"] * 0.28) + (self.state["raw_rpm"] * 0.01)
        if self._is_active("Cooling Failure"):
            target_cht += 90.0 * self._get_sev("Cooling Failure")

        self.state["raw_cht"] += (target_cht - self.state["raw_cht"]) * 0.005 + self._noise(0.5)

        if self._is_active("CHT Sensor Failure"):
            self.state["cht_c"] = -50.0
        else:
            self.state["cht_c"] = self.state["raw_cht"]
        self.state["cht"] = self.state["cht_c"]

        # Oil Temp Physics
        friction_heat = 0.0
        if self._is_active("Bearing Wear"):
            friction_heat += 25.0
        if self._is_active("Oil Leak") or self._is_active("oilLeak") or self._is_active("Oil Pressure Loss"):
            friction_heat += 45.0 * self._get_sev("Oil Leak")

        target_oil_temp = 80.0 + (self.state["raw_rpm"] * 0.006) + friction_heat
        self.state["oil_temp_c"] += (target_oil_temp - self.state["oil_temp_c"]) * 0.008 + self._noise(0.2)
        self.state["oilTemp"] = self.state["oil_temp_c"]

        # -------------------------------------------------------------
        # 6. LUBRICATION & OIL PRESSURE
        # -------------------------------------------------------------
        calc_oil_press = 200.0 + (self.state["raw_rpm"] * 0.045) + self._noise(1.0)
        if self._is_active("Oil Leak") or self._is_active("oilLeak"):
            calc_oil_press -= 120.0 * self._get_sev("Oil Leak")
        if self._is_active("Oil Pressure Loss"):
            calc_oil_press *= 0.15

        self.state["oil_pressure_kpa"] = max(0.0, calc_oil_press)
        self.state["oilPressure"] = self.state["oil_pressure_kpa"]

        # -------------------------------------------------------------
        # 7. ELECTRICAL SYSTEM (Battery & Alternator)
        # -------------------------------------------------------------
        if self._is_active("Alternator Failure"):
            # Battery continuously discharges when alternator fails
            self.state["battery_v"] = max(10.0, self.state["battery_v"] - 0.015 * dt)
        elif self._is_active("Battery Failure"):
            self.state["battery_v"] = max(8.0, self.state["battery_v"] - 0.08 * dt)
        else:
            # Alternator charges battery up to 28.2V nominal
            self.state["battery_v"] += (28.2 - self.state["battery_v"]) * 0.02

        self.state["batteryVoltage"] = self.state["battery_v"]

        # -------------------------------------------------------------
        # 8. VIBRATION PHYSICS
        # -------------------------------------------------------------
        base_vib = (self.state["raw_rpm"] / 5000.0) * 0.3
        if self._is_active("Propeller Imbalance"):
            base_vib += 2.8 * self._get_sev("Propeller Imbalance")
        if self._is_active("Excessive Vibration"):
            base_vib += 3.5 * self._get_sev("Excessive Vibration")
        if self._is_active("Bearing Wear"):
            base_vib += 1.8 * self._get_sev("Bearing Wear")
        if misfire_penalty > 0:
            base_vib += 1.2

        self.state["vib_z_g"] = base_vib + self._noise(0.05)
        self.state["vibZ"] = self.state["vib_z_g"]
        self.state["vibration"] = self.state["vib_z_g"]

        # -------------------------------------------------------------
        # 9. ENGINE WEAR ACCUMULATION & DYNAMIC HEALTH SCORE
        # Health = 100 - Wear - ThermalPenalty - OilPenalty - VibrationPenalty
        # -------------------------------------------------------------
        wear_rate = 0.0001
        if self.state["oil_temp_c"] > 115.0: wear_rate += 0.005
        if self.state["raw_egt"] > 850.0: wear_rate += 0.008
        if self.state["vib_z_g"] > 2.5: wear_rate += 0.01

        self.wear = min(80.0, self.wear + wear_rate * dt)

        thermal_penalty = max(0.0, (self.state["raw_egt"] - 750.0) * 0.15) + max(0.0, (self.state["raw_cht"] - 180.0) * 0.3)
        oil_penalty = max(0.0, (200.0 - self.state["oil_pressure_kpa"]) * 0.25)
        vib_penalty = max(0.0, (self.state["vib_z_g"] - 1.0) * 8.0)

        total_health = 100.0 - self.wear - thermal_penalty - oil_penalty - vib_penalty
        self.state["health"] = max(0.0, min(100.0, total_health))

        # -------------------------------------------------------------
        # 10. FLIGHT ENVELOPE COMPUTATION
        # -------------------------------------------------------------
        target_alt = (effective_throttle / 100.0) * 8500.0
        self.state["altitude"] += (target_alt - self.state["altitude"]) * 0.002
        self.mission["altitude_m"] = self.state["altitude"]

        target_speed = (effective_throttle / 100.0) * 240.0
        self.state["airspeed"] += (target_speed - self.state["airspeed"]) * 0.01
        self.mission["speed_mps"] = self.state["airspeed"] / 3.6

        self.state["verticalSpeed"] = (target_alt - self.state["altitude"]) * 0.05
        self.state["throttle"] = effective_throttle
        self.state["throttle_pct"] = effective_throttle

        # Count active faults
        active_cnt = sum(1 for k, v in self.faults.items() if isinstance(v, dict) and v.get("active", False))
        self.state["active_fault_count"] = active_cnt
