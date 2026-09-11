import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/server/auth';
import { NotificationService } from '@/server/services';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await NotificationService.getUnreadCount(auth.userId);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
