#!/bin/bash

# Script to batch-apply error logging to all controllers and services
# This script uses sed to replace console.error with errorLogger.error

set -e

echo "🔧 Applying error logging to all controllers and services..."
echo ""

# Function to add import if not present
add_import() {
    local file=$1
    if ! grep -q "import errorLogger from" "$file"; then
        # Find the last import line
        local last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
        if [ -n "$last_import_line" ]; then
            sed -i "${last_import_line}a\\import errorLogger from '../services/errorLoggerService';" "$file"
            echo "✓ Added errorLogger import to $file"
        fi
    fi
}

# Function to replace console.error with errorLogger.error
replace_console_error() {
    local file=$1
    if grep -q "console.error" "$file"; then
        # This is a simple replacement - you may need to manually adjust context
        sed -i "s/console\.error('\([^']*\)',/errorLogger.error('\1',/g" "$file"
        echo "✓ Replaced console.error in $file"
    fi
}

# Update all server controllers (except errorLogController and ticketController which are already done)
echo "📝 Updating server controllers..."
for controller in server/src/controllers/*.ts; do
    if [[ ! "$controller" =~ (errorLogController|ticketController) ]]; then
        if grep -q "console.error" "$controller"; then
            add_import "$controller"
            replace_console_error "$controller"
        fi
    fi
done

echo ""
echo "📝 Updating server services..."
# Update all server services (except errorLoggerService which is the core service)
for service in server/src/services/*.ts; do
    if [[ ! "$service" =~ errorLoggerService ]]; then
        if grep -q "console.error" "$service"; then
            # For services, we need to use logServiceError from utils
            if ! grep -q "import.*logServiceError" "$service"; then
                # Add import for logServiceError
                local last_import_line=$(grep -n "^import" "$service" | tail -1 | cut -d: -f1)
                if [ -n "$last_import_line" ]; then
                    sed -i "${last_import_line}a\\import { logServiceError } from '../utils/errorLogger';" "$service"
                    echo "✓ Added logServiceError import to $service"
                fi
            fi
            replace_console_error "$service"
        fi
    fi
done

echo ""
echo "📝 Updating panel services..."
# Update all panel services (except errorLogger.service.ts which is the core service)
for service in panel/src/services/*.ts; do
    if [[ ! "$service" =~ errorLogger.service ]]; then
        if grep -q "console.error" "$service"; then
            if ! grep -q "import.*errorLogger" "$service"; then
                local last_import_line=$(grep -n "^import" "$service" | tail -1 | cut -d: -f1)
                if [ -n "$last_import_line" ]; then
                    sed -i "${last_import_line}a\\import { errorLogger } from './errorLogger.service';" "$service"
                    echo "✓ Added errorLogger import to $service"
                fi
            fi
            replace_console_error "$service"
        fi
    fi
done

echo ""
echo "✅ Batch application complete!"
echo ""
echo "⚠️  Note: Some replacements may need manual adjustment for proper context."
echo "Please review the changes and run: bash check-error-logging.sh"
