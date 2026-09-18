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
    }
    // Attendants and admins can see all orders for the queue
    // Admins might want to filter by status from the dashboard

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
    
    // For admin dashboard, return array directly
    // For customer/attendant apps, return paginated response
    if (auth.role === 'customer' || auth.role === 'attendant') {
      return NextResponse.json({
        items: orders.items,
        total: orders.total,
        page: orders.page,
        page_size: orders.page_size,
      });
    }
    
    return NextResponse.json(orders.items);
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
    
    // Build order input
    const orderInput = {
      customer_id: verifiedAuth.userId,
      items: body.items.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.qty || item.quantity,
      })),
      address_id: body.address_id,
      notes: body.note ?? body.notes,
      prescription_url: body.prescription_url,
    };

    const order = await OrderService.createOrder(orderInput, verifiedAuth);

    return NextResponse.json({ 
      order, 
      payment_url: null,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
