// Support system types and utilities

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SupportTicketCategory = 'order_issue' | 'payment_issue' | 'delivery_issue' | 'product_issue' | 'other';
export type MessageSenderRole = 'customer' | 'attendant' | 'admin';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  order_id: string;
  customer_id: string;
  attendant_id: string | null;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  subject: string;
  category: SupportTicketCategory;
  description: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  orders?: {
    id: string;
    code: string;
    total_kobo: number;
    status: string;
  };
  customer?: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
  };
  attendant?: {
    id: string;
    full_name: string | null;
  };
  messages?: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: MessageSenderRole;
  message: string;
  attachment_url: string | null;
  is_internal: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string | null;
    role: string;
  };
}

export interface CreateSupportTicketInput {
  order_id: string;
  subject: string;
  category?: SupportTicketCategory;
  description?: string;
  priority?: SupportTicketPriority;
}

export interface CreateSupportMessageInput {
  message: string;
  attachment_url?: string;
  is_internal?: boolean;
}

export const SUPPORT_TICKET_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const SUPPORT_TICKET_PRIORITY_LABELS: Record<SupportTicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const SUPPORT_TICKET_CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  order_issue: 'Order Issue',
  payment_issue: 'Payment Issue',
  delivery_issue: 'Delivery Issue',
  product_issue: 'Product Issue',
  other: 'Other',
};

export const SUPPORT_TICKET_STATUS_COLORS: Record<SupportTicketStatus, string> = {
  open: '#6366f1', // indigo
  in_progress: '#f59e0b', // amber
  resolved: '#10b981', // emerald
  closed: '#6b7280', // gray
};

export const SUPPORT_TICKET_PRIORITY_COLORS: Record<SupportTicketPriority, string> = {
  low: '#10b981', // emerald
  medium: '#f59e0b', // amber
  high: '#ef4444', // red
  urgent: '#dc2626', // dark red
};

export const SENDER_ROLE_LABELS: Record<MessageSenderRole, string> = {
  customer: 'Customer',
  attendant: 'Attendant',
  admin: 'Support Admin',
};
