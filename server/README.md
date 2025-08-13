# Cal AI Backend

A Node.js backend with MongoDB and TypeScript for Cal AI nutrition tracking application.

## Features

- User authentication with phone verification
- Nutrition plan generation using OpenAI
- Food image analysis with AI
- Daily nutrition logging
- RESTful API with proper error handling

## Prerequisites

- Node.js >= 18.0.0
- MongoDB running locally or remotely
- OpenAI API key for food analysis and plan generation

## Environment Variables

Create a `.env` file in the server root directory with the following variables:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost
CORS_ORIGIN=http://localhost:3001

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/cal_ai

# OpenAI API (required for food analysis)
OPENAI_API_KEY=your-openai-api-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see above)

3. Start MongoDB:
```bash
# macOS
brew services start mongodb-community

# Windows
# Start MongoDB service

# Linux
sudo systemctl start mongod
```

## Development

Start the development server with hot reload:
```bash
npm run dev
```

## Production

Build and start the production server:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/send-code` - Send verification code
- `POST /api/auth/verify-phone` - Verify phone number
- `POST /api/auth/profile` - Update user profile
- `POST /api/auth/refresh-token` - Refresh access token

### User Information
- `POST /api/user/additional-info` - Save additional user info
- `POST /api/user/mark-additional-info-completed` - Mark setup complete

### Plans
- `POST /api/plan/generate` - Generate nutrition plan
- `GET /api/plan/latest` - Get latest plan

### Food Analysis
- `POST /api/food/analyze` - Analyze food image and return nutrition data

### Logs
- `POST /api/logs` - Upsert daily log
- `GET /api/logs` - Get daily log by date

### Health
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health check

## Food Analysis API

The food analysis endpoint accepts a multipart form with an `image` field and returns:

```json
{
  "success": true,
  "data": {
    "title": "لوبیا سبزیجات روی برنج بخارپز",
    "calories": 520,
    "portions": 1,
    "proteinGrams": 16,
    "fatGrams": 10,
    "carbsGrams": 92,
    "healthScore": 7,
    "ingredients": [
      {
        "name": "برنج باسماتی",
        "calories": 260,
        "proteinGrams": 5,
        "fatGrams": 1,
        "carbsGrams": 56
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Architecture

The application follows clean architecture principles:

- **Domain Layer**: Entities, repositories interfaces, use cases
- **Data Layer**: Repository implementations, data sources
- **Presentation Layer**: Controllers, routes, middleware
- **Infrastructure**: Database connection, external services

## Error Handling

The application includes comprehensive error handling with:
- Custom error classes
- Global error middleware
- Proper HTTP status codes
- Detailed error messages in development

## Security

- JWT-based authentication
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet security headers
