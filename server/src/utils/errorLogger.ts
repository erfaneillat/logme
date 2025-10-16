import { Request, Response, NextFunction } from 'express';
import errorLogger from '../services/errorLoggerService';

/**
 * Wrapper for async route handlers that automatically logs errors
 * Use this to wrap your controller methods for automatic error logging
 * 
 * @example
 * router.get('/users', withErrorLogging(userController.list.bind(userController)));
 */
export const withErrorLogging = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  context?: { controller?: string; action?: string }
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      const errorContext = {
        controller: context?.controller || 'Unknown',
        action: context?.action || req.path,
      };

      errorLogger.error(
        `Error in ${errorContext.controller}.${errorContext.action}`,
        error as Error,
        req,
        errorContext
      );

      // Pass to error handling middleware
      next(error);
    }
  };
};

/**
 * Decorator-style wrapper for controller methods
 * Automatically logs errors and provides consistent error responses
 * 
 * @example
 * class UserController {
 *   @logErrors('UserController', 'create')
 *   async create(req: Request, res: Response): Promise<void> {
 *     // Your code here
 *   }
 * }
 */
export function logErrors(controller: string, action: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: Request, res: Response, ...args: any[]) {
      try {
        return await originalMethod.apply(this, [req, res, ...args]);
      } catch (error) {
        errorLogger.error(
          `Error in ${controller}.${action}`,
          error as Error,
          req,
          { controller, action }
        );

        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Internal server error',
          });
        }
      }
    };

    return descriptor;
  };
}

/**
 * Helper to log service-level errors
 * Use this in service classes that don't have access to Express Request
 * 
 * @example
 * class UserService {
 *   async createUser(data: any) {
 *     try {
 *       // Your code
 *     } catch (error) {
 *       logServiceError('UserService', 'createUser', error, { data });
 *       throw error;
 *     }
 *   }
 * }
 */
export function logServiceError(
  service: string,
  method: string,
  error: Error | any,
  metadata?: Record<string, any>
): void {
  errorLogger.error(
    `Error in ${service}.${method}`,
    error,
    undefined,
    {
      service,
      method,
      ...metadata,
    }
  );
}

/**
 * Helper to log warnings
 */
export function logWarning(
  message: string,
  req?: Request,
  metadata?: Record<string, any>
): void {
  errorLogger.warning(message, undefined, req, metadata);
}

/**
 * Helper to log info
 */
export function logInfo(
  message: string,
  req?: Request,
  metadata?: Record<string, any>
): void {
  errorLogger.info(message, req, metadata);
}

/**
 * Helper to log critical errors
 */
export function logCritical(
  message: string,
  error: Error | any,
  req?: Request,
  metadata?: Record<string, any>
): void {
  errorLogger.critical(message, error, req, metadata);
}
