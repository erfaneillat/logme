import { errorLogger } from '../services/errorLogger.service';

/**
 * Wrapper for API calls that automatically logs errors
 */
export async function withErrorLogging<T>(
  apiCall: () => Promise<T>,
  context: {
    action: string;
    component: string;
    metadata?: Record<string, any>;
  }
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    errorLogger.error(
      `API call failed: ${context.action}`,
      error as Error,
      {
        action: context.action,
        component: context.component,
      },
      context.metadata
    );
    throw error;
  }
}

/**
 * Create a wrapped API service with automatic error logging
 */
export function createApiService<T extends Record<string, any>>(
  service: T,
  serviceName: string
): T {
  const wrappedService = {} as T;

  for (const key in service) {
    const method = service[key];
    
    if (typeof method === 'function') {
      wrappedService[key] = (async (...args: any[]) => {
        try {
          return await method.apply(service, args);
        } catch (error) {
          errorLogger.error(
            `Service method failed: ${serviceName}.${key}`,
            error as Error,
            {
              action: key,
              component: serviceName,
            },
            { args }
          );
          throw error;
        }
      }) as any;
    } else {
      wrappedService[key] = method;
    }
  }

  return wrappedService;
}

/**
 * Global error handler for unhandled errors
 */
export function setupGlobalErrorHandlers(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.critical(
      'Unhandled promise rejection',
      event.reason,
      {
        component: 'GlobalErrorHandler',
        action: 'unhandledrejection',
      },
      {
        promise: event.promise,
      }
    );
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    errorLogger.critical(
      'Global error',
      event.error,
      {
        component: 'GlobalErrorHandler',
        action: 'error',
      },
      {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });
}
