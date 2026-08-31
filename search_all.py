import os

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '__pycache__' in root or '.next' in root:
        continue
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json', '.env', '.yaml', '.yml')):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if 'localhost:8000' in content or '/api/faults' in content or '/stream' in content:
                        print(f"Match found in: {filepath}")
            except Exception:
                pass
