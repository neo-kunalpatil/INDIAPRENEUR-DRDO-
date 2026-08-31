import re

with open("simulator/src/app/mission/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add logs
content = content.replace("const handleStart = () => {", "const handleStart = () => {\n    console.log('START clicked');\n")
content = content.replace("const handlePause = () => {", "const handlePause = () => {\n    console.log('PAUSE clicked');\n")
content = content.replace("const handleResume = () => {", "const handleResume = () => {\n    console.log('RESUME clicked');\n")
content = content.replace("const handleStop = () => {", "const handleStop = () => {\n    console.log('STOP clicked');\n")
content = content.replace("const handlePhase = (ph: string) => {", "const handlePhase = (ph: string) => {\n    console.log('Mission phase changed:', ph);\n")

content = content.replace("setLoading(true);", "setLoading(true);\n    console.log('API Request:', payload);")
content = content.replace("const json = await res.json();", "const json = await res.json();\n        console.log('API Response:', json);")

with open("simulator/src/app/mission/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated page.tsx with logs")
