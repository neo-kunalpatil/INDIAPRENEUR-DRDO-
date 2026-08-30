with open('main.py', 'r') as f:
    content = f.read()

content = content.replace('allow_origins=["*"]', 'allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:4000"]')

with open('main.py', 'w') as f:
    f.write(content)
