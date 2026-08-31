import os
import re

filepath = 'male_uav_frontend-/src/pages/SystemHealthPage.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("{selectedSubsystem === 'physics' && (Number(", "{selectedSubsystem === 'physics' && (")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
