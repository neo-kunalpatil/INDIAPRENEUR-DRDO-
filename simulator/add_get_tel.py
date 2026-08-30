import re

with open('physics.py', 'r') as f:
    content = f.read()

# Remove the display variables
content = re.sub(r'self\.state\["_display.*?actual_.*?\n', '', content)

# Add the get_telemetry method
new_method = '''
    def get_telemetry(self):
        tel = self.state.copy()
        if self.faults["rpmSensorFailure"]: tel["rpm"] = 0.0
        if self.faults["egtSensorFailure"]: tel["egt"] = 0.0
        if self.faults["chtSensorFailure"]: tel["cht"] = 0.0
        return tel
'''

content += new_method

with open('physics.py', 'w') as f:
    f.write(content)
