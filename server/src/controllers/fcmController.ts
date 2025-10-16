import { Request, Response } from 'express';
import User from '../models/User';
import errorLogger from '../services/errorLoggerService';

export class FcmController {
  /**
   * Register or update FCM token for the user
   */
  async registerToken(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { token } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!token || typeof token !== 'string' || token.trim().length === 0) {
        res.status(400).json({ success: false, message: 'Valid FCM token is required' });
        return;
      }

      // Find user and add token if not already present
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Initialize fcmTokens array if it doesn't exist
      if (!user.fcmTokens) {
        user.fcmTokens = [];
      }

      // Add token if not already present
      if (!user.fcmTokens.includes(token)) {
        user.fcmTokens.push(token);
        await user.save();
        console.log(`✅ FCM token registered for user ${userId}`);
      } else {
        console.log(`ℹ️  FCM token already registered for user ${userId}`);
      }

      res.json({
        success: true,
        message: 'FCM token registered successfully',
      });
    } catch (error) {
      errorLogger.error('Register FCM token error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /**
   * Remove FCM token from the user
   */
  async removeToken(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { token } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!token || typeof token !== 'string') {
        res.status(400).json({ success: false, message: 'Valid FCM token is required' });
        return;
      }

      // Remove token from user
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: token },
      });

      console.log(`✅ FCM token removed for user ${userId}`);

      res.json({
        success: true,
        message: 'FCM token removed successfully',
      });
    } catch (error) {
      errorLogger.error('Remove FCM token error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /**
   * Get all FCM tokens for the user (for debugging)
   */
  async getTokens(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await User.findById(userId).select('fcmTokens');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          tokens: user.fcmTokens || [],
          count: user.fcmTokens?.length || 0,
        },
      });
    } catch (error) {
      errorLogger.error('Get FCM tokens error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

export default new FcmController();
