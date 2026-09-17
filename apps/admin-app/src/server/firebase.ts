// Firebase Admin SDK initialization
// NOTE: This file is disabled because firebase-admin types are not compatible with the current setup.
// The project uses Expo push notifications instead. Re-enable if Firebase Admin SDK is needed.

/*
import admin from 'firebase-admin';
import { supabaseAdmin } from './supabase';

let firebaseApp: admin.App | null = null;

export function getFirebaseApp(): admin.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const clientId = process.env.FIREBASE_CLIENT_ID;

  if (!projectId || !privateKey || !clientEmail || !clientId) {
    throw new Error('Missing Firebase credentials in environment variables');
  }

  // Parse the private key (it might be in JSON format or plain string)
  const parsedPrivateKey = privateKey.replace(/\\n/g, '\n');

  const serviceAccount = {
    project_id: projectId,
    private_key: parsedPrivateKey,
    client_email: clientEmail,
    client_id: clientId,
  };

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
  });

  return firebaseApp;
}

export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<admin.messaging.BatchResponse> {
  const app = getFirebaseApp();
  const messaging = admin.messaging(app);

  const message: admin.messaging.MulticastMessage = {
    notification: {
      title,
      body,
    },
    data,
    tokens,
  };

  try {
    const response = await messaging.sendMulticast(message);
    
    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          invalidTokens.push(tokens[idx]);
        }
      });
      
      if (invalidTokens.length > 0) {
        await cleanupInvalidTokens(invalidTokens);
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<admin.messaging.BatchResponse> {
  const tokens = await getUserFcmTokens(userId);
  
  if (tokens.length === 0) {
    console.log(`No FCM tokens found for user ${userId}`);
    return { successCount: 0, failureCount: 0, responses: [] };
  }

  return sendPushNotification(tokens, title, body, data);
}

// Helper function to get user's FCM tokens from database
async function getUserFcmTokens(userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('fcm_tokens')
    .select('token')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching FCM tokens:', error);
    return [];
  }

  return data?.map(row => row.token) || [];
}

// Helper functions for token management
export async function registerFcmToken(
  userId: string,
  token: string,
  deviceInfo?: Record<string, any>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('fcm_tokens')
    .upsert({
      user_id: userId,
      token,
      device_info: deviceInfo || {},
      is_active: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,token'
    });

  if (error) {
    console.error('Error registering FCM token:', error);
    throw error;
  }
}

export async function unregisterFcmToken(
  userId: string,
  token: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('fcm_tokens')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('token', token);

  if (error) {
    console.error('Error unregistering FCM token:', error);
    throw error;
  }
}

export async function cleanupInvalidTokens(invalidTokens: string[]): Promise<void> {
  if (invalidTokens.length === 0) return;

  const { error } = await supabaseAdmin
    .from('fcm_tokens')
    .update({ is_active: false })
    .in('token', invalidTokens);

  if (error) {
    console.error('Error cleaning up invalid tokens:', error);
  }
}

export async function subscribeToTopic(
  tokens: string[],
  topic: string
): Promise<void> {
  const app = getFirebaseApp();
  const messaging = admin.messaging(app);

  try {
    await messaging.subscribeToTopic(tokens, topic);
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    throw error;
  }
}

export async function unsubscribeFromTopic(
  tokens: string[],
  topic: string
): Promise<void> {
  const app = getFirebaseApp();
  const messaging = admin.messaging(app);

  try {
    await messaging.unsubscribeFromTopic(tokens, topic);
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    throw error;
  }
}
*/