import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireCustomer, requireStaff } from '@/server/auth';
import { OrderService } from '@/server/services';
import { supabaseAdmin } from '@/server/supabase';

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
      notes: body.notes,
      prescription_url: body.prescription_url,
    };

    const order = await OrderService.createOrder(orderInput, verifiedAuth);

    // Initialize payment with Paystack
    let paymentUrl = null;
    let reference = null;
    try {
      const { initializePayment } = await import('@/server/paystack');
      const paymentData = await initializePayment({
        amount_kobo: order.total_kobo,
        email: verifiedAuth.email || 'customer@example.com',
        order_id: order.id,
        customer_id: verifiedAuth.userId,
      });
      paymentUrl = paymentData.data.authorization_url;
      reference = paymentData.data.reference;

      // Create payment record in database
      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          order_id: order.id,
          amount_kobo: order.total_kobo,
          payment_method: 'paystack',
          payment_reference: reference,
          status: 'pending',
        });

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        // Continue without payment record if it fails
      }
    } catch (paymentError) {
      console.error('Error initializing payment:', paymentError);
      // Continue without payment URL if it fails
    }

    return NextResponse.json({ 
      order, 
      payment_url: paymentUrl 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
