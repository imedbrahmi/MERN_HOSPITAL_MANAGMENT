#!/usr/bin/env python3
import os
import re

def fix_component(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Check if file uses localhost:4000
    if 'localhost:4000' not in content:
        return False
    
    # Add API_BASE_URL import if not present
    if 'API_BASE_URL' not in content:
        # Find the last import statement
        import_pattern = r'(import.*from.*[\'"][^\'"]*[\'"];?\n)'
        imports = re.findall(import_pattern, content)
        if imports:
            last_import = imports[-1]
            new_import = "import { API_BASE_URL } from '../utils/api';\n"
            content = content.replace(last_import, last_import + new_import)
    
    # Replace localhost URLs with API_BASE_URL
    content = re.sub(r'[\'"]http://localhost:4000/api/v1([^\'"]*)[\'"]', r'`${API_BASE_URL}\1`', content)
    
    with open(file_path, 'w') as f:
        f.write(content)
    
    return True

# Fix dashboard components
dashboard_dir = '/home/aymenguedri/Tek-Up/MERN_HOSPITAL_MANAGMENT/dashboard/src/components'
for file in os.listdir(dashboard_dir):
    if file.endswith('.jsx'):
        file_path = os.path.join(dashboard_dir, file)
        if fix_component(file_path):
            print(f"Fixed: {file}")

# Fix frontend components
frontend_dirs = [
    '/home/aymenguedri/Tek-Up/MERN_HOSPITAL_MANAGMENT/frontend/src/components',
    '/home/aymenguedri/Tek-Up/MERN_HOSPITAL_MANAGMENT/frontend/src/pages'
]

for dir_path in frontend_dirs:
    if os.path.exists(dir_path):
        for file in os.listdir(dir_path):
            if file.endswith('.jsx'):
                file_path = os.path.join(dir_path, file)
                if fix_component(file_path):
                    print(f"Fixed: {file}")

# Fix frontend App.jsx
app_path = '/home/aymenguedri/Tek-Up/MERN_HOSPITAL_MANAGMENT/frontend/src/App.jsx'
if fix_component(app_path):
    print("Fixed: frontend App.jsx")

print("Done!")