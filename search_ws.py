import os

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '__pycache__' in root:
        continue
    for file in files:
        filepath = os.path.join(root, file)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'ws://localhost:8000/stream' in content:
                    print(f"FOUND IN: {filepath}")
        except Exception:
            pass
