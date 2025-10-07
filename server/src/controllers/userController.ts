import { Request, Response } from 'express';
import User from '../models/User';

interface ListQuery {
  page?: string;
  limit?: string;
  search?: string;
  isAdmin?: string;
  isPhoneVerified?: string;
  hasCompletedAdditionalInfo?: string;
  hasGeneratedPlan?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string; // e.g., "-createdAt" or "createdAt"
}

export class UserController {
  async list(req: Request<{}, {}, {}, ListQuery>, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        search,
        isAdmin,
        isPhoneVerified,
        hasCompletedAdditionalInfo,
        hasGeneratedPlan,
        dateFrom,
        dateTo,
        sort = '-createdAt',
      } = req.query;

      const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 20, 1), 100);

      const filter: any = {};

      if (search) {
        const s = String(search).trim();
        filter.$or = [
          { name: { $regex: s, $options: 'i' } },
          { phone: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
          { referralCode: { $regex: s, $options: 'i' } },
        ];
      }

      if (isAdmin === 'true' || isAdmin === 'false') filter.isAdmin = isAdmin === 'true';
      if (isPhoneVerified === 'true' || isPhoneVerified === 'false') filter.isPhoneVerified = isPhoneVerified === 'true';
      if (hasCompletedAdditionalInfo === 'true' || hasCompletedAdditionalInfo === 'false') filter.hasCompletedAdditionalInfo = hasCompletedAdditionalInfo === 'true';
      if (hasGeneratedPlan === 'true' || hasGeneratedPlan === 'false') filter.hasGeneratedPlan = hasGeneratedPlan === 'true';

      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(String(dateFrom));
        if (dateTo) filter.createdAt.$lte = new Date(String(dateTo));
      }

      const sortSpec: any = {};
      const fields = String(sort).split(',').map(s => s.trim()).filter(Boolean);
      for (const f of fields) {
        if (f.startsWith('-')) sortSpec[f.substring(1)] = -1; else sortSpec[f] = 1;
      }

      const [items, total] = await Promise.all([
        User.find(filter)
          .sort(sortSpec)
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .select('-password -verificationCode -verificationCodeExpires'),
        User.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          items,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('List users error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const user = await User.findById(id).select('-password -verificationCode -verificationCodeExpires');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.json({ success: true, data: { user } });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const allowed: any = {};
      const { name, email, isAdmin } = req.body || {};
      if (name !== undefined) allowed.name = name;
      if (email !== undefined) allowed.email = email;
      if (isAdmin !== undefined) allowed.isAdmin = !!isAdmin;

      const user = await User.findByIdAndUpdate(id, allowed, { new: true, runValidators: true })
        .select('-password -verificationCode -verificationCodeExpires');

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.json({ success: true, message: 'User updated', data: { user } });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      
      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Prevent deleting admin users for safety
      if (user.isAdmin) {
        res.status(403).json({ success: false, message: 'Cannot delete admin users' });
        return;
      }

      await User.findByIdAndDelete(id);

      console.log(`User deleted by admin: ${user.phone} (${user._id})`);

      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

export default new UserController();
