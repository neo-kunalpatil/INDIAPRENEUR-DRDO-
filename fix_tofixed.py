import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Matches: variable.name.toFixed( 
    # Or: array[0].toFixed(
    # Replaces with: (Number(variable.name) || 0).toFixed(
    new_content = re.sub(
        r'([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*(?:\[[^\]]+\])?(?: \+ [0-9.]+)?)\.toFixed\(', 
        r'(Number(\1) || 0).toFixed(', 
        content
    )
    
    # Also handle parenthesized expressions like (telemetry.fuelFlowLitersHr || 24.5).toFixed(1)
    new_content = re.sub(
        r'\(([^)]+)\)\.toFixed\(',
        r'(Number(\1) || 0).toFixed(',
        new_content
    )
    
    # Specific fix for SystemHealthPage PR: (telemetry.turboBoostBar + 1.0).toFixed(2)
    # The previous regex will catch it, let's make sure it's valid typescript
    # It would turn into (Number(telemetry.turboBoostBar + 1.0) || 0).toFixed(2)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

for root, _, files in os.walk('male_uav_frontend-/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            fix_file(os.path.join(root, file))
