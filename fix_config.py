import sys

with open('simulator/src/lib/config.ts', 'r', encoding='utf-8', errors='ignore') as f:
    c = f.read()

c = c.replace("ws:        `${WS_BASE}/stream`,", "ws: WS_BASE.endsWith('/stream') ? WS_BASE : `${WS_BASE}/stream`,")

with open('simulator/src/lib/config.ts', 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated config.ts")
