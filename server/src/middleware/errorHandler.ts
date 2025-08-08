import { Request, Response, NextFunction } from 'express';
import { ApiResponse, DatabaseError, ValidationError } from '@/types';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | AppError | DatabaseError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'MongoServerError') {
    const mongoError = error as DatabaseError;
    if (mongoError.code === 11000) {
      statusCode = 409;
      message = 'Duplicate field value';
    } else {
      statusCode = 400;
      message = 'Database operation failed';
    }
  }

  const response: ApiResponse = {
    success: false,
    error: message,
    timestamp: new Date(),
  };

  if ((process.env as any).NODE_ENV === 'development') {
    response.data = { stack: error.stack };
  }

  res.status(statusCode).json(response);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.originalUrl} not found`,
    timestamp: new Date(),
  };

  res.status(404).json(response);
};
