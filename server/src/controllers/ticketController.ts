import { Request, Response } from 'express';
import Ticket, { TicketStatus, TicketPriority, TicketCategory, ITicketMessage } from '../models/Ticket';
import User from '../models/User';
import mongoose from 'mongoose';
import notificationService from '../services/notificationService';
import errorLogger from '../services/errorLoggerService';

interface ListQuery {
  page?: string;
  limit?: string;
  status?: string;
  priority?: string;
  category?: string;
  userId?: string;
  search?: string;
  sort?: string;
}

export class TicketController {
  // Create a new ticket
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { subject, category, priority, message } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      // Validate required fields
      if (!subject || !message) {
        res.status(400).json({ success: false, message: 'Subject and message are required' });
        return;
      }

      // Get user details
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Create initial message
      const initialMessage: Partial<ITicketMessage> = {
        senderId: new mongoose.Types.ObjectId(userId),
        senderName: user.name || 'User',
        senderRole: 'user',
        message: String(message).trim(),
        createdAt: new Date(),
      };

      // Create ticket
      const ticket = await Ticket.create({
        userId: new mongoose.Types.ObjectId(userId),
        userName: user.name || 'User',
        userPhone: user.phone,
        subject: String(subject).trim(),
        category: category || TicketCategory.GENERAL,
        priority: priority || TicketPriority.MEDIUM,
        status: TicketStatus.OPEN,
        messages: [{ ...initialMessage, attachments: req.body.attachments || [] }],
        lastMessageAt: new Date(),
        lastMessageBy: 'user',
        userHasUnread: false,
        adminHasUnread: true,
      });

