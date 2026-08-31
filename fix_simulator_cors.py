import sys

with open('simulator/main.py', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:4000"]', 'allow_origins=["*"]')

with open('simulator/main.py', 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated simulator CORS")
