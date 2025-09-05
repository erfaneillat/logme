# 🚀 Cal AI Deployment Guide

This guide explains how to deploy the Cal AI application using GitHub Actions to your server with the subdomain `logme.yadbanapp.com`.

## 📋 Prerequisites

### Server Requirements
- Ubuntu/Debian server with sudo access
- Node.js 18+ installed
- PM2 process manager
- Nginx web server
- MongoDB database
- SSL certificates for your domain

### GitHub Secrets Setup
Configure the following secrets in your GitHub repository settings:

#### Required Secrets
```
SERVER_HOST=your.server.ip.address
SERVER_USERNAME=your_server_username
SERVER_PASSWORD=your_server_password
SERVER_PORT=22

MONGODB_URI=mongodb://localhost:27017/cal_ai
JWT_SECRET=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
```

#### Optional Development Secrets
```
DEV_SERVER_HOST=your.dev.server.ip.address (defaults to SERVER_HOST)
DEV_SERVER_USERNAME=your_dev_server_username (defaults to SERVER_USERNAME)
DEV_SERVER_PASSWORD=your_dev_server_password (defaults to SERVER_PASSWORD)
DEV_SERVER_PORT=22 (defaults to SERVER_PORT)
```

## 🏗️ Server Setup

### Quick Setup (Recommended)
Use the provided setup script for automated installation:

```bash
# Upload and run the setup script
scp setup-server.sh user@your-server:/tmp/
ssh user@your-server
cd /tmp
./setup-server.sh
```

### Manual Setup
If you prefer manual setup, follow these steps:

### 1. Directory Structure
The deployment expects the following directory structure on your server:

```
/var/www/
├── cal-ai/                 # Production
│   ├── server/            # Node.js backend (repository/server)
│   ├── web/               # Flutter web build
│   ├── lib/               # Flutter source (repository/lib)
│   ├── assets/            # Flutter assets (repository/assets)
│   └── ...                # Other repository files
└── cal-ai-dev/            # Development
    ├── server/            # Node.js backend (repository/server)
    ├── web/               # Flutter web build
    ├── lib/               # Flutter source (repository/lib)
    ├── assets/            # Flutter assets (repository/assets)
    └── ...                # Other repository files
```

### 2. Create Directories
```bash
sudo mkdir -p /var/www/cal-ai
sudo mkdir -p /var/www/cal-ai/web
sudo mkdir -p /var/www/cal-ai-dev
sudo mkdir -p /var/www/cal-ai-dev/web

# Set permissions
sudo chown -R $USER:$USER /var/www/cal-ai
sudo chown -R $USER:$USER /var/www/cal-ai-dev
```

### 3. Install Dependencies
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt update
sudo apt install nginx

# Install MongoDB (if not already installed)
# Follow MongoDB official installation guide for your OS
```

## 🌐 Nginx Configuration

### 1. Copy Configuration
Use the provided `nginx.conf.example` as a complete configuration:

```bash
# Copy the configuration file
sudo cp nginx.conf.example /etc/nginx/sites-available/cal-ai
sudo ln -s /etc/nginx/sites-available/cal-ai /etc/nginx/sites-enabled/

# Remove default configuration if it exists
sudo rm -f /etc/nginx/sites-enabled/default
```

### 2. Configure SSL
You'll need to obtain SSL certificates for your domain. You can use Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d logme.yadbanapp.com
sudo certbot --nginx -d dev-logme.yadbanapp.com
```

### 3. Update Nginx Configuration
The provided configuration includes SSL certificate paths for Let's Encrypt. If you have different certificate paths, edit the configuration:

```bash
sudo nano /etc/nginx/sites-available/cal-ai
```

Update the SSL certificate lines if needed:
```nginx
# For production (logme.yadbanapp.com)
ssl_certificate /etc/letsencrypt/live/logme.yadbanapp.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/logme.yadbanapp.com/privkey.pem;

# For development (dev-logme.yadbanapp.com)
ssl_certificate /etc/letsencrypt/live/dev-logme.yadbanapp.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/dev-logme.yadbanapp.com/privkey.pem;
```

### 4. Test and Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 📝 **Important: Environment Variable Preservation**

The deployment workflow is designed to **preserve existing `.env` files**:
- ✅ **New deployments**: Creates `.env` with values from GitHub secrets
- ✅ **Existing deployments**: Preserves your manual `.env` configurations  
- ✅ **Manual override**: You can edit `.env` files directly on the server
- ⚠️ **Note**: Manual changes to `.env` will not be overwritten by deployments

## 🚀 GitHub Actions Deployment

