with open('male_uav_frontend-/src/pages/FleetMonitoringPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "{uav.fuelRemainingKg} kg (Number({(uav.fuelRemainingKg / 14.5) || 0).toFixed(1)}h)",
    "{uav.fuelRemainingKg} kg ({Number((uav.fuelRemainingKg / 14.5) || 0).toFixed(1)}h)"
)

with open('male_uav_frontend-/src/pages/FleetMonitoringPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
