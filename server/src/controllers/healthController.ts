import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import DatabaseConnection from '../config/database';
import mongoose from 'mongoose';

export const getHealthStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const healthCheck: Record<string, any> = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  };

  try {
    // Check MongoDB connection
    const dbConnection = DatabaseConnection.getInstance();
    const isConnected = dbConnection.getConnectionStatus();
    
    healthCheck['database'] = isConnected ? 'connected' : 'disconnected';
    
    res.status(200).json({
      success: true,
      data: healthCheck,
      timestamp: new Date(),
    });
  } catch (error) {
    healthCheck['database'] = 'error';
    healthCheck['error'] = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      data: healthCheck,
      timestamp: new Date(),
    });
  }
});

export const getDetailedHealth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const detailedHealth: Record<string, any> = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    database: {
      status: 'unknown',
      host: 'unknown',
      port: 'unknown',
      name: 'unknown',
    },
  };

  try {
    // Get MongoDB connection details
    const connection = mongoose.connection;
    if (connection.readyState === 1) {
      detailedHealth.database = {
        status: 'connected',
        host: connection.host || 'localhost',
        port: connection.port?.toString() || '27017',
        name: connection.name || 'cal_ai',
      };
    } else {
      detailedHealth.database.status = 'disconnected';
      detailedHealth.status = 'unhealthy';
    }

    res.status(200).json({
      success: true,
      data: detailedHealth,
      timestamp: new Date(),
    });
  } catch (error) {
    detailedHealth.status = 'unhealthy';
    detailedHealth.database.status = 'error';
    
    res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      data: detailedHealth,
      timestamp: new Date(),
    });
  }
});
