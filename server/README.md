# Cal AI Backend

A Node.js backend API built with TypeScript, Express, and MongoDB for the Cal AI application.

## Features

- **TypeScript**: Full TypeScript support with strict type checking
- **MongoDB**: MongoDB integration with Mongoose ODM
- **Security**: Helmet, CORS, Rate limiting, and input sanitization
- **Validation**: Request validation using express-validator
- **Error Handling**: Comprehensive error handling with custom error classes
- **Logging**: HTTP request logging with Morgan
- **Testing**: Ready for Jest testing framework
- **Clean Architecture**: Organized folder structure following clean architecture principles

## Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files (database, environment)
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── repositories/    # Data access layer
│   ├── routes/          # Express routes
│   ├── services/        # Business logic layer
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── index.ts         # Application entry point
├── dist/                # Compiled JavaScript output
├── .env.example         # Environment variables template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── nodemon.json         # Nodemon configuration for development
```

## Getting Started

### Prerequisites

- Node.js (>= 18.0.0)
- MongoDB (>= 4.4)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd cal_ai/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration:
   ```
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/cal_ai
   JWT_SECRET=your-super-secret-key
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Access the API**
   - Health check: http://localhost:3000/api/health
   - Detailed health: http://localhost:3000/api/health/detailed

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run seed` - Seed the database with sample data

## API Endpoints

### Health Check
- `GET /` - API information
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health check with system info

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment (development/production) | development |
| PORT | Server port | 3000 |
| HOST | Server host | localhost |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/cal_ai |
| JWT_SECRET | JWT secret key | random string |
| CORS_ORIGIN | CORS allowed origin | http://localhost:3001 |

## Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Cross-Origin Resource Sharing configuration
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Request validation and sanitization
- **Password Hashing**: bcrypt for password security
- **JWT Authentication**: Secure token-based authentication

## Development

### Adding New Features

1. **Models**: Define new Mongoose models in `src/models/`
2. **Controllers**: Create controllers in `src/controllers/`
3. **Routes**: Add routes in `src/routes/`
4. **Middleware**: Create custom middleware in `src/middleware/`
5. **Types**: Add TypeScript types in `src/types/`

### Testing

The project is set up for Jest testing. Add test files alongside your source files with `.test.ts` or `.spec.ts` extensions.

### Database

MongoDB connection is managed through `DatabaseConnection` class in `src/config/database.ts`. The connection is automatically established when the server starts and gracefully closed on shutdown.

## Contributing

1. Create a new branch for your feature
2. Write tests for new functionality
3. Ensure all tests pass
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
