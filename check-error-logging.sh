#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Error Logging Implementation Check ===${NC}\n"

# Function to count files
count_files() {
    echo "$1" | grep -c "."
}

# Check server controllers
echo -e "${YELLOW}Server Controllers:${NC}"
SERVER_CONTROLLERS_WITHOUT=$(find server/src/controllers -name "*.ts" ! -name "errorLogController.ts" -exec grep -L "errorLogger" {} \;)
if [ -z "$SERVER_CONTROLLERS_WITHOUT" ]; then
    echo -e "${GREEN}✓ All controllers have error logging${NC}"
else
    COUNT=$(echo "$SERVER_CONTROLLERS_WITHOUT" | wc -l | tr -d ' ')
    echo -e "${RED}✗ $COUNT controller(s) without error logging:${NC}"
    echo "$SERVER_CONTROLLERS_WITHOUT" | sed 's/^/  - /'
fi

echo ""

# Check server services
echo -e "${YELLOW}Server Services:${NC}"
SERVER_SERVICES_WITHOUT=$(find server/src/services -name "*.ts" ! -name "errorLoggerService.ts" -exec grep -L "errorLogger\|logServiceError" {} \;)
if [ -z "$SERVER_SERVICES_WITHOUT" ]; then
    echo -e "${GREEN}✓ All services have error logging${NC}"
else
    COUNT=$(echo "$SERVER_SERVICES_WITHOUT" | wc -l | tr -d ' ')
    echo -e "${RED}✗ $COUNT service(s) without error logging:${NC}"
    echo "$SERVER_SERVICES_WITHOUT" | sed 's/^/  - /'
fi

echo ""

# Check panel services
echo -e "${YELLOW}Panel Services:${NC}"
PANEL_SERVICES_WITHOUT=$(find panel/src/services -name "*.ts" ! -name "errorLogger.service.ts" -exec grep -L "errorLogger" {} \; 2>/dev/null)
if [ -z "$PANEL_SERVICES_WITHOUT" ]; then
    echo -e "${GREEN}✓ All panel services have error logging${NC}"
else
    COUNT=$(echo "$PANEL_SERVICES_WITHOUT" | wc -l | tr -d ' ')
    echo -e "${RED}✗ $COUNT panel service(s) without error logging:${NC}"
    echo "$PANEL_SERVICES_WITHOUT" | sed 's/^/  - /'
fi

echo ""
echo -e "${BLUE}=== Files Still Using console.error ===${NC}\n"

# Check for console.error in server controllers
echo -e "${YELLOW}Server Controllers:${NC}"
SERVER_CONSOLE_ERROR=$(find server/src/controllers -name "*.ts" -exec grep -l "console.error" {} \; 2>/dev/null)
if [ -z "$SERVER_CONSOLE_ERROR" ]; then
    echo -e "${GREEN}✓ No console.error found${NC}"
else
    COUNT=$(echo "$SERVER_CONSOLE_ERROR" | wc -l | tr -d ' ')
    echo -e "${YELLOW}⚠ $COUNT file(s) still using console.error:${NC}"
    echo "$SERVER_CONSOLE_ERROR" | sed 's/^/  - /'
fi

echo ""

# Check for console.error in server services
echo -e "${YELLOW}Server Services:${NC}"
SERVER_SERVICES_CONSOLE=$(find server/src/services -name "*.ts" ! -name "errorLoggerService.ts" -exec grep -l "console.error" {} \; 2>/dev/null)
if [ -z "$SERVER_SERVICES_CONSOLE" ]; then
    echo -e "${GREEN}✓ No console.error found${NC}"
else
    COUNT=$(echo "$SERVER_SERVICES_CONSOLE" | wc -l | tr -d ' ')
    echo -e "${YELLOW}⚠ $COUNT file(s) still using console.error:${NC}"
    echo "$SERVER_SERVICES_CONSOLE" | sed 's/^/  - /'
fi

echo ""

# Check for console.error in panel services
echo -e "${YELLOW}Panel Services:${NC}"
PANEL_CONSOLE_ERROR=$(find panel/src/services -name "*.ts" ! -name "errorLogger.service.ts" -exec grep -l "console.error" {} \; 2>/dev/null)
if [ -z "$PANEL_CONSOLE_ERROR" ]; then
    echo -e "${GREEN}✓ No console.error found${NC}"
else
    COUNT=$(echo "$PANEL_CONSOLE_ERROR" | wc -l | tr -d ' ')
    echo -e "${YELLOW}⚠ $COUNT file(s) still using console.error:${NC}"
    echo "$PANEL_CONSOLE_ERROR" | sed 's/^/  - /'
fi

echo ""
echo -e "${BLUE}=== Summary ===${NC}\n"

# Calculate totals
TOTAL_CONTROLLERS=$(find server/src/controllers -name "*.ts" ! -name "errorLogController.ts" | wc -l | tr -d ' ')
TOTAL_SERVER_SERVICES=$(find server/src/services -name "*.ts" ! -name "errorLoggerService.ts" | wc -l | tr -d ' ')
TOTAL_PANEL_SERVICES=$(find panel/src/services -name "*.ts" ! -name "errorLogger.service.ts" 2>/dev/null | wc -l | tr -d ' ')

CONTROLLERS_WITH=$(find server/src/controllers -name "*.ts" ! -name "errorLogController.ts" -exec grep -l "errorLogger" {} \; | wc -l | tr -d ' ')
SERVER_SERVICES_WITH=$(find server/src/services -name "*.ts" ! -name "errorLoggerService.ts" -exec grep -l "errorLogger\|logServiceError" {} \; | wc -l | tr -d ' ')
PANEL_SERVICES_WITH=$(find panel/src/services -name "*.ts" ! -name "errorLogger.service.ts" -exec grep -l "errorLogger" {} \; 2>/dev/null | wc -l | tr -d ' ')

echo "Server Controllers: $CONTROLLERS_WITH/$TOTAL_CONTROLLERS"
echo "Server Services: $SERVER_SERVICES_WITH/$TOTAL_SERVER_SERVICES"
echo "Panel Services: $PANEL_SERVICES_WITH/$TOTAL_PANEL_SERVICES"

TOTAL_WITH=$((CONTROLLERS_WITH + SERVER_SERVICES_WITH + PANEL_SERVICES_WITH))
TOTAL_FILES=$((TOTAL_CONTROLLERS + TOTAL_SERVER_SERVICES + TOTAL_PANEL_SERVICES))
PERCENTAGE=$((TOTAL_WITH * 100 / TOTAL_FILES))

echo ""
echo -e "Overall Progress: ${BLUE}$TOTAL_WITH/$TOTAL_FILES${NC} (${BLUE}$PERCENTAGE%${NC})"

if [ "$PERCENTAGE" -eq 100 ]; then
    echo -e "\n${GREEN}🎉 All files have error logging implemented!${NC}"
else
    echo -e "\n${YELLOW}📝 See APPLY_ERROR_LOGGING_TO_ALL.md for guidance on updating remaining files.${NC}"
fi
