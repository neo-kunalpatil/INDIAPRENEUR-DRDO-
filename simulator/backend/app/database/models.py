from dataclasses import dataclass
from typing import Optional

@dataclass
class TelemetryRecord:
    timestamp: str
    rpm: float
    throttle: float
    map_kpa: float
    fuel_flow_lph: float
    fuel_remaining_l: float
    oil_pressure_kpa: float
    oil_temp_c: float
    cht_c: float
    egt_c: float
    battery_v: float
    current_a: float
    vib_x_g: float
    vib_y_g: float
    vib_z_g: float
    altitude_m: float
    airspeed_kmh: float
    vertical_speed_ms: float
    health_score: float
    mission_phase: str
    active_fault_count: int
    torque_nm: float
    power_kw: float
    turbo_boost: float
    risk_score: float
    failure_prob: float
    rul_hours: float
    oat_c: float
    humidity_pct: float
    pressure_kpa: float

@dataclass
class MissionRecord:
    timestamp: str
    mission_phase: str
    altitude: float
    speed: float
    oat: float
    humidity: float
    pressure: float

@dataclass
class HealthRecord:
    timestamp: str
    health_score: float
    rul_hours: float
    wear_level: float

@dataclass
class AIAnomalyRecord:
    timestamp: str
    anomaly_score: float
    anomaly_type: str
    severity: str
    confidence: float
