import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/server/auth';
import { PushService } from '@/server/services/push.service';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokens = await PushService.getUserTokens(auth.userId);
    return NextResponse.json({
      tokens,
      has_active_token: tokens.length > 0,
    });
  } catch (error: any) {
    console.error('Push token status error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { token, platform, device_info } = body;

    if (!token || !platform) {
      return NextResponse.json({ error: 'Token and platform are required' }, { status: 400 });
    }

    if (!['ios', 'android', 'web', 'expo'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const pushToken = await PushService.registerToken(
      auth.userId,
      token,
      platform,
      device_info
    );

    return NextResponse.json({ token: pushToken }, { status: 201 });
  } catch (error: any) {
    console.error('Push token registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { token } = body;

    if (token) {
      await PushService.removeUserToken(auth.userId, token);
    } else {
      await PushService.removeUserTokens(auth.userId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Push token removal error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
