#!/bin/bash

# Cal AI Server Setup Script
# This script helps set up the initial directory structure and dependencies

set -e

echo "🚀 Cal AI Server Setup Script"
echo "=============================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   exit 1
fi

# Create directories
echo "📁 Creating directory structure..."
sudo mkdir -p /var/www/cal-ai
sudo mkdir -p /var/www/cal-ai/web
sudo mkdir -p /var/www/cal-ai-dev
sudo mkdir -p /var/www/cal-ai-dev/web

# Set permissions
echo "🔐 Setting permissions..."
sudo chown -R $USER:$USER /var/www/cal-ai
sudo chown -R $USER:$USER /var/www/cal-ai-dev

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js is already installed ($(node --version))"
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
else
    echo "✅ PM2 is already installed ($(pm2 --version))"
fi

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    sudo apt update
    sudo apt install -y nginx
else
    echo "✅ Nginx is already installed ($(nginx -v 2>&1))"
fi

# Create PM2 log directory
echo "📋 Creating PM2 log directory..."
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Setup PM2 startup
echo "🔄 Setting up PM2 startup..."
pm2 startup | tail -n 1 | sudo bash || echo "⚠️  PM2 startup setup may need manual configuration"

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your domain DNS to point to this server"
echo "2. Set up SSL certificates (recommended: Let's Encrypt)"
echo "3. Configure Nginx using the provided nginx.conf.example"
echo "4. Set up GitHub secrets for deployment"
echo "5. Push to your repository to trigger deployment"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"