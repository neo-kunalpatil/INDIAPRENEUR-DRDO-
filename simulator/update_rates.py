import re

with open('physics.py', 'r') as f:
    content = f.read()

# 1. Remove noise
content = re.sub(
    r'def _noise\(self, std: float\) -> float:[\s\S]*?return[^\n]+',
    'def _noise(self, std: float) -> float:\n        return 0.0',
    content
)

# 2. Fix the rates
# rpm rate: 0.1 -> (0.1 / 3.0)
content = re.sub(
    r'self\.state\["rpm"\] \+= \(t_rpm - self\.state\["rpm"\]\) \* 0\.1',
    'self.state["rpm"] += (t_rpm - self.state["rpm"]) * (dt / 3.0)',
    content
)

# throttle rate: 0.1 -> (0.1 / 1.0)
content = re.sub(
    r'self\.state\["throttle"\] \+= \(tgt_throttle - self\.state\["throttle"\]\) \* 0\.1',
    'self.state["throttle"] += (tgt_throttle - self.state["throttle"]) * (dt / 1.0)',
    content
)

# fuel flow rate: 0.1 -> (0.1 / 2.0)
content = re.sub(
    r'self\.state\["fuelFlow"\] \+= \(t_flow - self\.state\["fuelFlow"\]\) \* 0\.1',
    'self.state["fuelFlow"] += (t_flow - self.state["fuelFlow"]) * (dt / 2.0)',
    content
)

# EGT rate: 0.05 -> (0.1 / 10.0)
content = re.sub(
    r'self\.state\["egt"\] \+= \(t_egt - self\.state\["egt"\]\) \* 0\.05',
    'self.state["egt"] += (t_egt - self.state["egt"]) * (dt / 10.0)',
    content
)

# CHT rate: 0.01 -> (0.1 / 40.0)
content = re.sub(
    r'self\.state\["cht"\] \+= \(t_cht - self\.state\["cht"\]\) \* 0\.01',
    'self.state["cht"] += (t_cht - self.state["cht"]) * (dt / 40.0)',
    content
)

# Oil Temp rate: 0.005 -> (0.1 / 60.0)
content = re.sub(
    r'self\.state\["oilTemp"\] \+= \(t_oil - self\.state\["oilTemp"\]\) \* 0\.005',
    'self.state["oilTemp"] += (t_oil - self.state["oilTemp"]) * (dt / 60.0)',
    content
)

# Oil Pressure rate: 0.1 -> (0.1 / 2.0)
content = re.sub(
    r'self\.state\["oilPressure"\] = max\(0\.0, self\.state\["oilPressure"\] \+ \(t_op - self\.state\["oilPressure"\]\) \* 0\.1',
    'self.state["oilPressure"] = max(0.0, self.state["oilPressure"] + (t_op - self.state["oilPressure"]) * (dt / 2.0)',
    content
)

# 3. Fix oil leak drop
content = re.sub(
    r'if self\.faults\["oilLeak"\]:\s*t_op = max\(0\.0, t_op - 400\.0\)\s*t_oil \+= 40\.0',
    'if self.faults["oilLeak"]:\n            t_op = max(0.0, self.state["oilPressure"] - 30.0) # Gradual drop goal\n            t_oil += 40.0',
    content
)

# Fix health instant jumps - wait, the health formula just calculates it from scratch each tick.
# Let's make health stateful.
# Find: health = 100.0 ... self.state["health"] = max(0.0, min(100.0, health))
health_logic = r'''
        # 9. Health Engine Logic
        target_health = 100.0
        self.state["thermalStressIndex"] = (self.state["egt"] / 900.0) * 0.5 + (self.state["cht"] / 220.0) * 0.5
        
        if self.state["oilPressure"] < 200.0 and is_run: target_health -= 30.0
        if self.state["cht"] > 220.0: target_health -= 25.0
        if self.state["egt"] > 850.0: target_health -= 15.0
        if base_v > 2.0: target_health -= 20.0
        
        if self.faults.get("oilLeak", False): target_health -= 15.0
        if self.faults.get("overheat", False): target_health -= 20.0
        if self.faults.get("turboFailure", False): target_health -= 15.0
        if self.faults.get("fuelLeak", False): target_health -= 10.0
        
        # very slow degradation
        self.state["health"] += (target_health - self.state["health"]) * (dt / 300.0)
        self.state["health"] = max(0.0, min(100.0, self.state["health"]))
'''

content = re.sub(r'# 9\. Health Engine Logic[\s\S]*?self\.state\["health"\] = max\(0\.0, min\(100\.0, health\)\)', health_logic.strip(), content)


with open('physics.py', 'w') as f:
    f.write(content)
