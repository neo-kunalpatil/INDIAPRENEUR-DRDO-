import os
import re

filepath = 'male_uav_frontend-/src/contexts/GcsContext.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

new_line = "chtC: Array.isArray(data.cht_c) ? data.cht_c.map((v: any) => typeof v === 'number' ? Number((Number(v) || 0).toFixed(1)) : v) : (typeof data.cht_c === 'number' ? [Number((Number(data.cht_c) || 0).toFixed(1)), Number((Number(data.cht_c + 1.2) || 0).toFixed(1)), Number((Number(data.cht_c - 0.8) || 0).toFixed(1)), Number((Number(data.cht_c + 0.5) || 0).toFixed(1))] : prev.chtC),"
content = re.sub(r'chtC: Array\.isArray\(data\.cht_c\).*?prev\.chtC\),', new_line, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
