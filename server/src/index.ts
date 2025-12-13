import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import DatabaseConnection from './config/database';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import additionalInfoRoutes from './routes/additionalInfoRoutes';
import planRoutes from './routes/planRoutes';
import referralRoutes from './routes/referralRoutes';
import logRoutes from './routes/logRoutes';
import foodRoutes from './routes/foodRoutes';
import streakRoutes from './routes/streakRoutes';
import weightRoutes from './routes/weightRoutes';
import preferencesRoutes from './routes/preferencesRoutes';
// import luckyWheelRoutes from './routes/luckyWheelRoutes';
import subscriptionPlanRoutes from './routes/subscriptionPlanRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import offerRoutes from './routes/offerRoutes';
import userRoutes from './routes/userRoutes';
import statisticsRoutes from './routes/statisticsRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import adminLogsRoutes from './routes/adminLogsRoutes';
import appVersionRoutes from './routes/appVersionRoutes';
import ticketRoutes from './routes/ticketRoutes';
import notificationRoutes from './routes/notificationRoutes';
import fcmRoutes from './routes/fcmRoutes';
import errorLogRoutes from './routes/errorLogRoutes';
import chatRoutes from './routes/chatRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import firebaseService from './services/firebaseService';
import { sanitizeInput } from './middleware/validation';
import * as cron from 'node-cron';
import { resetInactiveUserStreaks } from './services/streakService';
import reminderService from './services/reminderService';

// Load environment variables first
dotenv.config();

// Validate critical environment variables
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY is not configured. AI exercise analysis will not work.');
}

const app = express();
const PORT = process.env.PORT || 9000;
const HOST = process.env.HOST || '0.0.0.0'; // Changed from 'localhost' to '0.0.0.0'

// Security middleware
// Configure Helmet to allow referrer information for third‑party trust badges (e.g., Enamad)
app.use(helmet({
  // Sends the origin for cross-origin requests while keeping strong privacy defaults
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',     // Admin panel dev
  'http://localhost:9001',     // Website dev
  'http://localhost:9000',     // Local server
  'https://loqmeapp.ir',       // Production website
  'https://dev.loqmeapp.ir',   // Development website
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    // Check if the origin is in our allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'development') {
      // In development, allow all origins
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(limiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.use(sanitizeInput);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', additionalInfoRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/referral', referralRoutes);
// app.use('/api/lucky-wheel', luckyWheelRoutes);
app.use('/api/subscription-plans', subscriptionPlanRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin/logs', adminLogsRoutes);
app.use('/api/app-version', appVersionRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/fcm', fcmRoutes);
app.use('/api/error-logs', errorLogRoutes);
app.use('/api/chat', chatRoutes);

// Serve static files from the React website build directory
const websiteBuildPath = path.join(__dirname, '../../website/build');
app.use(express.static(websiteBuildPath));

// Serve static files from the admin panel build directory
const panelBuildPath = path.join(__dirname, '../../panel/dist');
app.use('/panel', express.static(panelBuildPath));

// API status endpoint (moved to /api/status to avoid conflicts with React routing)
app.get('/api/status', (req, res) => {
  res.json({
    message: 'Cal AI Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Handle admin panel routing - serve index.html for all /panel/* routes
app.get('/panel/*', (req, res) => {
  return res.sendFile(path.join(panelBuildPath, 'index.html'));
});

// Handle React website routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  return res.sendFile(path.join(websiteBuildPath, 'index.html'));
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Cron job setup
function setupCronJobs(): void {
  console.log('Setting up cron jobs...');

  // Reset inactive user streaks daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('Running daily streak reset cron job...');
      const resetCount = await resetInactiveUserStreaks(7); // Reset streaks for users inactive for 7+ days
      console.log(`Cron job completed: Reset ${resetCount} user streaks`);
    } catch (error) {
      console.error('Error in streak reset cron job:', error);
    }
  }, {
    timezone: 'UTC' // Use UTC timezone for consistency
  });

  cron.schedule('0 9 * * *', async () => {
    try {
      await reminderService.sendDailyReminders();
    } catch (error) {
      console.error('Error in daily reminders cron:', error);
    }
  }, {
    timezone: 'Asia/Tehran'
  });

  cron.schedule('30 9 * * *', async () => {
    try {
      await reminderService.sendInactivityReminders();
    } catch (error) {
      console.error('Error in inactivity reminders cron:', error);
    }
  }, {
    timezone: 'Asia/Tehran'
  });

  console.log('Cron jobs setup completed');
}

// Database connection and server startup
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    const dbConnection = DatabaseConnection.getInstance();
    await dbConnection.connect();

    // Initialize Firebase for push notifications
    firebaseService.initialize();

    // Setup cron jobs
    setupCronJobs();

    // Start server
    const server = app.listen(Number(PORT), HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check available at: http://${HOST}:${PORT}/api/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      console.log(`Received ${signal}, shutting down gracefully...`);

      server.close(async () => {
        console.log('HTTP server closed.');

        try {
          await dbConnection.disconnect();
          console.log('Database connection closed.');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;
