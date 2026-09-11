import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/server/auth';
import { NotificationService } from '@/server/services';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await NotificationService.markAllAsRead(auth.userId, auth);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
