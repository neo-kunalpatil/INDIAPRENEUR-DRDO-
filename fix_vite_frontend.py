import os
import re

files_to_fix = [
    r"male_uav_frontend-\src\components\GarudaAIPanel.tsx",
    r"male_uav_frontend-\src\contexts\GcsContext.tsx",
    r"male_uav_frontend-\src\services\garudaAiService.ts"
]

import_statement = "import { API_BASE, WS_BASE } from '../config';\n"
import_statement_service = "import { API_BASE } from '../config';\n"
import_statement_context = "import { API_BASE, WS_BASE } from '../config';\n"

for fp in files_to_fix:
    with open(fp, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Inject import
    if "API_BASE" not in content and "from '../config'" not in content and "from \"../config\"" not in content:
        # insert after the last import
        lines = content.split('\n')
        last_import_idx = -1
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import_idx = i
        
        if last_import_idx != -1:
            lines.insert(last_import_idx + 1, "import { API_BASE, WS_BASE } from '../config';")
            content = '\n'.join(lines)
        else:
            content = "import { API_BASE, WS_BASE } from '../config';\n" + content
            
    # Replace all localhosts and env mappings
    # GcsContext.tsx
    content = re.sub(r'const wsUrl = import\.meta\.env\.VITE_WS_URL \|\| [\'"`]ws://localhost:8000[\'"`];', '', content)
    content = re.sub(r'ws = new WebSocket\(`\$\{wsUrl\}/stream`\);', 'ws = new WebSocket(`${WS_BASE}/stream`);', content)
    content = re.sub(r'ws = new WebSocket\([\'"`]ws://localhost:8000/stream[\'"`]\);', 'ws = new WebSocket(`${WS_BASE}/stream`);', content)
    content = re.sub(r'\$\{wsUrl\}', '${WS_BASE}', content)
    
    # garudaAiService & GarudaAIPanel
    content = re.sub(r'const API_BASE_URL = import\.meta\.env\.VITE_API_BASE_URL \|\| [\'"`]http://localhost:8000[\'"`];?', '', content)
    content = re.sub(r'const API_BASE_URL = import\.meta\.env\.VITE_API_URL \|\| [\'"`]http://localhost:8000[\'"`];?', '', content)
    
    # Replace any leftover API_BASE_URL with API_BASE
    content = content.replace("API_BASE_URL", "API_BASE")
    
    # Any other localhosts in fetch
    content = re.sub(r'fetch\([\'"`]http://localhost:8000(.*?)[\'"`]', r'fetch(`${API_BASE}\1`', content)
    
    # Remove any leftover import.meta.env inline
    content = re.sub(r'fetch\(`\$\{import\.meta\.env\.VITE_API_URL\}(.*?)`', r'fetch(`${API_BASE}\1`', content)
    content = re.sub(r'ws = new WebSocket\(`\$\{import\.meta\.env\.VITE_WS_URL\}/stream`\);', 'ws = new WebSocket(`${WS_BASE}/stream`);', content)

    with open(fp, "w", encoding="utf-8") as f:
        f.write(content)

print("Fixed male_uav_frontend- files")
