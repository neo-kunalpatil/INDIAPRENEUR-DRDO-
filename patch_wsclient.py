import re
with open('simulator/src/services/wsClient.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { WS_BASE }", "import { WEBSOCKET_URL }")
content = content.replace("WS_BASE.endsWith", "WEBSOCKET_URL.endsWith")
content = content.replace("WS_BASE : `${WS_BASE}/stream`", "WEBSOCKET_URL : `${WEBSOCKET_URL}/stream`")
content = content.replace("WS_BASE", "WEBSOCKET_URL")

with open('simulator/src/services/wsClient.ts', 'w', encoding='utf-8') as f:
    f.write(content)
