import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/server/auth';
import { OrderService } from '@/server/services';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 });
    }

    const { id } = await params;
    const order = await OrderService.cancelOrder(id, reason, auth);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
