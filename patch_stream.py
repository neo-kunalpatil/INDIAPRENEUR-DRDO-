import re
with open('male_uav_frontend-/src/contexts/GcsContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "ws = new WebSocket(`${WS_URL}/stream`);", 
    "let url = WS_URL.endsWith('/stream') ? WS_URL : `${WS_URL}/stream`;\n        ws = new WebSocket(url);"
)
content = content.replace(
    "console.log(`[Main Dashboard] Connected to Main Backend Gateway (${WS_URL}/stream)`);",
    "console.log(`[Main Dashboard] Connected to Main Backend Gateway (${url})`);"
)

with open('male_uav_frontend-/src/contexts/GcsContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
