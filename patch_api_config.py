import os
import re

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Change import paths
    # from '../config' or from '../../config' -> to point to config/api
    # Actually, it's safer to just regex replace API_BASE with API_BASE_URL
    # and WS_BASE with WS_URL
    
    new_content = content.replace("API_BASE", "API_BASE_URL").replace("WS_BASE", "WS_URL")
    
    # Fix imports: import { API_BASE_URL, WS_URL } from '.../config' -> '.../config/api'
    new_content = re.sub(
        r"import\s*\{\s*API_BASE_URL(?:,\s*WS_URL)?\s*\}\s*from\s*['\"]([^'\"]+)config['\"]",
        r"import { API_BASE_URL, WS_URL } from '\1config/api'",
        new_content
    )
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched {filepath}")

for root, _, files in os.walk('male_uav_frontend-/src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            patch_file(os.path.join(root, file))

# Remove old config.ts
try:
    os.remove('male_uav_frontend-/src/config.ts')
except:
    pass
