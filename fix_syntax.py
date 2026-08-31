import os
import re

for root, _, files in os.walk('male_uav_frontend-/src'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find and fix the bad replacement pattern: { (expr) || 0).toFixed(x) } -> { (Number(expr) || 0).toFixed(x) }
            # Wait, the problem is they look like { (expr) || 0).toFixed(2) }
            
            fixed_content = re.sub(r'\{\s*\(([^}]+)\)\s*\|\|\s*0\)\.toFixed\((\d+)\)\s*\}', r'{ (Number(\1) || 0).toFixed(\2) }', content)
            
            if fixed_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(fixed_content)
                print(f"Fixed syntax in {filepath}")
