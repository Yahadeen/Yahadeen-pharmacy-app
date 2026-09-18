import { supabaseAdmin } from '../supabase';

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web' | 'expo';
  device_info?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PushNotificationPayload {
  to: string | string[]; // push token(s) or user id(s)
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  priority?: 'default' | 'high';
}

export class PushService {
  /**
   * Register a push token for a user
   */
  static async registerToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web' | 'expo',
    deviceInfo?: any
  ): Promise<PushToken> {
    await supabaseAdmin
      .from('push_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('token', token)
      .neq('user_id', userId);

    const { data, error } = await supabaseAdmin
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token,
        platform,
        device_info: deviceInfo || {},
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,token' })
      .select()
      .single();

    if (error) throw new Error(`Failed to register push token: ${error.message}`);
    return data;
  }

  /**
   * Remove/disable a push token
   */
  static async removeToken(token: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('push_tokens')
      .update({ is_active: false })
      .eq('token', token);

    if (error) throw new Error(`Failed to remove push token: ${error.message}`);
  }

  static async removeUserToken(userId: string, token: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('push_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('token', token);

    if (error) throw new Error(`Failed to remove push token: ${error.message}`);
  }

  static async removeUserTokens(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('push_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to remove push tokens: ${error.message}`);
  }

  /**
   * Get all active push tokens for a user
   */
  static async getUserTokens(userId: string): Promise<PushToken[]> {
    const { data, error } = await supabaseAdmin
      .from('push_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw new Error(`Failed to fetch user tokens: ${error.message}`);
    return data || [];
  }

  /**
   * Send a push notification to specific users
   */
  static async sendToUsers(
    userIds: string[],
    payload: Omit<PushNotificationPayload, 'to'>
  ): Promise<{ success: number; failed: number }> {
    // Get all tokens for these users
    const { data: tokens } = await supabaseAdmin
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds)
      .eq('is_active', true);

    if (!tokens || tokens.length === 0) {
      return { success: 0, failed: 0 };
    }

    const tokenList = tokens.map(t => t.token);
    return this.sendToTokens(tokenList, payload);
  }

  /**
   * Send a push notification to specific tokens
   */
  static async sendToTokens(
    tokens: string[],
    payload: Omit<PushNotificationPayload, 'to'>
  ): Promise<{ success: number; failed: number }> {
    if (!process.env.EXPO_ACCESS_TOKEN) {
      console.warn('Push notifications not configured: Missing EXPO_ACCESS_TOKEN');
      return { success: 0, failed: tokens.length };
    }

    if (!tokens || tokens.length === 0) {
      return { success: 0, failed: 0 };
    }

    try {
      let success = 0;
      let failed = 0;
      const uniqueTokens = [...new Set(tokens)];

      for (let i = 0; i < uniqueTokens.length; i += 100) {
        const chunk = uniqueTokens.slice(i, i + 100);
        const messages = chunk.map((to) => ({
          to,
          sound: payload.sound || 'default',
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          priority: payload.priority || 'high',
        }));

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_ACCESS_TOKEN}`,
          },
          body: JSON.stringify(messages),
        });

        const result = await response.json();

        if (Array.isArray(result.data)) {
          result.data.forEach((item: any, index: number) => {
            if (item.status === 'ok') {
              success++;
            } else {
              failed++;
              console.error('Push notification failed:', { token: chunk[index], result: item });
            }
          });
        } else if (result.status === 'ok') {
          success += chunk.length;
        } else {
          failed += chunk.length;
          console.error('Push notification failed:', result);
        }
      }

      return { success, failed };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: 0, failed: tokens.length };
    }
  }

  /**
   * Send a push notification to a single user
   */
  static async sendToUser(
    userId: string,
    payload: Omit<PushNotificationPayload, 'to'>
  ): Promise<{ success: number; failed: number }> {
    return this.sendToUsers([userId], payload);
  }

  static async getActiveUserIdsByRoles(
    roles: Array<'customer' | 'attendant' | 'admin' | 'super_admin'>
  ): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .in('role', roles)
      .eq('is_active', true);

    if (error) throw new Error(`Failed to fetch users for push: ${error.message}`);
    return [...new Set((data || []).map((user) => user.id))];
  }

  static async sendToRoles(
    roles: Array<'customer' | 'attendant' | 'admin' | 'super_admin'>,
    payload: Omit<PushNotificationPayload, 'to'>
  ): Promise<{ success: number; failed: number }> {
    const userIds = await this.getActiveUserIdsByRoles(roles);
    return this.sendToUsers(userIds, payload);
  }
}
