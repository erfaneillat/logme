import fs from 'fs';
import path from 'path';
import { Request } from 'express';

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
    userId?: string | undefined;
    endpoint?: string | undefined;
    method?: string | undefined;
    ip?: string | undefined;
    userAgent?: string | undefined;
    requestBody?: any;
    requestParams?: any;
    requestQuery?: any;
  } | undefined;
  metadata?: Record<string, any> | undefined;
}

class ErrorLoggerService {
  private logDir: string;
  private maxLogSize: number = 10 * 1024 * 1024; // 10MB
  private maxLogFiles: number = 10;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get log file path for current date
   */
  private getLogFilePath(level: ErrorLevel): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${level.toLowerCase()}-${date}.log`);
  }

  /**
   * Rotate log file if it exceeds max size
   */
  private rotateLogFile(filePath: string): void {
    try {
      if (!fs.existsSync(filePath)) return;

      const stats = fs.statSync(filePath);
      if (stats.size < this.maxLogSize) return;

      // Create backup with timestamp
      const timestamp = Date.now();
      const backupPath = `${filePath}.${timestamp}`;
      fs.renameSync(filePath, backupPath);

      // Clean up old log files
      this.cleanupOldLogs(path.dirname(filePath), path.basename(filePath));
    } catch (error) {
      console.error('Error rotating log file:', error);
    }
  }

  /**
   * Clean up old log files
   */
  private cleanupOldLogs(dir: string, baseFileName: string): void {
    try {
      const files = fs.readdirSync(dir)
        .filter(f => f.startsWith(baseFileName))
        .map(f => ({
          name: f,
          path: path.join(dir, f),
          time: fs.statSync(path.join(dir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      // Keep only the most recent files
      files.slice(this.maxLogFiles).forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (error) {
          console.error(`Error deleting old log file ${file.name}:`, error);
        }
      });
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }

  /**
   * Write log entry to file
   */
  private writeToFile(entry: ErrorLogEntry): void {
    try {
      const filePath = this.getLogFilePath(entry.level);
      this.rotateLogFile(filePath);

      const logLine = JSON.stringify({
        ...entry,
        timestamp: entry.timestamp.toISOString(),
      }) + '\n';

      fs.appendFileSync(filePath, logLine, 'utf8');
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  /**
   * Extract request context
   */
  private extractRequestContext(req?: Request<any, any, any, any>): ErrorLogEntry['context'] | undefined {
    if (!req) return undefined;

    return {
      userId: (req as any).user?.userId,
      endpoint: req.originalUrl || req.url,
      method: req.method,
      ip: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
      requestBody: this.sanitizeData(req.body),
      requestParams: req.params,
      requestQuery: req.query,
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
   * Log an error
   */
  log(
    level: ErrorLevel,
    message: string,
    error?: Error | any,
    req?: Request<any, any, any, any>,
    metadata?: Record<string, any>
  ): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date(),
      level,
      message,
      stack: error?.stack,
      context: this.extractRequestContext(req),
      metadata: this.sanitizeData(metadata),
    };

    // Write to file
    this.writeToFile(entry);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const logMethod = level === ErrorLevel.ERROR || level === ErrorLevel.CRITICAL ? 'error' : 'log';
      console[logMethod](`[${level}] ${message}`, {
        error: error?.message,
        stack: error?.stack,
        context: entry.context,
        metadata: entry.metadata,
      });
    }

    // For critical errors, you might want to send alerts (email, Slack, etc.)
    if (level === ErrorLevel.CRITICAL) {
      this.handleCriticalError(entry);
    }
  }

  /**
   * Handle critical errors (send alerts, notifications, etc.)
   */
  private handleCriticalError(entry: ErrorLogEntry): void {
    // TODO: Implement critical error handling
    // - Send email to admins
    // - Send Slack notification
    // - Trigger monitoring alerts
    console.error('CRITICAL ERROR:', entry);
  }

  /**
   * Convenience methods for different log levels
   */
  info(message: string, req?: Request<any, any, any, any>, metadata?: Record<string, any>): void {
    this.log(ErrorLevel.INFO, message, undefined, req, metadata);
  }

  warning(message: string, error?: Error | any, req?: Request<any, any, any, any>, metadata?: Record<string, any>): void {
    this.log(ErrorLevel.WARNING, message, error, req, metadata);
  }

  error(message: string, error?: Error | any, req?: Request<any, any, any, any>, metadata?: Record<string, any>): void {
    this.log(ErrorLevel.ERROR, message, error, req, metadata);
  }

  critical(message: string, error?: Error | any, req?: Request<any, any, any, any>, metadata?: Record<string, any>): void {
    this.log(ErrorLevel.CRITICAL, message, error, req, metadata);
  }

  /**
   * Read logs from file
   */
  async readLogs(
    level: ErrorLevel,
    date?: string,
    limit: number = 100
  ): Promise<ErrorLogEntry[]> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const filePath = path.join(this.logDir, `${level.toLowerCase()}-${targetDate}.log`);

      if (!fs.existsSync(filePath)) {
        return [];
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);

      // Get the last N lines
      const recentLines = lines.slice(-limit);

      return recentLines.map(line => {
        try {
          const parsed = JSON.parse(line);
          return {
            ...parsed,
            timestamp: new Date(parsed.timestamp),
          };
        } catch {
          return null;
        }
      }).filter(Boolean) as ErrorLogEntry[];
    } catch (error) {
      console.error('Error reading logs:', error);
      return [];
    }
  }

  /**
   * Get log statistics
   */
  async getLogStats(date?: string): Promise<Record<ErrorLevel, number>> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const stats: Record<ErrorLevel, number> = {
      [ErrorLevel.INFO]: 0,
      [ErrorLevel.WARNING]: 0,
      [ErrorLevel.ERROR]: 0,
      [ErrorLevel.CRITICAL]: 0,
    };

    for (const level of Object.values(ErrorLevel)) {
      const filePath = path.join(this.logDir, `${level.toLowerCase()}-${targetDate}.log`);
      
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.trim().split('\n').filter(Boolean);
          stats[level] = lines.length;
        }
      } catch (error) {
        console.error(`Error reading stats for ${level}:`, error);
      }
    }

    return stats;
  }
}

export default new ErrorLoggerService();
