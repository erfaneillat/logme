import { Request, Response } from 'express';
import User from '../models/User';

function generateCode(seed: string): string {
  // Simple deterministic-ish generator: take alphanum of seed + random fallback
  const base = seed.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    const idx = (base.charCodeAt(i % base.length) + i * 17) % alphabet.length;
    code += alphabet[idx];
  }
  return code;
}

async function generateUniqueReferralCode(userId: string): Promise<string> {
  // Try deterministic code first, then add randomness if collision
  let attempt = 0;
  while (attempt < 10) {
    const base = attempt === 0 ? generateCode(userId) : generateCode(userId + ':' + attempt);
    const existing = await User.findOne({ referralCode: base });
    if (!existing) return base;
    attempt++;
  }
  // Final fallback: random
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let finalCode = '';
  for (let i = 0; i < 6; i++) finalCode += alphabet[Math.floor(Math.random() * alphabet.length)];
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

      if (!user.referralCode) {
        user.referralCode = await generateUniqueReferralCode(user.id);
        await user.save();
      }

      res.json({ success: true, code: user.referralCode });
    } catch (err) {
      console.error('getMyCode error', err);
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
      console.error('validateCode error', err);
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
        user.referralCode = await generateUniqueReferralCode(user.id);
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

      // Mark referral and reward referrer
      user.referredBy = code;
      await user.save();

      const reward = parseInt(process.env.REFERRAL_REWARD_TOMAN || '25000', 10);
      referrer.referralSuccessCount = (referrer.referralSuccessCount || 0) + 1;
      referrer.referralEarnings = (referrer.referralEarnings || 0) + reward;
      await referrer.save();

      res.json({ success: true });
    } catch (err) {
      console.error('submitCode error', err);
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
      console.error('getSummary error', err);
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
      if (user.referralCode === newCode) {
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
      console.error('updateCode error', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}
