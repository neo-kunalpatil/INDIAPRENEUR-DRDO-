import re
with open('simulator/physics.py', 'r') as f:
    content = f.read()

content = content.replace('tgt_throttle = self.state["throttle"]', 'tgt_throttle = self.state["throttle"]\n        print(f"tick: isActive={self.mission.get(\'isActive\')}, phase={phase}")')
with open('simulator/physics.py', 'w') as f:
    f.write(content)
