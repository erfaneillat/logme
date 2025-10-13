# Admin Panel Setup Guide

## Overview
The admin panel is now configured to be served at `/panel` route on the production server.

## Changes Made

### 1. Panel Configuration (`panel/vite.config.ts`)
- Set `base: '/panel/'` for correct asset paths
- Build output to `dist` directory

### 2. React Router (`panel/src/App.tsx`)
- Added `basename="/panel"` to BrowserRouter
- All routes now work under `/panel/*` path

### 3. Server Configuration (`server/src/index.ts`)
- Added static file serving for panel at `/panel` route
- Added route handler for `/panel/*` to serve index.html (SPA routing)
- Updated CORS to allow panel access from both dev and production
- Route order:
  1. API routes (`/api/*`)
  2. Panel static files (`/panel`)
  3. Panel SPA routing (`/panel/*`)
  4. Website static files (root)
  5. Website SPA routing (`/*`)

### 4. CI/CD Pipeline (`.github/workflows/deploy.yml`)
- Added panel dependency installation
- Added panel build step with environment variables
- Panel is built on the server during deployment
- Environment-specific API URLs:
  - Development: `https://dev.loqmeapp.ir/api`
  - Production: `https://loqmeapp.ir/api`

### 5. API Configuration (`panel/src/config/api.ts`)
- Updated to use `VITE_API_URL` environment variable
- Falls back to localhost in dev, production URL otherwise

## Access URLs

### Development
- Panel: `http://localhost:9000/panel`
- API: `http://localhost:9000/api`
- Website: `http://localhost:9000`

### Production
- Panel: `https://loqmeapp.ir/panel`
- API: `https://loqmeapp.ir/api`
- Website: `https://loqmeapp.ir`

### Development Server
- Panel: `https://dev.loqmeapp.ir/panel`
- API: `https://dev.loqmeapp.ir/api`
- Website: `https://dev.loqmeapp.ir`

## Local Development

### Start panel in development mode:
```bash
cd panel
npm run dev
# Access at http://localhost:5173
```

### Build panel locally:
```bash
cd panel
npm run build
# Output in panel/dist
```

### Test panel with server locally:
```bash
# Build panel
cd panel
npm run build

# Start server (from server directory)
cd ../server
npm run dev
# Access panel at http://localhost:9000/panel
```

## Deployment

The CI/CD pipeline automatically:
1. Installs panel dependencies
2. Builds the panel with correct environment variables
3. Deploys to the server
4. Server serves panel at `/panel` route

## Nginx Configuration

The nginx configuration has been updated to:
- Use the new domain `loqmeapp.ir` (production) and `dev.loqmeapp.ir` (development)
- Proxy all requests to the Node.js server (which handles static file serving)
- Route `/panel` requests to the admin panel
- Route `/api/*` requests to the API
- Route everything else to the React website

After deployment, you may need to update the nginx configuration on the server:
```bash
# On the server
sudo nano /etc/nginx/sites-available/cal-ai
# Copy the contents from nginx.conf.example
sudo nginx -t  # Test configuration
sudo systemctl reload nginx  # Reload nginx
```

## Notes

- The panel uses Vite (not Create React App like the website)
- Panel build output is `dist/` (not `build/`)
- All panel routes are prefixed with `/panel` in production
- CORS is configured to allow panel access from all environments
- Panel authentication uses the same API endpoints as the mobile app
- The Node.js server handles all static file serving (website + panel)
- Nginx acts as a reverse proxy to the Node.js server
