import os
import shutil

BASE_DIR = "C:/Users/Admin/OneDrive/Desktop/SIH-2026/aero-engine-sim"
APP_DIR = os.path.join(BASE_DIR, "src/app")

# Rename telemetry to telemetry-stream
if os.path.exists(os.path.join(APP_DIR, "telemetry")):
    os.rename(os.path.join(APP_DIR, "telemetry"), os.path.join(APP_DIR, "telemetry-stream"))

# Create engine dir and move page.tsx
os.makedirs(os.path.join(APP_DIR, "engine"), exist_ok=True)
root_page = os.path.join(APP_DIR, "page.tsx")
engine_page = os.path.join(APP_DIR, "engine", "page.tsx")
if os.path.exists(root_page):
    shutil.move(root_page, engine_page)

# Create a simple redirect root page
with open(root_page, "w", encoding="utf-8") as f:
    f.write("""
import { redirect } from 'next/navigation';
export default function Home() {
  redirect('/engine');
}
""")

# Update layout.tsx links
layout_path = os.path.join(APP_DIR, "layout.tsx")
with open(layout_path, "r", encoding="utf-8") as f:
    layout = f.read()

layout = layout.replace('href="/"', 'href="/engine"')
layout = layout.replace('href="/telemetry"', 'href="/telemetry-stream"')

with open(layout_path, "w", encoding="utf-8") as f:
    f.write(layout)

# List structure
print("APP ROUTER TREE:")
for root, dirs, files in os.walk(APP_DIR):
    level = root.replace(APP_DIR, '').count(os.sep)
    indent = ' ' * 4 * (level)
    print(f"{indent}{os.path.basename(root)}/")
    subindent = ' ' * 4 * (level + 1)
    for f in files:
        if f.endswith('.tsx'):
            print(f"{subindent}{f}")
