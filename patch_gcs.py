import re

with open('male_uav_frontend-/src/contexts/GcsContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace startup-state fetch
old_startup = r"""    fetch(`${API_BASE}/api/system/startup-state`)
      .then(res => res.json())
      .then(data => {
        setTelemetry(data.telemetry || initialUavState);
      })
      .catch(err => console.warn('Failed to fetch startup state:', err));"""

new_startup = r"""    fetch(`${API_BASE}/api/system/startup-state`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setTelemetry(data.telemetry || initialUavState);
      })
      .catch(err => {
        console.warn('Failed to fetch startup state (Using safe fallback):', err);
        setTelemetry(initialUavState);
      });"""

content = content.replace(old_startup, new_startup)

# Replace active faults fetch
old_faults = r"""    fetch(`${API_BASE}/api/faults?active=true`)
      .then(res => res.json())
      .then(data => {
        const activeMap: Record<string, boolean> = {};
        if (Array.isArray(data)) {
          data.forEach((f: any) => {
            activeMap[f.fault_id] = true;
          });
        }
        setActiveFaults(activeMap);
      })
      .catch(err => console.warn('Failed initial fetch of active faults from TimescaleDB Backend:', err));"""

new_faults = r"""    fetch(`${API_BASE}/api/faults?active=true`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        const activeMap: Record<string, boolean> = {};
        if (Array.isArray(data)) {
          data.forEach((f: any) => {
            activeMap[f.fault_id] = true;
          });
        }
        setActiveFaults(activeMap);
      })
      .catch(err => {
        console.warn('Failed initial fetch of active faults (Using safe fallback):', err);
        setActiveFaults({});
      });"""

content = content.replace(old_faults, new_faults)

with open('male_uav_frontend-/src/contexts/GcsContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated GcsContext.tsx")
