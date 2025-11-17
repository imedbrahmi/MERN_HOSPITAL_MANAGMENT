#!/usr/bin/env python3
import os
import re

def fix_remaining_urls(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Replace all remaining localhost:4000 URLs with template literals
    # This handles URLs with variables like ${id}, ${user._id}, etc.
    content = re.sub(r'`http://localhost:4000/api/v1([^`]*)`', r'`${API_BASE_URL}\1`', content)
    
    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        return True
    return False

# Fix dashboard components
dashboard_dir = '/home/aymenguedri/Tek-Up/MERN_HOSPITAL_MANAGMENT/dashboard/src/components'
for file in os.listdir(dashboard_dir):
    if file.endswith('.jsx'):
        file_path = os.path.join(dashboard_dir, file)
        if fix_remaining_urls(file_path):
            print(f"Fixed remaining URLs in: {file}")

# Fix frontend components and pages
frontend_dirs = [
    '/home/aymenguedri/Tek-Up/MERN_HOSPITAL_MANAGMENT/frontend/src/components',
    '/home/aymenguedri/Tek-Up/MERN_HOSPITAL_MANAGMENT/frontend/src/pages'
]

for dir_path in frontend_dirs:
    if os.path.exists(dir_path):
        for file in os.listdir(dir_path):
            if file.endswith('.jsx'):
                file_path = os.path.join(dir_path, file)
                if fix_remaining_urls(file_path):
                    print(f"Fixed remaining URLs in: {file}")

# Fix frontend App.jsx
app_path = '/home/aymenguedri/Tek-Up/MERN_HOSPITAL_MANAGMENT/frontend/src/App.jsx'
if fix_remaining_urls(app_path):
    print("Fixed remaining URLs in: frontend App.jsx")

print("Done fixing remaining URLs!")