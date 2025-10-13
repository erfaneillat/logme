# Cal AI - Calorie Tracking Application

A comprehensive calorie tracking and nutrition management platform with Flutter mobile app, React website, admin panel, and Node.js backend.

## Project Structure

```
cal_ai/
├── lib/                    # Flutter mobile app source code
├── server/                 # Node.js/Express backend API
├── website/               # React website (public-facing)
├── panel/                 # React admin panel
├── assets/                # Shared assets (fonts, images, translations)
└── [platform folders]     # android, ios, web, etc.
```

## Components

### 📱 Flutter Mobile App
- iOS and Android calorie tracking application
- Features: Food logging, exercise tracking, weight management, AI analysis
- State management: Riverpod & Hooks
- Architecture: Clean Architecture

### 🖥️ Backend Server (Node.js/Express)
- RESTful API for mobile app and web clients
- MongoDB database
- Authentication, user management, analytics
- AI-powered exercise and food analysis (OpenAI integration)
- Located in `/server` directory

### 🌐 React Website
- Public-facing website
- User registration and information
- Located in `/website` directory
- Built with Create React App

### 👨‍💼 Admin Panel
- Admin dashboard for user management
- Analytics and logs visualization
- Subscription management
- Located in `/panel` directory
- Built with Vite + React + TypeScript
- **Access URL**: `/panel` route (e.g., `https://loqmeapp.ir/panel`)

## Quick Start

### Mobile App
```bash
flutter pub get
flutter run
```

### Backend Server
```bash
cd server
npm install
npm run dev
```

### Website
```bash
cd website
npm install
npm start
```

### Admin Panel
```bash
cd panel
npm install
npm run dev
# Access at http://localhost:5173
# Or build and access via server at http://localhost:9000/panel
```

## Documentation

- 📋 [Panel Setup Guide](PANEL_SETUP_GUIDE.md) - Panel configuration and deployment
- ✅ [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Step-by-step deployment guide
- 🚀 [Deployment Guide](DEPLOYMENT.md) - General deployment information
- 🔧 [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions

## Deployment

The project uses GitHub Actions for CI/CD:
- Pushes to `master` branch deploy to **production** (`loqmeapp.ir`)
- Pushes to `dev` branch deploy to **development** (`dev.loqmeapp.ir`)

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for detailed deployment steps.

## Environment Setup

### Server Environment Variables
Required environment variables for the backend (see `server/.env.example`):
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `PORT` - Server port (9000 for prod, 9001 for dev)

### Panel Environment Variables
- `VITE_API_URL` - API base URL (set during build)

### Website Environment Variables
- `REACT_APP_API_URL` - API base URL (set during build)

## Technology Stack

- **Mobile**: Flutter, Riverpod, Hooks
- **Backend**: Node.js, Express, MongoDB, TypeScript
- **Website**: React, React Router
- **Admin Panel**: React, Vite, TypeScript, TailwindCSS, Recharts
- **Infrastructure**: Nginx, PM2, GitHub Actions
- **AI**: OpenAI GPT integration
