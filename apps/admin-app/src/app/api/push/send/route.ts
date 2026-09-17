import { NextRequest, NextResponse } from 'next/server';
import { sendExpoPushNotificationToUser } from '@/server/expo-push';
import { getAuthContext, requireAdmin } from '@/server/auth';

// Send push notification to a user
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    requireAdmin(auth);
    
    const requestBody = await request.json();
    const { userId, title, body: messageBody, data } = requestBody;

    if (!userId || !title || !messageBody) {
      return NextResponse.json(
        { error: 'userId, title, and body are required' },
        { status: 400 }
      );
    }

    const result = await sendExpoPushNotificationToUser(userId, title, messageBody, data);

    return NextResponse.json({ 
      success: true,
      result 
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json(
      { error: 'Failed to send push notification' },
      { status: 500 }
    );
  }
}