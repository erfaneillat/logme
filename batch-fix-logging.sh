#!/bin/bash

# Comprehensive batch fix for error logging across all controllers and services

set -e

echo "🔧 Batch fixing error logging..."
echo ""

# Function to add errorLogger import to a file
add_errorlogger_import() {
    local file=$1
    local import_line="import errorLogger from '../services/errorLoggerService';"
    
    if ! grep -q "import errorLogger" "$file"; then
        # Find the last import line and add after it
        local line_num=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
        if [ -n "$line_num" ]; then
            sed -i "${line_num}a\\${import_line}" "$file"
            echo "  ✓ Added errorLogger import"
        fi
    fi
}

# Function to add logServiceError import to a file
add_logserviceerror_import() {
    local file=$1
    local import_line="import { logServiceError } from '../utils/errorLogger';"
    
    if ! grep -q "import.*logServiceError" "$file"; then
        local line_num=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
        if [ -n "$line_num" ]; then
            sed -i "${line_num}a\\${import_line}" "$file"
            echo "  ✓ Added logServiceError import"
        fi
    fi
}

# Function to add errorLogger import to panel service
add_panel_errorlogger_import() {
    local file=$1
    local import_line="import { errorLogger } from './errorLogger.service';"
    
    if ! grep -q "import.*errorLogger" "$file"; then
        local line_num=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
        if [ -n "$line_num" ]; then
            sed -i "${line_num}a\\${import_line}" "$file"
            echo "  ✓ Added errorLogger import"
        fi
    fi
}

# Process server controllers
echo "📝 Processing server controllers..."
for controller in server/src/controllers/*.ts; do
    filename=$(basename "$controller")
    
    # Skip already fixed files
    if [[ "$filename" =~ ^(errorLogController|ticketController|authController|userController) ]]; then
        continue
    fi
    
    if grep -q "console.error" "$controller"; then
        echo "  Fixing $filename..."
        add_errorlogger_import "$controller"
        
        # Replace console.error with errorLogger.error
        # This is a simple replacement - manual review may be needed
        sed -i "s/console\.error(/errorLogger.error(/g" "$controller"
        echo "    ✓ Replaced console.error"
    fi
done

echo ""
echo "📝 Processing server services..."
for service in server/src/services/*.ts; do
    filename=$(basename "$service")
    
    # Skip the core error logger service
    if [[ "$filename" == "errorLoggerService.ts" ]]; then
        continue
    fi
    
    if grep -q "console.error" "$service"; then
        echo "  Fixing $filename..."
        add_logserviceerror_import "$service"
        
        # Replace console.error with logServiceError
        sed -i "s/console\.error(/logServiceError(/g" "$service"
        echo "    ✓ Replaced console.error"
    fi
done

echo ""
echo "📝 Processing panel services..."
for service in panel/src/services/*.ts; do
    filename=$(basename "$service")
    
    # Skip the core error logger service
    if [[ "$filename" == "errorLogger.service.ts" ]]; then
        continue
    fi
    
    if grep -q "console.error" "$service"; then
        echo "  Fixing $filename..."
        add_panel_errorlogger_import "$service"
        
        # Replace console.error with errorLogger.error
        sed -i "s/console\.error(/errorLogger.error(/g" "$service"
        echo "    ✓ Replaced console.error"
    fi
done

echo ""
echo "✅ Batch fix complete!"
echo ""
echo "⚠️  IMPORTANT: Please review the changes manually as some replacements may need context adjustment."
echo "Run: bash check-error-logging.sh"
echo ""
echo "📝 Files that may need manual review:"
echo "   - Check that errorLogger.error() calls include proper context (req, metadata)"
echo "   - Verify logServiceError() calls have correct service name and method name"
echo "   - Ensure error messages are descriptive"
