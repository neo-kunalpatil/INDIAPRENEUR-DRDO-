import os
import re

def patch_file(filepath):
    if filepath.endswith("env.ts"):
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove old imports
    content = re.sub(r"import\s*\{\s*[^}]*\bAPI_BASE[^}]*\}\s*from\s*['\"][^'\"]*config(?:/api)?['\"];?\n*", "", content)
    
    # Replace API references
    content = content.replace("API_BASE_URL_URL", "API_URL")
    content = content.replace("API_BASE_URL", "API_URL")
    content = content.replace("API_BASE", "API_URL")

    # If API_URL is used but not imported, add import
    if "API_URL" in content and "import { API_URL" not in content:
        # try to find the relative path to config/env.ts
        # simple heuristic: count slashes in filepath relative to src
        rel_path = os.path.relpath(filepath, "male_uav_frontend-/src")
        depth = rel_path.count(os.sep)
        if depth == 0:
            import_str = "import { API_URL, WS_URL } from './config/env';\n"
        else:
            import_str = "import { API_URL, WS_URL } from '" + "../" * depth + "config/env';\n"
        
        # Add after first import or at top
        if "import " in content:
            content = content.replace("import ", import_str + "import ", 1)
        else:
            content = import_str + content

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, _, files in os.walk('male_uav_frontend-/src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            patch_file(os.path.join(root, file))

# Remove old config files
for old_file in ['male_uav_frontend-/src/config/api.ts', 'male_uav_frontend-/src/config.ts']:
    try:
        os.remove(old_file)
    except:
        pass
