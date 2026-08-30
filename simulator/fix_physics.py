import re

with open('physics.py', 'r') as f:
    content = f.read()

content = re.sub(
    r'else:\s*tgt_throttle = 0\.0; tgt_spd = 0\.0; tgt_vs = 0\.0; tgt_rpm_limit = 0\.0',
    'else:\n                tgt_throttle = self.state["throttle"]; tgt_spd = 0.0; tgt_vs = 0.0; tgt_rpm_limit = 5800.0',
    content
)

content = re.sub(
    r'if self\.faults\["rpmSensorFailure"\]:',
    'if self.faults.get("rpmSensorFailure", False):',
    content
)

# Also fix the initialization of tgt_throttle at the top of tick
content = re.sub(
    r'tgt_throttle = 0\.0; tgt_spd = 0\.0; tgt_vs = 0\.0; tgt_rpm_limit = 1200\.0',
    'tgt_throttle = self.state["throttle"]; tgt_spd = 0.0; tgt_vs = 0.0; tgt_rpm_limit = 5800.0',
    content,
    count=1
)

with open('physics.py', 'w') as f:
    f.write(content)
