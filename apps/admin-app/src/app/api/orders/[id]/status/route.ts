import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/server/auth';
import { OrderService } from '@/server/services';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const { id } = await params;
    const updatedOrder = await OrderService.updateOrderStatus(
      id,
      { status, attendant_id: auth.userId },
      auth
    );

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
