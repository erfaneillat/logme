import { Request, Response } from 'express';
import { getCompletedStreakDatesInRange } from '../services/streakService';
import errorLogger from '../services/errorLoggerService';

interface AuthRequest extends Request { user?: any }

export class StreakController {
  async getCompletionsRange(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const start = (req.query.start as string) || '';
      const end = (req.query.end as string) || '';
      if (!start || !end) {
        res.status(400).json({ success: false, message: 'start and end (YYYY-MM-DD) are required' });
        return;
      }

      const dates = await getCompletedStreakDatesInRange(userId, start, end);
      res.json({ success: true, data: { dates } });
    } catch (error) {
      errorLogger.error('Get streak completions error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

export default new StreakController();
