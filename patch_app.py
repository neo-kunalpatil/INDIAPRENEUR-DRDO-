import re

with open('male_uav_frontend-/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if "ErrorBoundary" not in content:
    content = "import { ErrorBoundary } from './components/ErrorBoundary';\n" + content

# Wrap renderActiveView
old = """          <main className="flex-1 overflow-y-auto bg-[#0A0B0D] relative grid-bg custom-scrollbar">
            <div key={activeTab} className="relative z-10 page-fade-in">
              {renderActiveView()}
            </div>
          </main>"""

new = """          <main className="flex-1 overflow-y-auto bg-[#0A0B0D] relative grid-bg custom-scrollbar">
            <div key={activeTab} className="relative z-10 page-fade-in">
              <ErrorBoundary>
                {renderActiveView()}
              </ErrorBoundary>
            </div>
          </main>"""

content = content.replace(old, new)

with open('male_uav_frontend-/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated App.tsx")
