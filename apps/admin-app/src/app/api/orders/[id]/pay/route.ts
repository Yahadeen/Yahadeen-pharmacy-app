import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireCustomer } from '@/server/auth';
import { initializePayment } from '@/server/paystack';
import { supabaseAdmin } from '@/server/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(request);
    const verifiedAuth = requireCustomer(auth);

    const { id } = await params;

    // Fetch the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if the order belongs to the customer
    if (order.customer_id !== verifiedAuth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if order is already paid
    if (order.status === 'paid' || order.status === 'confirmed' || order.status === 'packed' || order.status === 'dispatched' || order.status === 'delivered') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 400 });
    }

    // Check if there's already a pending payment for this order
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('order_id', id)
      .eq('status', 'pending')
      .single();

    let paymentUrl: string;
    let reference: string;

    if (existingPayment) {
      // Use the existing payment reference directly
      reference = existingPayment.payment_reference;
      
      // Generate a new payment URL with the same reference for retry
      const paymentData = await initializePayment({
        amount_kobo: order.total_kobo,
        email: verifiedAuth.email || 'customer@example.com',
        order_id: order.id,
        customer_id: verifiedAuth.userId,
        metadata: { 
          retry: true, 
          original_reference: existingPayment.payment_reference 
        },
      });
      paymentUrl = paymentData.data.authorization_url;
      
      // Update the existing payment record with the new reference
      const { error: updateError } = await supabaseAdmin
        .from('payments')
        .update({ payment_reference: paymentData.data.reference })
        .eq('id', existingPayment.id);
      
      if (updateError) {
        console.error('Error updating payment reference:', updateError);
      }
      
      // Use the new reference from Paystack
      reference = paymentData.data.reference;
    } else {
      // Initialize payment with Paystack
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
        return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      payment_url: paymentUrl,
      reference
    });
  } catch (error: any) {
    console.error('Error initializing payment:', error);
    return NextResponse.json({ error: error.message || 'Failed to initialize payment' }, { status: 500 });
  }
}
