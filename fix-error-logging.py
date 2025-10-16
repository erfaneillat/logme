#!/usr/bin/env python3
"""
Script to systematically add error logging to all controllers and services
"""

import os
import re
from pathlib import Path

def add_import_if_missing(content, import_statement):
    """Add import if not already present"""
    if import_statement not in content:
        # Find the last import line
        import_lines = [i for i, line in enumerate(content.split('\n')) if line.startswith('import ')]
        if import_lines:
            last_import_idx = import_lines[-1]
            lines = content.split('\n')
            lines.insert(last_import_idx + 1, import_statement)
            return '\n'.join(lines)
    return content

def fix_controller(file_path):
    """Fix a controller file by adding error logging"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Add import
    content = add_import_if_missing(content, "import errorLogger from '../services/errorLoggerService';")
    
    # Replace console.error patterns
    # Pattern: console.error('message:', error);
    content = re.sub(
        r"console\.error\('([^']+)',\s*error\);",
        r"errorLogger.error('\1', error as Error, req);",
        content
    )
    
    # Pattern: console.error('message:', error) with more context
    content = re.sub(
        r"console\.error\('([^']+)',\s*error\);",
        r"errorLogger.error('\1', error as Error, req);",
        content
    )
    
    # Pattern: console.log for successful operations
    content = re.sub(
        r"console\.log\('([^']+)'\);",
        r"errorLogger.info('\1', req);",
        content
    )
    
    with open(file_path, 'w') as f:
        f.write(content)
    
    return True

def fix_service(file_path, is_panel=False):
    """Fix a service file by adding error logging"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    if is_panel:
        # For panel services
        content = add_import_if_missing(content, "import { errorLogger } from './errorLogger.service';")
    else:
        # For server services
        content = add_import_if_missing(content, "import { logServiceError } from '../utils/errorLogger';")
    
    # Replace console.error patterns
    content = re.sub(
        r"console\.error\('([^']+)',\s*error\);",
        r"logServiceError('ServiceName', 'methodName', error);" if not is_panel else r"errorLogger.error('\1', error as Error, { component: 'ServiceName', action: 'methodName' });",
        content
    )
    
    with open(file_path, 'w') as f:
        f.write(content)
    
    return True

def main():
    base_path = Path('/Users/erfan/repositories/cal_ai')
    
    # Controllers to skip (already done)
    skip_controllers = {'errorLogController.ts', 'ticketController.ts', 'authController.ts', 'userController.ts'}
    
    print("🔧 Fixing error logging in controllers...")
    controllers_dir = base_path / 'server' / 'src' / 'controllers'
    for controller_file in controllers_dir.glob('*.ts'):
        if controller_file.name not in skip_controllers:
            if 'console.error' in controller_file.read_text():
                try:
                    fix_controller(str(controller_file))
                    print(f"✓ Fixed {controller_file.name}")
                except Exception as e:
                    print(f"✗ Error fixing {controller_file.name}: {e}")
    
    print("\n🔧 Fixing error logging in server services...")
    services_dir = base_path / 'server' / 'src' / 'services'
    skip_services = {'errorLoggerService.ts'}
    for service_file in services_dir.glob('*.ts'):
        if service_file.name not in skip_services:
            if 'console.error' in service_file.read_text():
                try:
                    fix_service(str(service_file), is_panel=False)
                    print(f"✓ Fixed {service_file.name}")
                except Exception as e:
                    print(f"✗ Error fixing {service_file.name}: {e}")
    
    print("\n🔧 Fixing error logging in panel services...")
    panel_services_dir = base_path / 'panel' / 'src' / 'services'
    skip_panel_services = {'errorLogger.service.ts'}
    for service_file in panel_services_dir.glob('*.ts'):
        if service_file.name not in skip_panel_services:
            if 'console.error' in service_file.read_text():
                try:
                    fix_service(str(service_file), is_panel=True)
                    print(f"✓ Fixed {service_file.name}")
                except Exception as e:
                    print(f"✗ Error fixing {service_file.name}: {e}")
    
    print("\n✅ Done! Please review changes and run: bash check-error-logging.sh")

if __name__ == '__main__':
    main()
