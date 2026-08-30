import re

with open('main.py', 'r') as f:
    content = f.read()

content = content.replace('physics.stats["triggerSave"] = False\n                    dur = time.time()', 'physics.stats["triggerSave"] = False\n                    print(f"TRIGGER SAVE DETECTED {physics.stats[\'phase\']}")\n                    dur = time.time()')

with open('main.py', 'w') as f:
    f.write(content)
