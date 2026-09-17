import { supabaseAdmin } from '../supabase';
import { AuthContext } from '../auth';
import { sendExpoPushNotificationToUser } from '../expo-push';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface CreateNotificationInput {
  user_id: string;
  type: string;
  priority?: string;
  title: string;
  message: string;
  data?: any;
  sendPush?: boolean; // Whether to send push notification
}

export class NotificationService {
  static async getNotifications(
    userId: string,
    filters?: {
      unread_only?: boolean;
      limit?: number;
    }
  ): Promise<Notification[]> {
    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.unread_only) {
      query = query.eq('is_read', false);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return data;
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Failed to fetch unread count: ${error.message}`);
    }

    return count || 0;
  }

  static async createNotification(input: CreateNotificationInput): Promise<Notification> {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        ...input,
        priority: input.priority || 'medium',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    // Send push notification if requested
    if (input.sendPush !== false) {
      try {
        await sendExpoPushNotificationToUser(
          input.user_id,
          input.title,
          input.message,
          input.data
        );
      } catch (pushError) {
        console.error('Failed to send push notification:', pushError);
        // Don't throw error - notification was still created in database
      }
    }

    return data;
  }

  static async markAsRead(notificationId: string, auth: AuthContext): Promise<Notification> {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    return data;
  }

  static async markAllAsRead(userId: string, auth: AuthContext): Promise<void> {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  static async deleteNotification(notificationId: string, auth: AuthContext): Promise<void> {
    const { data: notification } = await supabaseAdmin
      .from('notifications')
      .select('user_id')
      .eq('id', notificationId)
      .single();

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (auth.userId !== notification.user_id && auth.role !== 'admin') {
      throw new Error('Forbidden');
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  static async broadcastNotification(
    userIds: string[],
    type: string,
    title: string,
    message: string,
    data?: any,
    priority: string = 'medium',
    sendPush: boolean = true
  ): Promise<void> {
    const notifications = userIds.map((user_id) => ({
      user_id,
      type,
      priority,
      title,
      message,
      data,
    }));

    const { error } = await supabaseAdmin
      .from('notifications')
      .insert(notifications);

    if (error) {
      throw new Error(`Failed to broadcast notifications: ${error.message}`);
    }

    // Send push notifications to all users
    if (sendPush) {
      for (const userId of userIds) {
        try {
          await sendExpoPushNotificationToUser(userId, title, message, data);
        } catch (pushError) {
          console.error(`Failed to send push notification to user ${userId}:`, pushError);
        }
      }
    }
  }
}
