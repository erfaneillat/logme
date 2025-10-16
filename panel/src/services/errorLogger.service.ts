export enum ErrorLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface ErrorLogEntry {
  timestamp: Date;
  level: ErrorLevel;
  message: string;
  stack?: string;
  context?: {
    url?: string;
    userAgent?: string;
    userId?: string;
    component?: string;
    action?: string;
  };
  metadata?: Record<string, any>;
}

class ErrorLoggerService {
  private maxLocalLogs: number = 100;
  private localLogs: ErrorLogEntry[] = [];

  /**
   * Extract context information
   */
  private extractContext(context?: Partial<ErrorLogEntry['context']>): ErrorLogEntry['context'] {
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context,
    };
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sensitiveFields = [
      'password',
      'token',
      'authorization',
      'apiKey',
      'secret',
      'verificationCode',
      'otp',
      'creditCard',
      'cvv',
    ];

    const sanitized = { ...data };

    for (const key in sanitized) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Store log entry locally
   */
  private storeLocally(entry: ErrorLogEntry): void {
    this.localLogs.push(entry);

    // Keep only the most recent logs
    if (this.localLogs.length > this.maxLocalLogs) {
      this.localLogs = this.localLogs.slice(-this.maxLocalLogs);
    }

    // Also store in localStorage for persistence
    try {
      const storedLogs = this.getStoredLogs();
      storedLogs.push({
        ...entry,
        timestamp: entry.timestamp.toISOString(),
      });

      // Keep only recent logs in localStorage
      const recentLogs = storedLogs.slice(-this.maxLocalLogs);
      localStorage.setItem('error_logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to store log in localStorage:', error);
    }
  }

  /**
   * Get stored logs from localStorage
   */
  private getStoredLogs(): any[] {
    try {
      const stored = localStorage.getItem('error_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Send log to server (optional)
   */
  private async sendToServer(entry: ErrorLogEntry): Promise<void> {
    // Only send ERROR and CRITICAL logs to server
    if (entry.level !== ErrorLevel.ERROR && entry.level !== ErrorLevel.CRITICAL) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      // Send to server error logging endpoint
      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000'}/api/error-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          level: entry.level,
          message: entry.message,
          metadata: {
            stack: entry.stack,
            context: entry.context,
            ...entry.metadata,
          },
        }),
      });
    } catch (error) {
      // Silently fail - don't create infinite loop
      console.error('Failed to send log to server:', error);
    }
  }

  /**
   * Log an error
   */
  log(
    level: ErrorLevel,
    message: string,
    error?: Error | any,
    context?: Partial<ErrorLogEntry['context']>,
    metadata?: Record<string, any>
  ): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date(),
      level,
      message,
      stack: error?.stack,
      context: this.extractContext(context),
      metadata: this.sanitizeData(metadata),
    };

    // Store locally
    this.storeLocally(entry);

    // Log to console in development
    if (import.meta.env.DEV) {
      const logMethod = level === ErrorLevel.ERROR || level === ErrorLevel.CRITICAL ? 'error' : 'log';
      console[logMethod](`[${level}] ${message}`, {
        error: error?.message,
        stack: error?.stack,
        context: entry.context,
        metadata: entry.metadata,
      });
    }

    // Send to server asynchronously
    this.sendToServer(entry).catch(() => {
      // Ignore errors from sending to server
    });

    // For critical errors, you might want to show a user notification
    if (level === ErrorLevel.CRITICAL) {
      this.handleCriticalError(entry);
    }
  }

  /**
   * Handle critical errors
   */
  private handleCriticalError(entry: ErrorLogEntry): void {
    // TODO: Show user notification, send to monitoring service, etc.
    console.error('CRITICAL ERROR:', entry);
  }

  /**
   * Convenience methods for different log levels
   */
  info(
    message: string,
    context?: Partial<ErrorLogEntry['context']>,
    metadata?: Record<string, any>
  ): void {
    this.log(ErrorLevel.INFO, message, undefined, context, metadata);
  }

  warning(
    message: string,
    error?: Error | any,
    context?: Partial<ErrorLogEntry['context']>,
    metadata?: Record<string, any>
  ): void {
    this.log(ErrorLevel.WARNING, message, error, context, metadata);
  }

  error(
    message: string,
    error?: Error | any,
    context?: Partial<ErrorLogEntry['context']>,
    metadata?: Record<string, any>
  ): void {
    this.log(ErrorLevel.ERROR, message, error, context, metadata);
  }

  critical(
    message: string,
    error?: Error | any,
    context?: Partial<ErrorLogEntry['context']>,
    metadata?: Record<string, any>
  ): void {
    this.log(ErrorLevel.CRITICAL, message, error, context, metadata);
  }

  /**
   * Get local logs
   */
  getLocalLogs(): ErrorLogEntry[] {
    return [...this.localLogs];
  }

  /**
   * Get all stored logs (from localStorage)
   */
  getAllStoredLogs(): ErrorLogEntry[] {
    const stored = this.getStoredLogs();
    return stored.map(log => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.localLogs = [];
    try {
      localStorage.removeItem('error_logs');
    } catch (error) {
      console.error('Failed to clear logs from localStorage:', error);
    }
  }

  /**
   * Get log statistics
   */
  getStats(): Record<ErrorLevel, number> {
    const logs = this.getAllStoredLogs();
    const stats: Record<ErrorLevel, number> = {
      [ErrorLevel.INFO]: 0,
      [ErrorLevel.WARNING]: 0,
      [ErrorLevel.ERROR]: 0,
      [ErrorLevel.CRITICAL]: 0,
    };

    logs.forEach(log => {
      stats[log.level]++;
    });

    return stats;
  }
}

export const errorLogger = new ErrorLoggerService();
