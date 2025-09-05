#!/bin/bash

# Cal AI Server Cleanup Script
# This script cleans up and redeploys the Cal AI application

set -e

echo "🧹 Cal AI Server Cleanup and Redeploy Script"
echo "=============================================="

# Configuration
PROD_PATH="/var/www/cal-ai"
DEV_PATH="/var/www/cal-ai-dev"
REPO_URL="https://github.com/erfaneillat/cal_ai.git"  # Update this with your actual repository URL

# Function to cleanup and redeploy
cleanup_and_deploy() {
    local app_path=$1
    local app_name=$2
    local branch=$3
    
    echo "🔄 Cleaning up $app_name at $app_path..."
    
    # Stop PM2 process if running
    if pm2 describe $app_name > /dev/null 2>&1; then
        echo "🛑 Stopping PM2 process: $app_name"
        pm2 stop $app_name
        pm2 delete $app_name
    fi
    
    # Remove existing directory contents
    if [ -d "$app_path" ]; then
        echo "🗑️  Removing existing files..."
        rm -rf $app_path/*
        rm -rf $app_path/.[^.]*
    else
        mkdir -p $app_path
    fi
    
    # Clone repository
    echo "📥 Cloning repository..."
    cd $app_path
    git clone $REPO_URL .
    
    # Checkout correct branch
    if [ "$branch" != "master" ]; then
        echo "🔀 Switching to $branch branch..."
        git checkout $branch
    fi
    
    # Install dependencies and build
    echo "📦 Installing server dependencies..."
    cd server
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    echo "🔨 Building server..."
    npm run build
    
    # Verify build
    if [ ! -d "dist" ]; then
        echo "❌ Build failed - dist directory not found"
        exit 1
    fi
    
    echo "✅ $app_name deployment completed"
}

# Check if running as correct user
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   exit 1
fi

# Cleanup production
echo "🏭 Cleaning up production environment..."
cleanup_and_deploy $PROD_PATH "cal-ai" "master"

# Cleanup development (if dev branch exists)
if git ls-remote --heads $REPO_URL dev | grep -q dev; then
    echo "🔧 Cleaning up development environment..."
    cleanup_and_deploy $DEV_PATH "cal-ai-dev" "dev"
else
    echo "ℹ️  No dev branch found, skipping development cleanup"
fi

echo ""
echo "✅ Cleanup and redeploy completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure environment variables"
echo "2. Start PM2 processes"
echo "3. Test the deployment"
echo ""
echo "Example commands:"
echo "# Set up production environment"
echo "cd $PROD_PATH/server"
echo "# Create .env file with your configuration"
echo "pm2 start dist/index.js --name cal-ai --cwd $PROD_PATH/server"
echo ""
echo "# Health check"
echo "curl http://localhost:9000/api/health"