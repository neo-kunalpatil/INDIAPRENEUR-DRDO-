import os

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '__pycache__' in root or '.next' in root:
        continue
    for file in files:
        if file.endswith(('.py', '.ts', '.tsx', '.json', '.yaml', '.yml', '.env', '.md')):
            try:
                with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                    content = f.read()
                    if 'your-simulator-service' in content:
                        print(f"FOUND your-simulator-service in {os.path.join(root, file)}")
                    if 'localhost:8000' in content:
                        print(f"FOUND localhost:8000 in {os.path.join(root, file)}")
                    if 'ws://localhost' in content:
                        print(f"FOUND ws://localhost in {os.path.join(root, file)}")
                    if 'wss://localhost' in content:
                        print(f"FOUND wss://localhost in {os.path.join(root, file)}")
            except:
                pass
