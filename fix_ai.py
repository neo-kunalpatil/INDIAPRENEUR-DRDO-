import os
import re

filepath = 'male_uav_frontend-/src/pages/AIPredictionsPage.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("onClick={() => openMetricInvestigation(Number(`SHAP Feature", "onClick={() => openMetricInvestigation(`SHAP Feature")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
