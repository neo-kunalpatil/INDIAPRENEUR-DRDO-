import re

with open("simulator/src/app/mission/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r'ERROR: \$\{e\.message\} [^\-]* Is backend running on port 4000\?', 'ERROR: ${e.message} — Check if backend is reachable.', content)
content = content.replace("BACKEND DISCONNECTED - Attempting to reconnect...", "BACKEND DISCONNECTED — Attempting to reconnect...")

with open("simulator/src/app/mission/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated page.tsx")
