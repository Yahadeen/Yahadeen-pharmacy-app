import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireStaff } from '@/server/auth';
import { OrderService } from '@/server/services';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const order = await OrderService.getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check access: customer can only see own orders, staff can see all
    if (auth.role === 'customer' && order.customer_id !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(request);
    const verifiedAuth = requireStaff(auth);

    const body = await request.json();
    const { id } = await params;
    const order = await OrderService.updateOrderStatus(id, body, verifiedAuth);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error updating order:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
