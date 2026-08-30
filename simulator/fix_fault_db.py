import re

with open('main.py', 'r') as f:
    content = f.read()

# Replace empty string fault arrays with dynamic JSON strings
content = content.replace('packet.get("health", 100), ""', 'packet.get("health", 100), __import__("json").dumps([k for k, v in physics.faults.items() if v])')
content = content.replace('data.get("health", 100), ""', 'data.get("health", 100), __import__("json").dumps([k for k, v in physics.faults.items() if v])')

with open('main.py', 'w') as f:
    f.write(content)
