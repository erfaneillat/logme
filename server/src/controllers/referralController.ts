import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import ReferralLog from '../models/ReferralLog';
import errorLogger from '../services/errorLoggerService';

function generateCode(seed: string, attempt: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const hash = crypto.createHash('sha256').update(`${seed || 'fallback'}:${attempt}`).digest();
  let code = '';
  for (let i = 0; i < 6; i++) {
    const byte = hash[i] ?? Math.floor(Math.random() * alphabet.length);
    code += alphabet[byte % alphabet.length];
  }
  return code;
}

async function generateUniqueReferralCode(userId: string): Promise<string> {
  // Try deterministic code first, then add randomness if collision
  let attempt = 0;
  while (attempt < 10) {
    const base = generateCode(userId, attempt);
    const existing = await User.findOne({ referralCode: base });
    if (!existing) return base;
    attempt++;
  }
  // Final fallback: random
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let finalCode = '';
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    const byte = randomBytes[i] ?? Math.floor(Math.random() * alphabet.length);
    finalCode += alphabet[byte % alphabet.length];
  }
  return finalCode;
}

export class ReferralController {
  // GET /api/referral/my-code
  async getMyCode(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Generate referral code if user doesn't have one
      if (!user.referralCode) {
        const newReferralCode = await generateUniqueReferralCode(user.id);
        await User.findByIdAndUpdate(userId, { referralCode: newReferralCode }, { new: true });
        user.referralCode = newReferralCode;
      }

      res.json({ success: true, code: user.referralCode });
    } catch (err) {
      errorLogger.error('getMyCode error', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // GET /api/referral/validate/:code
  async validateCode(req: Request, res: Response): Promise<void> {
    try {
      const code = String(req.params.code || '').toUpperCase();
      const owner = await User.findOne({ referralCode: code });
      res.json({ success: true, valid: !!owner });
    } catch (err) {
      errorLogger.error('validateCode error', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // POST /api/referral/submit { code }
  async submitCode(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const code = String(req.body.code || '').toUpperCase().trim();
      if (!code) {
        res.status(400).json({ success: false, message: 'Code is required' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (user.referredBy) {
        res.status(409).json({ success: false, message: 'Referral already applied' });
        return;
      }

      // Ensure user has/gets a referralCode too (for sharing later)
      if (!user.referralCode) {
        const newReferralCode = await generateUniqueReferralCode(user.id);
        await User.findByIdAndUpdate(userId, { referralCode: newReferralCode }, { new: true });
        user.referralCode = newReferralCode;
      }

      const referrer = await User.findOne({ referralCode: code });
      if (!referrer) {
        res.status(404).json({ success: false, message: 'Invalid referral code' });
        return;
      }
      if (String(referrer.id) === String(user.id)) {
        res.status(400).json({ success: false, message: 'Cannot use your own code' });
        return;
      }

      // Mark referral only; reward will be applied after first successful subscription purchase
      user.referredBy = code;
      await user.save();

      // Log the referral code submission
      try {
        const referralLog = new ReferralLog({
          referrerId: referrer._id,
          referredUserId: user._id,
          referralCode: code,
          eventType: 'code_submitted',
          reward: 0,
        });
        await referralLog.save();
      } catch (logErr) {
        errorLogger.error('Failed to save referral log:', logErr);
      }

      res.json({ success: true });
    } catch (err) {
      errorLogger.error('submitCode error', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // GET /api/referral/summary
  async getSummary(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.json({
        success: true,
        count: user.referralSuccessCount || 0,
        earnings: user.referralEarnings || 0,
        rewardPerReferral: parseInt(process.env.REFERRAL_REWARD_TOMAN || '25000', 10),
      });
    } catch (err) {
      errorLogger.error('getSummary error', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // GET /api/referral/logs - Get referral logs for current user (as referrer)
  async getReferralLogs(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Get logs where this user is the referrer
      const total = await ReferralLog.countDocuments({ referrerId: userId });
      const logs = await ReferralLog.find({ referrerId: userId })
        .populate('referredUserId', 'name phone email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (err) {
      errorLogger.error('getReferralLogs error', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // PUT /api/referral/update-code { code }
  async updateCode(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const newCode = String(req.body.code || '').toUpperCase().trim();

      // Validate code format
      if (!newCode) {
        res.status(400).json({ success: false, message: 'Referral code is required' });
        return;
      }

      // Validate code length (4-8 characters)
      if (newCode.length < 4 || newCode.length > 8) {
        res.status(400).json({ success: false, message: 'Referral code must be 4-8 characters long' });
        return;
      }

      // Validate code contains only alphanumeric characters
      if (!/^[A-Z0-9]+$/.test(newCode)) {
        res.status(400).json({ success: false, message: 'Referral code can only contain letters and numbers' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Check if the new code is the same as current code
      if (user.referralCode && user.referralCode === newCode) {
        res.status(400).json({ success: false, message: 'New code must be different from current code' });
        return;
      }

      // Check if the new code is already taken by another user
      const existingUser = await User.findOne({ referralCode: newCode });
      if (existingUser && String(existingUser.id) !== String(userId)) {
        res.status(409).json({ success: false, message: 'This referral code is already taken' });
        return;
      }

      // Update the referral code
      user.referralCode = newCode;
      await user.save();

      res.json({ success: true, code: newCode });
    } catch (err) {
      errorLogger.error('updateCode error', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}
