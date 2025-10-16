export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketCategory {
  TECHNICAL = 'technical',
  BILLING = 'billing',
  FEATURE_REQUEST = 'feature_request',
  BUG_REPORT = 'bug_report',
  GENERAL = 'general',
  OTHER = 'other',
}

export interface TicketMessage {
  _id?: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  message: string;
  attachments?: string[];
  createdAt: string;
}

export interface Ticket {
  _id: string;
  userId: string;
  userName: string;
  userPhone: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  messages: TicketMessage[];
  assignedTo?: string;
  assignedToName?: string;
  lastMessageAt: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketStatistics {
  totalTickets: number;
  statusBreakdown: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  priorityBreakdown: {
    urgent: number;
    high: number;
  };
  categoryBreakdown: Record<string, number>;
}

export interface PaginatedTickets {
  success: boolean;
  data: {
    items: Ticket[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
