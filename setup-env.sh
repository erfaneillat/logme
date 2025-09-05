#!/bin/bash

# Cal AI Environment Setup Script
# This script sets up environment variables and starts PM2 processes

set -e

echo "⚙️  Cal AI Environment Setup Script"
echo "===================================="

# Configuration
PROD_PATH="/var/www/cal-ai/server"
DEV_PATH="/var/www/cal-ai-dev/server"

# Function to setup environment
setup_env() {
    local app_path=$1
    local app_name=$2
    local port=$3
    local environment=$4
    
    echo "⚙️  Setting up $app_name environment..."
    
    if [ ! -d "$app_path" ]; then
        echo "❌ Error: $app_path does not exist"
        return 1
    fi
    
    cd $app_path
    
    # Create .env file
    cat > .env << EOF
NODE_ENV=$environment
PORT=$port
MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/cal_ai}
JWT_SECRET=${JWT_SECRET:-your_jwt_secret_key_here}
OPENAI_API_KEY=${OPENAI_API_KEY:-your_openai_api_key_here}
API_BASE_URL=https://logme.yadbanapp.com
CORS_ORIGIN=https://logme.yadbanapp.com
EOF
    
    echo "✅ Environment file created at $app_path/.env"
    
    # Start PM2 process
    if pm2 describe $app_name > /dev/null 2>&1; then
        echo "🔄 Restarting existing PM2 process: $app_name"
        pm2 restart $app_name --update-env
    else
        echo "🚀 Starting new PM2 process: $app_name"
        pm2 start dist/index.js --name $app_name --cwd $app_path
    fi
    
    pm2 save
    echo "✅ $app_name started successfully"
}

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Please install it first:"
    echo "sudo npm install -g pm2"
    exit 1
fi

# Check for required environment variables
if [ -z "$MONGODB_URI" ]; then
    echo "⚠️  Warning: MONGODB_URI not set, using default"
fi

if [ -z "$JWT_SECRET" ]; then
    echo "⚠️  Warning: JWT_SECRET not set, using placeholder"
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Warning: OPENAI_API_KEY not set, using placeholder"
fi

# Setup production
echo "🏭 Setting up production environment..."
setup_env $PROD_PATH "cal-ai" "3000" "production"

# Setup development if it exists
if [ -d "$DEV_PATH" ]; then
    echo "🔧 Setting up development environment..."
    setup_env $DEV_PATH "cal-ai-dev" "3001" "development"
fi

echo ""
echo "✅ Environment setup completed!"
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🔍 Health Checks:"
echo "Production:  curl http://localhost:3000/api/health"
if [ -d "$DEV_PATH" ]; then
    echo "Development: curl http://localhost:3001/api/health"
fi

echo ""
echo "📋 Important Notes:"
echo "1. Update environment variables in .env files with real values"
echo "2. Ensure MongoDB is running and accessible"
echo "3. Configure Nginx to proxy requests to the applications"
echo "4. Set up SSL certificates for your domains"