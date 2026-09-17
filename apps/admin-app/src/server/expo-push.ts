// Expo Push Notification Service
// This handles sending push notifications to Expo (React Native) apps

interface ExpoPushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  priority?: 'default' | 'normal' | 'high';
}

interface ExpoPushResponse {
  data: Array<{
    status: 'ok' | 'error';
    message?: string;
    details?: any;
  }>;
}

export async function sendExpoPushNotification(
  pushTokens: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<ExpoPushResponse> {
  const accessToken = process.env.EXPO_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('EXPO_ACCESS_TOKEN is not configured');
  }

  const message: ExpoPushMessage = {
    to: pushTokens,
    title,
    body,
    data,
    sound: 'default',
    priority: 'high',
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Expo API error: ${response.statusText}`);
    }

    const result: ExpoPushResponse = await response.json();
    
    // Handle invalid tokens
    const invalidTokens: string[] = [];
    result.data.forEach((item, index) => {
      if (item.status === 'error') {
        invalidTokens.push(pushTokens[index]);
      }
    });

    if (invalidTokens.length > 0) {
      console.warn('Invalid Expo push tokens:', invalidTokens);
      // You might want to clean these up from your database
    }

    return result;
  } catch (error) {
    console.error('Error sending Expo push notification:', error);
    throw error;
  }
}

export async function sendExpoPushNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<ExpoPushResponse> {
  const { supabaseAdmin } = await import('./supabase');
  
  // Get user's Expo push tokens from database
  const { data: tokens, error } = await supabaseAdmin
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching Expo push tokens:', error);
    throw error;
  }

  if (!tokens || tokens.length === 0) {
    console.log(`No Expo push tokens found for user ${userId}`);
    return { data: [] };
  }

  const pushTokens = tokens.map(t => t.token);
  return sendExpoPushNotification(pushTokens, title, body, data);
}

// Token management functions
export async function registerExpoPushToken(
  userId: string,
  token: string,
  deviceInfo?: Record<string, any>
): Promise<void> {
  const { supabaseAdmin } = await import('./supabase');
  
  const { error } = await supabaseAdmin
    .from('push_tokens')
    .upsert({
      user_id: userId,
      token,
      platform: 'expo',
      device_info: deviceInfo || {},
      is_active: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,token'
    });

  if (error) {
    console.error('Error registering Expo push token:', error);
    throw error;
  }
}

export async function unregisterExpoPushToken(
  userId: string,
  token: string
): Promise<void> {
  const { supabaseAdmin } = await import('./supabase');
  
  const { error } = await supabaseAdmin
    .from('push_tokens')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('token', token);

  if (error) {
    console.error('Error unregistering Expo push token:', error);
    throw error;
  }
}