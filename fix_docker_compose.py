import yaml
import os

filepath = 'docker-compose.yml'

with open(filepath, 'r') as f:
    data = yaml.safe_load(f)

# Fix paths and settings
if 'simulator-service' in data['services']:
    data['services']['simulator-service']['build']['context'] = './simulator'

# Remove digital twin service if it's missing code
if 'digital-twin-service' in data['services'] and not os.path.exists('digital-twin-service'):
    del data['services']['digital-twin-service']

# Add restarts and health checks where appropriate
for service_name, service in data['services'].items():
    if 'restart' not in service and service_name != 'px4-sitl':
        service['restart'] = 'unless-stopped'

with open(filepath, 'w') as f:
    yaml.dump(data, f, default_flow_style=False, sort_keys=False)
print("docker-compose.yml updated successfully.")
