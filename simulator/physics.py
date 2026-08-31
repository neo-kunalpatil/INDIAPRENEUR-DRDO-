import math
import random
import time

class EnginePhysics:
    def __init__(self):
        self.state = {
            "rpm": 0.0,
            "throttle": 0.0,
            "map": 101.3,
            "torque": 0.0,
            "power": 0.0,
            "fuelFlow": 0.0,
            "fuelRemaining": 100.0,
            "egt": 25.0,
            "cht": 25.0,
            "oilTemp": 25.0,
            "oilPressure": 0.0,
            "batteryVoltage": 24.0,
            "alternatorVoltage": 0.0,
            "currentDraw": 15.0,
            "lambda": 1.0,
            "vibX": 0.0,
            "vibY": 0.0,
            "vibZ": 0.0,
            "health": 100.0,
            "loadPct": 0.0,
            "misfireCount": 0,
            "combustionEfficiency": 1.0,
            "thermalStressIndex": 0.0,
            "wearIndex": 0.0,
            "failureProbability": 0.0,
            "remainingUsefulLife": 10000.0,
            "fft": [0]*7
        }
        
        self.mission = {
            "missionPhase": "GROUND_IDLE",
            "isActive": False,
            "status": "STOPPED",
            "altitude": 0.0,
            "airspeed": 0.0,
            "groundSpeed": 0.0,
            "verticalSpeed": 0.0,
            "pitch": 0.0,
            "roll": 0.0,
            "yaw": 0.0,
            "heading": 0.0,
            "windSpeed": 0.0,
            "windDirection": 0.0,
            "oat": 25.0,
            "humidity": 50.0,
            "pressure": 101.3,
            "densityAltitude": 0.0
        }
        
        self.stats = {
            "phase": "GROUND_IDLE",
            "startTime": time.time(),
            "fuelStart": 100.0,
            "maxEgt": 25.0,
            "maxCht": 25.0,
            "maxRpm": 0.0,
            "minHealth": 100.0,
            "triggerSave": False
        }
        
        self.faults = {
            "oilLeak": False,
            "fuelLeak": False,
            "turboFailure": False,
            "injectorFailure": False,
            "sparkPlugFailure": False,
            "batteryFailure": False,
            "alternatorFailure": False,
            "rpmSensorFailure": False,
            "egtSensorFailure": False,
            "chtSensorFailure": False,
            "oilPressureLoss": False,
            "overheat": False,
            "excessiveVibration": False,
            "throttleFailure": False
        }

    def _noise(self, std: float) -> float:
        return random.gauss(0, std) if std > 0 else 0.0

    def get_telemetry(self):
        tel = self.state.copy()
        if self.faults["rpmSensorFailure"]: tel["rpm"] = 0.0
        if self.faults["egtSensorFailure"]: tel["egt"] = 0.0
        if self.faults["chtSensorFailure"]: tel["cht"] = 0.0
        return tel

    def tick(self):
        dt = 0.1 # 10Hz Tick Simulation
        
        phase = self.mission["missionPhase"]
        
        # Detect phase transition
        if phase != self.stats["phase"] or (not self.mission.get("isActive") and self.mission.get("status") == "STOPPED" and self.stats["phase"] != "STOPPED"):
            self.stats["triggerSave"] = True
            
        tgt_throttle = self.state["throttle"]
        print(f"tick: isActive={self.mission.get('isActive')}, phase={phase}")
        tgt_spd = 0.0
        tgt_vs = 0.0
        tgt_pitch = 0.0
        tgt_roll = 0.0
        
        if self.state["fuelRemaining"] <= 0:
            self.mission["isActive"] = False
            self.mission["status"] = "STOPPED"
            self.state["fuelFlow"] = 0
            
        if self.mission.get("isActive", False):
            if phase == 'GROUND_IDLE':
                tgt_throttle = 7.5; tgt_spd = 0.0; tgt_vs = 0.0
            elif phase == 'TAKEOFF':
                tgt_throttle = 100.0; tgt_spd = 120.0; tgt_vs = 12.0
                tgt_pitch = 15.0
            elif phase == 'CLIMB':
                tgt_throttle = 85.0; tgt_spd = 150.0; tgt_vs = 8.0
                tgt_pitch = 10.0
            elif phase == 'CRUISE':
                tgt_throttle = 65.0; tgt_spd = 180.0; tgt_vs = 0.0
                tgt_pitch = 2.0
            elif phase == 'LOITER':
                tgt_throttle = 50.0; tgt_spd = 140.0; tgt_vs = 0.0
                tgt_roll = 15.0
            elif phase == 'DESCENT':
                tgt_throttle = 30.0; tgt_spd = 160.0; tgt_vs = -5.0
                tgt_pitch = -5.0
            elif phase == 'LANDING':
                tgt_throttle = 20.0; tgt_spd = 100.0; tgt_vs = -2.0
                tgt_pitch = 5.0
        else:
            # STOPPED or PAUSED
            if self.mission.get("status") == "STOPPED":
                tgt_throttle = 0.0; tgt_spd = 0.0; tgt_vs = 0.0
        
        if self.faults["throttleFailure"]:
            tgt_throttle = self.state["throttle"]
        print(f"tick: isActive={self.mission.get('isActive')}, phase={phase}") # command ignored
            
        alt = self.mission["altitude"]
        oat = self.mission["oat"]
        
        press = 101.3 * math.exp(-alt / 8500.0)
        self.mission["pressure"] = press
        
        density_alt = alt + 120.0 * (oat - (15.0 - (alt / 1000.0) * 2.0))
        self.mission["densityAltitude"] = density_alt
        
        self.mission["verticalSpeed"] += (tgt_vs - self.mission["verticalSpeed"]) * (dt / 1.0)
        self.mission["altitude"] = max(0.0, alt + self.mission["verticalSpeed"] * dt)
        self.mission["airspeed"] += (tgt_spd - self.mission["airspeed"]) * (dt / 2.0)
        
        self.mission["windSpeed"] = 20.0
        self.mission["windDirection"] = (self.mission["windDirection"]) % 360
        wind_effect = math.cos(math.radians(self.mission["windDirection"] - self.mission["heading"])) * self.mission["windSpeed"]
        self.mission["groundSpeed"] = max(0, self.mission["airspeed"] + wind_effect)
        
        self.mission["pitch"] += (tgt_pitch - self.mission["pitch"]) * (dt / 1.0)
        self.mission["roll"] += (tgt_roll - self.mission["roll"]) * (dt / 1.0)
        self.mission["heading"] = (self.mission["heading"] + (self.mission["roll"] * 0.05)) % 360
        self.mission["yaw"] = self.mission["heading"]
        
        p_loss = press / 101.3
        is_run = tgt_throttle >= 2.0 and self.state["fuelRemaining"] > 0
        
        if self.faults["turboFailure"]:
            p_loss *= 0.6
            
        t_rpm = 900.0 + (tgt_throttle / 100.0) * 4900.0 if is_run else 0.0
        
        if self.faults["turboFailure"]:
            t_rpm *= 0.8
            
        if self.faults["injectorFailure"]:
            t_rpm *= 0.7
            self.state["misfireCount"] += 1
            self.state["combustionEfficiency"] = 0.5
        elif self.faults["sparkPlugFailure"]:
            t_rpm += self._noise(150.0) # RPM instability
            self.state["misfireCount"] += 1
            self.state["combustionEfficiency"] = 0.7
        else:
            self.state["combustionEfficiency"] = 1.0

        self.state["throttle"] += (tgt_throttle - self.state["throttle"]) * (dt / 0.5)
        self.state["rpm"] += (t_rpm - self.state["rpm"]) * (dt / 1.0)
        self.state["rpm"] = max(0.0, min(6000.0, self.state["rpm"]))
        
        t_map = (self.state["throttle"] / 100.0) * 45.0 * p_loss + 10.0
        self.state["map"] += (t_map - self.state["map"]) * (dt / 1.0)
        
        r_ratio = max(0.0, (self.state["rpm"] - 900) / 4900.0)
        t_flow = (r_ratio ** 1.5) * 35.0 + 2.0 if is_run else 0.0
        
        if self.faults["fuelLeak"]:
            t_flow += 15.0 # massive leak
            
        self.state["fuelFlow"] += (t_flow - self.state["fuelFlow"]) * (dt / 1.0)
        self.state["fuelRemaining"] = max(0.0, self.state["fuelRemaining"] - (self.state["fuelFlow"] / 3600.0) * dt)
        
        cool = max(0.1, 1.0 - (oat / 100.0) + (self.mission["airspeed"] / 250.0))
        t_egt = oat + 300.0 + (r_ratio * 600.0) / cool if is_run else oat
        t_cht = oat + 35.0 + (r_ratio * 180.0) / cool if is_run else oat
        t_oil = oat + 25.0 + (r_ratio * 110.0) / cool if is_run else oat
        t_op = (r_ratio * 500.0) + 200.0 if is_run else 0.0
        
        if self.faults["overheat"]:
            t_egt += 200.0
            t_cht += 100.0
            t_oil += 50.0
            
        if self.faults["turboFailure"]:
            t_egt += 150.0
            
        if self.faults["oilLeak"]:
            t_op = max(0.0, self.state["oilPressure"] - 50.0)
            t_oil += 40.0
            
        if self.faults["oilPressureLoss"]:
            t_op = 0.0
            
        if self.faults["injectorFailure"]:
            t_egt += self._noise(100.0) # Fluctuations
            
        self.state["egt"] += (t_egt - self.state["egt"]) * (dt / 3.0)
        self.state["cht"] += (t_cht - self.state["cht"]) * (dt / 3.0)
        self.state["oilTemp"] += (t_oil - self.state["oilTemp"]) * (dt / 3.0)
        self.state["oilPressure"] += (t_op - self.state["oilPressure"]) * (dt / 1.0)
        self.state["oilPressure"] = max(0.0, self.state["oilPressure"])
        
        t_alt_v = 28.5 if is_run and not self.faults["alternatorFailure"] else 0.0
        t_bat_v = 28.0 if t_alt_v > 25.0 else max(0.0, self.state["batteryVoltage"] - (self.state["currentDraw"] * 0.1 * dt))
        
        if self.faults["batteryFailure"]:
            t_bat_v = 0.0
            
        self.state["alternatorVoltage"] += (t_alt_v - self.state["alternatorVoltage"]) * (dt / 1.0)
        self.state["batteryVoltage"] += (t_bat_v - self.state["batteryVoltage"]) * (dt / 1.0)
        
        self.state["loadPct"] = (self.state["throttle"] * 0.8) + (r_ratio * 20.0)
        t_torque = self.state["loadPct"] * 1.5 * self.state["combustionEfficiency"]
        if self.faults["turboFailure"]: t_torque *= 0.7
        self.state["torque"] += (t_torque - self.state["torque"]) * (dt / 1.0)
        self.state["power"] = (self.state["torque"] * self.state["rpm"]) / 5252.0
        
        base_v = 0.2 + r_ratio * 1.0 if is_run else 0.0
        if self.faults["excessiveVibration"]:
            base_v += 4.0
            
        self.state["vibX"] = base_v * 0.5 + self._noise(0.2)
        self.state["vibY"] = base_v * 0.6 + self._noise(0.2)
        self.state["vibZ"] = base_v * 1.0 + self._noise(0.3)
        
        target_health = 100.0
        if self.state["oilPressure"] < 200.0 and is_run: target_health -= 30.0
        if self.state["cht"] > 220.0: target_health -= 25.0
        if self.state["egt"] > 850.0: target_health -= 15.0
        if base_v > 2.0: target_health -= 20.0
        if self.faults.get("oilLeak"): target_health -= 15.0
        if self.faults.get("overheat"): target_health -= 20.0
        if self.faults.get("turboFailure"): target_health -= 15.0
        if self.faults.get("fuelLeak"): target_health -= 10.0
        if self.faults.get("excessiveVibration"): target_health -= 15.0
        if self.faults.get("batteryFailure"): target_health -= 10.0
        if self.faults.get("alternatorFailure"): target_health -= 10.0
        
        # Fast health update (1s)
        self.state["health"] += (target_health - self.state["health"]) * (dt / 1.0)
        self.state["health"] = max(0.0, min(100.0, self.state["health"]))
        
        # Update Stats
        self.stats["maxEgt"] = max(self.stats["maxEgt"], self.state["egt"])
        self.stats["maxCht"] = max(self.stats["maxCht"], self.state["cht"])
        self.stats["maxRpm"] = max(self.stats["maxRpm"], self.state["rpm"])
        self.stats["minHealth"] = min(self.stats["minHealth"], self.state["health"])
