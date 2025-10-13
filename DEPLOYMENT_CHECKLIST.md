# Deployment Checklist for Panel Integration

## Pre-Deployment Tasks

- [x] ✅ Panel configured with base path `/panel/`
- [x] ✅ React Router configured with basename `/panel`
- [x] ✅ Server configured to serve panel static files at `/panel`
- [x] ✅ Server configured to handle panel SPA routing
- [x] ✅ CORS updated to allow panel access
- [x] ✅ CI/CD updated to build and deploy panel
- [x] ✅ Nginx configuration updated
- [x] ✅ API configuration supports environment variables

## Server Setup Tasks

### 1. Update Nginx Configuration
On the server, update the nginx configuration to use the new setup:

```bash
# SSH into the server
ssh username@loqmeapp.ir

# Backup current nginx config
sudo cp /etc/nginx/sites-available/cal-ai /etc/nginx/sites-available/cal-ai.backup

# Edit nginx configuration
sudo nano /etc/nginx/sites-available/cal-ai

# Copy the contents from nginx.conf.example in the repository
# Key changes:
# - Updated domains (loqmeapp.ir, dev.loqmeapp.ir)
# - Added /panel proxy
# - Simplified to proxy all requests to Node.js

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

### 2. Verify SSL Certificates
Ensure SSL certificates exist for the domains:

```bash
# Check if certificates exist
sudo ls -la /etc/letsencrypt/live/loqmeapp.ir/
sudo ls -la /etc/letsencrypt/live/dev.loqmeapp.ir/

# If certificates don't exist, obtain them with certbot
sudo certbot --nginx -d loqmeapp.ir -d www.loqmeapp.ir
sudo certbot --nginx -d dev.loqmeapp.ir
```

### 3. Verify Directory Structure
Ensure the correct directory structure exists:

```bash
# Production
ls -la /var/www/cal-ai/server
ls -la /var/www/cal-ai/website
ls -la /var/www/cal-ai/panel

# Development
ls -la /var/www/cal-ai-dev/server
ls -la /var/www/cal-ai-dev/website
ls -la /var/www/cal-ai-dev/panel
```

### 4. Environment Variables
Ensure the server has the correct environment variables:

```bash
# Check PM2 environment for production
pm2 env cal-ai

# Check PM2 environment for development
pm2 env cal-ai-dev

# Verify these variables exist:
# - NODE_ENV (production/development)
# - PORT (9000 for prod, 9001 for dev)
# - OPENAI_API_KEY
# - MONGODB_URI
# - JWT_SECRET
# - All other required variables
```

## Post-Deployment Verification

### 1. Test API Endpoints
```bash
# Health check
curl https://loqmeapp.ir/api/health

# Status check
curl https://loqmeapp.ir/api/status
```

### 2. Test Panel Access
- Visit: `https://loqmeapp.ir/panel`
- Verify: Panel loads correctly
- Verify: Routes work (dashboard, analytics, logs, etc.)
- Verify: API calls work from panel

### 3. Test Website Access
- Visit: `https://loqmeapp.ir`
- Verify: Website loads correctly
- Verify: Website routing works

### 4. Check PM2 Status
```bash
# On the server
pm2 status
pm2 logs cal-ai --lines 50
pm2 logs cal-ai-dev --lines 50
```

### 5. Check Nginx Logs
```bash
# On the server
sudo tail -f /var/log/nginx/cal-ai-prod.access.log
sudo tail -f /var/log/nginx/cal-ai-prod.error.log
sudo tail -f /var/log/nginx/cal-ai-dev.access.log
sudo tail -f /var/log/nginx/cal-ai-dev.error.log
```

## Troubleshooting

### Panel Not Loading
1. Check if panel build exists: `ls -la /var/www/cal-ai/panel/dist/`
2. Check server logs: `pm2 logs cal-ai`
3. Check nginx logs: `sudo tail -f /var/log/nginx/cal-ai-prod.error.log`
4. Verify nginx is proxying to correct port (9000 for prod, 9001 for dev)

### Panel Shows 404 on Refresh
1. Verify nginx is routing `/panel/*` to Node.js server
2. Verify server has the catch-all route for panel SPA routing
3. Check that `index.html` exists in panel build directory

### API Calls Failing from Panel
1. Check CORS configuration in server
2. Verify API URL in panel config
3. Check network tab in browser dev tools
4. Verify API endpoints are accessible: `curl https://loqmeapp.ir/api/health`

### Build Failures
1. Check if `panel/package-lock.json` exists
2. Verify Node.js version (should be 18.x)
3. Check CI/CD logs for specific error messages
4. Verify environment variables are set in CI/CD

## Manual Deployment (if needed)

If CI/CD fails, you can deploy manually:

```bash
# SSH into server
ssh username@loqmeapp.ir

# Navigate to app directory
cd /var/www/cal-ai

# Pull latest code
git pull origin master  # or 'dev' branch for development

# Install and build panel
cd panel
npm ci
VITE_API_URL=https://loqmeapp.ir/api npm run build

# Install and build server
cd ../server
npm ci
npm run build

# Install and build website
cd ../website
npm ci
REACT_APP_API_URL=https://loqmeapp.ir/api npm run build

# Restart PM2
pm2 restart cal-ai
```

## Security Checklist

- [ ] SSL certificates are valid and not expired
- [ ] CORS is properly configured (not allowing all origins in production)
- [ ] Admin authentication is working
- [ ] Sensitive environment variables are not exposed
- [ ] Rate limiting is enabled (if desired)
- [ ] Security headers are set in nginx

## Performance Checklist

- [ ] Gzip compression is enabled in nginx
- [ ] Static assets are being served efficiently
- [ ] PM2 is running in cluster mode (if needed)
- [ ] Database indexes are optimized
- [ ] Response times are acceptable (< 200ms for API calls)
