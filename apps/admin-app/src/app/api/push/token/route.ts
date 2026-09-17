import { NextRequest, NextResponse } from 'next/server';
import { registerExpoPushToken, unregisterExpoPushToken } from '@/server/expo-push';
import { getAuthContext } from '@/server/auth';

// Register Expo push token
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { token, deviceInfo } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    await registerExpoPushToken(auth.userId, token, deviceInfo);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error registering Expo push token:', error);
    return NextResponse.json(
      { error: 'Failed to register token' },
      { status: 500 }
    );
  }
}

// Unregister Expo push token
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    await unregisterExpoPushToken(auth.userId, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unregistering Expo push token:', error);
    return NextResponse.json(
      { error: 'Failed to unregister token' },
      { status: 500 }
    );
  }
}