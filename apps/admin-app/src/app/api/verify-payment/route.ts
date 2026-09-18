import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabase';
import { verifyTransaction } from '@/server/paystack';
import { PushService } from '@/server/services/push.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Reference is required' },
        { status: 400 }
      );
    }

    // Verify the transaction with Paystack API (like WorkNow backend)
    const verification = await verifyTransaction(reference);

    if (!verification || !verification.data || verification.data.status !== 'success') {
      console.log('Paystack verification failed:', verification);
      return NextResponse.json(
        { success: false, error: 'Payment verification failed', verification },
        { status: 400 }
      );
    }

    console.log('Paystack verification successful:', verification.data);

    // Find the payment by reference
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('payment_reference', reference)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError);
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // If payment is already successful, return success (idempotent)
    if (payment.status === 'success') {
      console.log('Payment already verified');
      return NextResponse.json({ success: true, payment, already_verified: true });
    }

    // Update payment status with correct column names
    const { error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'success',
        paid_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update payment' },
        { status: 500 }
      );
    }

    console.log('Payment updated to success');

    // Update order status to paid
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .update({ 
        status: 'paid',
      })
      .eq('id', payment.order_id)
      .select('id, code, customer_id')
      .single();

    if (orderError) {
      console.error('Error updating order:', orderError);
    } else {
      console.log('Order updated to paid');
      try {
        await PushService.sendToUser(order.customer_id, {
          title: 'Payment Successful',
          body: `Payment for order #${order.code} was successful.`,
          data: {
            type: 'payment_successful',
            order_id: order.id,
            screen: 'order/[id]',
          },
        });

        await PushService.sendToRoles(['attendant', 'admin', 'super_admin'], {
          title: 'Order Paid',
          body: `Order #${order.code} has been paid and is ready for processing.`,
          data: {
            type: 'payment_successful',
            order_id: order.id,
            screen: 'order/[id]',
          },
        });
      } catch (pushError) {
        console.error('Failed to send payment push notification:', pushError);
      }
    }

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