### Workflow Configuration
The GitHub Action workflow (`.github/workflows/deploy.yml`) is configured to:

1. **Trigger on**: 
   - Push to `master`, `main`, or `dev` branches
   - Manual workflow dispatch

2. **Environment Detection**:
   - `dev` branch → Development environment
   - `master`/`main` branch → Production environment

3. **Build Process**:
   - Install Node.js and Flutter dependencies
   - Build the Node.js backend with TypeScript
   - Build the Flutter web application
   - Deploy to appropriate directories on server

4. **Deployment Steps**:
   - Deploy backend code via SSH
   - Upload Flutter web build via SCP
   - Configure environment variables
   - Restart PM2 processes
   - Perform health checks

### Environment URLs
- **Production**: `https://logme.yadbanapp.com` (Backend: Port 9000)
- **Development**: `https://dev-logme.yadbanapp.com` (Backend: Port 9001)

### API Endpoints
- **Production API**: `https://logme.yadbanapp.com/api` (Backend: Port 9000)
- **Development API**: `https://dev-logme.yadbanapp.com/api` (Backend: Port 9001)

## 📱 Flutter Web Configuration

The Flutter app is configured to automatically detect the environment:

- **Web builds** use the `Environment` class to determine API URLs
- **Mobile builds** still use localhost for development
- Environment is set via `--dart-define=API_BASE_URL=...` during build

## 🔧 Manual Deployment

If you need to deploy manually:

### Backend Deployment
```bash
# Navigate to repository directory
cd /var/www/cal-ai

# Pull latest code
git pull origin master

# Install dependencies
cd server
npm ci

# Build
npm run build
cd ..

# Restart PM2
pm2 restart cal-ai
```

### Frontend Deployment
```bash
# On your local machine, build Flutter web
flutter build web --release --web-renderer html --base-href / \
  --dart-define=API_BASE_URL=https://logme.yadbanapp.com/api

# Upload to server
scp -r build/web/* user@server:/var/www/cal-ai/web/
```

## 🔍 Monitoring and Logs

### PM2 Monitoring
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs cal-ai
pm2 logs cal-ai-dev

# Monitor in real-time
pm2 monit
```

### Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/cal-ai-prod.access.log
sudo tail -f /var/log/nginx/cal-ai-dev.access.log

# Error logs
sudo tail -f /var/log/nginx/cal-ai-prod.error.log
sudo tail -f /var/log/nginx/cal-ai-dev.error.log
```

### Health Checks
The application includes health check endpoints:
- `https://logme.yadbanapp.com/api/health`
- `https://dev-logme.yadbanapp.com/api/health`

## 🔒 Security Considerations

1. **Environment Variables**: Never commit sensitive data to the repository
2. **SSL/TLS**: Always use HTTPS in production
3. **Firewall**: Configure server firewall to only allow necessary ports
4. **Updates**: Keep dependencies and server OS updated
5. **Monitoring**: Set up monitoring and alerting for production

## 🛠️ Troubleshooting

### Fixing Current Deployment Issues

If you're experiencing deployment issues like wrong repository or missing dependencies, use the cleanup script:

```bash
# Upload and run the cleanup script
scp cleanup-server.sh user@your-server:/tmp/
scp setup-env.sh user@your-server:/tmp/
ssh user@your-server

# Run cleanup (this will fix repository and dependency issues)
cd /tmp
./cleanup-server.sh

# Setup environment variables and start services
# First, set your environment variables:
export MONGODB_URI="mongodb://localhost:27017/cal_ai"
export JWT_SECRET="your_actual_jwt_secret"
export OPENAI_API_KEY="your_actual_openai_api_key"

# Then run the environment setup
./setup-env.sh
```

### Common Issues

1. **Deployment fails at health check**:
   - Check PM2 logs: `pm2 logs cal-ai`
   - Verify environment variables are set correctly
   - Check MongoDB connection

2. **Flutter app can't connect to API**:
   - Verify Nginx configuration
   - Check API endpoints are responding
   - Verify CORS settings in backend

3. **Build failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check TypeScript compilation errors

### Debug Commands
```bash
# Check server status
curl https://logme.yadbanapp.com/api/health

# Test local API
curl http://localhost:3000/api/health

# Check Nginx configuration
sudo nginx -t

# Check PM2 processes
pm2 status
pm2 logs cal-ai --lines 50
```

## 📞 Support

If you encounter issues during deployment:

1. Check the GitHub Actions logs for build errors
2. Review server logs via SSH
3. Verify all prerequisites are met
4. Check network connectivity and DNS settings

---

**Happy Deploying! 🚀**