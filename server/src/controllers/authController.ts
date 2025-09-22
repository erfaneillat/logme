import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { validationResult } from 'express-validator';
import { createSMSService } from '../services/smsService';

interface AuthRequest extends Request {
  user?: any;
}

export class AuthController {
  private smsService = createSMSService();

  constructor() {
    // Bind methods to preserve 'this' context
    this.sendVerificationCode = this.sendVerificationCode.bind(this);
    this.verifyPhone = this.verifyPhone.bind(this);
    this.getProfile = this.getProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
  }

  // Send verification code to phone number
  async sendVerificationCode(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { phone } = req.body;

      // Generate a random 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Check if user exists
      let user = await User.findOne({ phone });

      if (user) {
        // Update existing user with new verification code
        user.verificationCode = verificationCode;
        user.verificationCodeExpires = verificationCodeExpires;
        await user.save();
      } else {
        // Create new user
        user = new User({
          phone,
          verificationCode,
          verificationCodeExpires,
          isPhoneVerified: false
        });
        await user.save();
      }

      // Send OTP via Kave Negar SMS service
      const smsSent = await this.smsService.sendOTP(phone, verificationCode);

      if (!smsSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to send verification code. Please try again.'
        });
        return;
      }

      console.log(`Verification code sent to ${phone}: ${verificationCode}`);

      res.json({
        success: true,
        message: 'Verification code sent successfully',
        data: {
          phone,
          // Only return code in development mode for testing
          verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
        }
      });
    } catch (error) {
      console.error('Send verification code error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Verify phone number with code
  async verifyPhone(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { phone, verificationCode } = req.body;

      // Find user by phone
      const user = await User.findOne({ phone });
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Check if verification code is valid and not expired
      if (!user.verificationCode ||
        user.verificationCode !== verificationCode ||
        !user.verificationCodeExpires ||
        user.verificationCodeExpires < new Date()) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired verification code'
        });
        return;
      }

      // Mark phone as verified
      user.isPhoneVerified = true;
      user.verificationCode = null as any;
      user.verificationCodeExpires = null as any;
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, phone: user.phone },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Phone verified successfully',
        data: {
          token,
          user: {
            id: user._id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            isPhoneVerified: user.isPhoneVerified,
            hasCompletedAdditionalInfo: user.hasCompletedAdditionalInfo,
            hasGeneratedPlan: user.hasGeneratedPlan
          }
        }
      });
    } catch (error) {
      console.error('Verify phone error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get current user profile
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.user.userId).select('-password -verificationCode -verificationCodeExpires');
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user profile
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { name, email } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { name, email },
        { new: true, runValidators: true }
      ).select('-password -verificationCode -verificationCodeExpires');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Refresh token
  async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const newToken = jwt.sign(
        { userId: user._id, phone: user.phone },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        data: { token: newToken }
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
