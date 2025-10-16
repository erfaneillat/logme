import { Request, Response } from 'express';
import errorLogger, { ErrorLevel } from '../services/errorLoggerService';

export class ErrorLogController {
  /**
   * Get error logs
   */
  async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const { level = 'ERROR', date, limit = '100' } = req.query;
      
      const validLevel = Object.values(ErrorLevel).includes(level as ErrorLevel)
        ? (level as ErrorLevel)
        : ErrorLevel.ERROR;
      
      const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 100, 1), 1000);
      
      const logs = await errorLogger.readLogs(
        validLevel,
        date as string | undefined,
        limitNum
      );

      res.json({
        success: true,
        data: {
          logs,
          level: validLevel,
          date: date || new Date().toISOString().split('T')[0],
          count: logs.length,
        },
      });
    } catch (error) {
      errorLogger.error('Error fetching logs', error as Error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch logs',
      });
    }
  }

  /**
   * Get error log statistics
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.query;
      
      const stats = await errorLogger.getLogStats(date as string | undefined);

      res.json({
        success: true,
        data: {
          stats,
          date: date || new Date().toISOString().split('T')[0],
        },
      });
    } catch (error) {
      errorLogger.error('Error fetching log stats', error as Error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch log statistics',
      });
    }
  }

  /**
   * Manually log an error (for testing or manual logging)
   */
  async createLog(req: Request, res: Response): Promise<void> {
    try {
      const { level, message, metadata } = req.body;

      if (!message) {
        res.status(400).json({
          success: false,
          message: 'Message is required',
        });
        return;
      }

      const validLevel = Object.values(ErrorLevel).includes(level)
        ? level
        : ErrorLevel.INFO;

      errorLogger.log(validLevel, message, undefined, req, metadata);

      res.json({
        success: true,
        message: 'Log entry created successfully',
      });
    } catch (error) {
      errorLogger.error('Error creating log entry', error as Error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to create log entry',
      });
    }
  }
}

export default new ErrorLogController();
