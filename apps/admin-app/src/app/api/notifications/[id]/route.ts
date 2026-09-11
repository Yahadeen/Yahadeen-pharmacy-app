import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/server/auth';
import { NotificationService } from '@/server/services';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { is_read } = body;

    if (typeof is_read !== 'boolean') {
      return NextResponse.json({ error: 'Invalid is_read value' }, { status: 400 });
    }

    if (is_read) {
      await NotificationService.markAsRead(params.id, auth);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating notification:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await NotificationService.deleteNotification(params.id, auth);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
