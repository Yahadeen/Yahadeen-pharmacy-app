import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireCustomer, requireStaff } from '@/server/auth';
import { OrderService } from '@/server/services';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters: any = {};

    if (auth.role === 'customer') {
      filters.customer_id = auth.userId;
    } else if (auth.role === 'attendant') {
      filters.attendant_id = auth.userId;
    }

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status');
    }

    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!);
    }

    if (searchParams.get('offset')) {
      filters.offset = parseInt(searchParams.get('offset')!);
    }

    const orders = await OrderService.getOrders(filters);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    const verifiedAuth = requireCustomer(auth);

    const body = await request.json();
    const order = await OrderService.createOrder(body, verifiedAuth);

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
