import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireCustomer } from '@/server/auth';
import { supabaseAdmin } from '@/server/supabase';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const order_id = searchParams.get('order_id');

    let query = supabaseAdmin
      .from('support_tickets')
      .select(`
        *,
        orders:order_id (
          code,
          total_kobo,
          status
        ),
        messages:support_messages (
          id,
          message,
          sender_id,
          sender_role,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by user role (only for customer/attendant)
    if (auth.role === 'customer') {
      const verifiedAuth = requireCustomer(auth);
      query = query.eq('customer_id', verifiedAuth.userId);
    }
    // Attendants and admins see all tickets (no filter)

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (order_id) {
      query = query.eq('order_id', order_id);
    }

    const { data: tickets, error } = await query;

    if (error) {
      console.error('Error fetching support tickets:', error);
      return NextResponse.json({ error: 'Failed to fetch support tickets' }, { status: 500 });
    }

    return NextResponse.json({ tickets: tickets || [] });
  } catch (error: any) {
    console.error('Support tickets error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    const verifiedAuth = requireCustomer(auth);

    const body = await request.json();
    const { order_id, subject, category, description, priority } = body;

    if (!order_id || !subject) {
      return NextResponse.json({ error: 'Order ID and subject are required' }, { status: 400 });
    }

    // Verify the order belongs to the customer
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_id')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.customer_id !== verifiedAuth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create support ticket
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        order_id,
        customer_id: verifiedAuth.userId,
        subject,
        category: category || 'order_issue',
        description,
        priority: priority || 'medium',
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Error creating support ticket:', ticketError);
      return NextResponse.json({ error: 'Failed to create support ticket' }, { status: 500 });
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error: any) {
    console.error('Support ticket creation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
