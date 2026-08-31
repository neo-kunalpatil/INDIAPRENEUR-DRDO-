import sys

with open('simulator/src/services/wsClient.ts', 'r', encoding='utf-8', errors='ignore') as f:
    c = f.read()

c = c.replace("let url = `${WS_BASE}/stream`;", "let url = WS_BASE.endsWith('/stream') ? WS_BASE : `${WS_BASE}/stream`;")
c = c.replace("port 4000...", "backend...")

with open('simulator/src/services/wsClient.ts', 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated wsClient.ts")