      res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        data: { ticket },
      });
    } catch (error) {
      errorLogger.error('Create ticket error', error as Error, req, { userId: (req as any).user?.userId });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // List tickets with filters (for admins)
  async list(req: Request<{}, {}, {}, ListQuery>, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        status,
        priority,
        category,
        userId,
        search,
        sort = '-lastMessageAt',
      } = req.query;

      const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 20, 1), 100);

      const filter: any = {};

      // Apply filters
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (category) filter.category = category;
      if (userId) filter.userId = userId;

      // Search functionality
      if (search) {
        const s = String(search).trim();
        filter.$or = [
          { subject: { $regex: s, $options: 'i' } },
          { userName: { $regex: s, $options: 'i' } },
          { userPhone: { $regex: s, $options: 'i' } },
        ];
      }

      // Sort specification
      const sortSpec: any = {};
      const fields = String(sort).split(',').map(s => s.trim()).filter(Boolean);
      for (const f of fields) {
        if (f.startsWith('-')) sortSpec[f.substring(1)] = -1;
        else sortSpec[f] = 1;
      }

      const [items, total] = await Promise.all([
        Ticket.find(filter)
          .sort(sortSpec)
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Ticket.countDocuments(filter),
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
      errorLogger.error('List tickets error', error as Error, req);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Get user's own tickets
  async getUserTickets(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { page = '1', limit = '20', status } = req.query;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 20, 1), 100);

      const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
      if (status) filter.status = status;

      const [items, total] = await Promise.all([
        Ticket.find(filter)
          .sort({ lastMessageAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Ticket.countDocuments(filter),
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
      errorLogger.error('Get user tickets error', error as Error, req, { userId: (req as any).user?.userId });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Get ticket by ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const isAdmin = (req as any).user?.isAdmin;

      const ticket = await Ticket.findById(id);
      if (!ticket) {
        res.status(404).json({ success: false, message: 'Ticket not found' });
        return;
      }

      // Check if user has access to this ticket
      if (!isAdmin && ticket.userId.toString() !== userId) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      // Mark as read for the viewer
      if (isAdmin && ticket.adminHasUnread) {
        ticket.adminHasUnread = false;
        await ticket.save();
      } else if (!isAdmin && ticket.userHasUnread) {
        ticket.userHasUnread = false;
        await ticket.save();
      }

      res.json({ success: true, data: { ticket } });
    } catch (error) {
      errorLogger.error('Get ticket error', error as Error, req, { ticketId: req.params.id });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Add message to ticket
  async addMessage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const userId = (req as any).user?.userId;
      const isAdmin = (req as any).user?.isAdmin;

      if (!message || !String(message).trim()) {
        res.status(400).json({ success: false, message: 'Message is required' });
        return;
      }

      const ticket = await Ticket.findById(id);
      if (!ticket) {
        res.status(404).json({ success: false, message: 'Ticket not found' });
        return;
      }

      // Check if user has access to this ticket
      if (!isAdmin && ticket.userId.toString() !== userId) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      // Get sender details
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Create new message
      const newMessage: Partial<ITicketMessage> = {
        senderId: new mongoose.Types.ObjectId(userId),
        senderName: user.name || (isAdmin ? 'Admin' : 'User'),
        senderRole: isAdmin ? 'admin' : 'user',
        message: String(message).trim(),
        attachments: req.body.attachments || [],
        createdAt: new Date(),
      };

      // Add message to ticket
      ticket.messages.push(newMessage as ITicketMessage);
      ticket.lastMessageAt = new Date();
      ticket.lastMessageBy = isAdmin ? 'admin' : 'user';

      // Mark as unread for the recipient
      if (isAdmin) {
        ticket.userHasUnread = true;
        ticket.adminHasUnread = false;

        // Send notification to user
        try {
          await notificationService.notifyTicketReply(
            ticket.userId,
            String(ticket._id),
            ticket.subject,
            user.name || 'Support Team'
          );
        } catch (notifError) {
          errorLogger.warning('Error sending notification', notifError as Error, req, { ticketId: String(ticket._id) });
          // Don't fail the request if notification fails
        }
      } else {
        ticket.userHasUnread = false;
        ticket.adminHasUnread = true;
      }

      // If admin replies, mark as in progress
      if (isAdmin && ticket.status === TicketStatus.OPEN) {
        ticket.status = TicketStatus.IN_PROGRESS;
      }

      await ticket.save();

      res.json({
        success: true,
        message: 'Message added successfully',
        data: { ticket },
      });
    } catch (error) {
      errorLogger.error('Add message error', error as Error, req, { ticketId: req.params.id });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Update ticket status (admin only)
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, assignedTo } = req.body;

      if (!status || !Object.values(TicketStatus).includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid status' });
        return;
      }

      const updateData: any = { status };

      // Update resolved/closed timestamps
      if (status === TicketStatus.RESOLVED && !updateData.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
      if (status === TicketStatus.CLOSED && !updateData.closedAt) {
        updateData.closedAt = new Date();
      }

      // Handle assignment
      if (assignedTo) {
        const admin = await User.findById(assignedTo);
        if (admin && admin.isAdmin) {
          updateData.assignedTo = assignedTo;
          updateData.assignedToName = admin.name || 'Admin';
        }
      }

      const ticket = await Ticket.findByIdAndUpdate(id, updateData, { new: true });

      if (!ticket) {
        res.status(404).json({ success: false, message: 'Ticket not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Ticket updated successfully',
        data: { ticket },
      });
    } catch (error) {
      errorLogger.error('Update ticket error', error as Error, req, { ticketId: req.params.id });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Update ticket priority (admin only)
  async updatePriority(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { priority } = req.body;

      if (!priority || !Object.values(TicketPriority).includes(priority)) {
        res.status(400).json({ success: false, message: 'Invalid priority' });
        return;
      }

      const ticket = await Ticket.findByIdAndUpdate(
        id,
        { priority },
        { new: true }
      );

      if (!ticket) {
        res.status(404).json({ success: false, message: 'Ticket not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Priority updated successfully',
        data: { ticket },
      });
    } catch (error) {
      errorLogger.error('Update priority error', error as Error, req, { ticketId: req.params.id });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Get ticket statistics (admin only)
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const [
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        urgentTickets,
        highPriorityTickets,
        categoryStats,
      ] = await Promise.all([
        Ticket.countDocuments(),
        Ticket.countDocuments({ status: TicketStatus.OPEN }),
        Ticket.countDocuments({ status: TicketStatus.IN_PROGRESS }),
        Ticket.countDocuments({ status: TicketStatus.RESOLVED }),
        Ticket.countDocuments({ status: TicketStatus.CLOSED }),
        Ticket.countDocuments({ priority: TicketPriority.URGENT }),
        Ticket.countDocuments({ priority: TicketPriority.HIGH }),
        Ticket.aggregate([
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

      res.json({
        success: true,
        data: {
          totalTickets,
          statusBreakdown: {
            open: openTickets,
            inProgress: inProgressTickets,
            resolved: resolvedTickets,
            closed: closedTickets,
          },
          priorityBreakdown: {
            urgent: urgentTickets,
            high: highPriorityTickets,
          },
          categoryBreakdown: categoryStats.reduce((acc: any, item: any) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
        },
      });
    } catch (error) {
      errorLogger.error('Get statistics error', error as Error, req);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Get unread count for admin
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await Ticket.countDocuments({ adminHasUnread: true });
      res.json({ success: true, data: { count } });
    } catch (error) {
      errorLogger.error('Get unread count error', error as Error, req);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Delete ticket (admin only)
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const ticket = await Ticket.findByIdAndDelete(id);
      if (!ticket) {
        res.status(404).json({ success: false, message: 'Ticket not found' });
        return;
      }

      res.json({ success: true, message: 'Ticket deleted successfully' });
    } catch (error) {
      errorLogger.error('Delete ticket error', error as Error, req, { ticketId: req.params.id });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Upload image
  async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No image uploaded' });
        return;
      }

      const host = req.get('host');
      const protocol = req.protocol;
      const baseUrl = `${protocol}://${host}`;
      const imageUrl = `${baseUrl}/api/tickets/images/${req.file.filename}`;

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: { url: imageUrl },
      });
    } catch (error) {
      errorLogger.error('Upload ticket image error', error as Error, req);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

export default new TicketController();
