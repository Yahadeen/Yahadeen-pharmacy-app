import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/server/auth';
import { supabaseAdmin } from '@/server/supabase';

function requireAdmin(auth: any) {
  if (!auth || (auth.role !== 'admin' && auth.role !== 'super_admin')) {
    throw new Error('Forbidden: Admin access required');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(request);
    requireAdmin(auth);

    const { id } = await params;

    // Fetch the payment details
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if payment is pending and has a reference
    if (payment.status !== 'pending' || !payment.payment_reference) {
      return NextResponse.json({ error: 'Payment is not pending or has no reference' }, { status: 400 });
    }

    // Get Paystack secret key from environment variables
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json({ error: 'Paystack not configured' }, { status: 500 });
    }

    // Verify transaction with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${payment.payment_reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok) {
      console.error('Paystack verification error:', verifyData);
      return NextResponse.json({ error: 'Failed to verify with Paystack' }, { status: 500 });
    }

    if (verifyData.status) {
      const transaction = verifyData.data;
      const paystackStatus = transaction.status; // success, failed, abandoned

      // Update payment status based on Paystack	response
      let newStatus = 'pending';
      if (paystackStatus === 'success') {
        newStatus = 'completed';
      } else if (paystackStatus === 'failed') {
        newStatus = 'failed';
      }

      const { error: updateError } = await supabaseAdmin
        .from('payments')
        .update({
          status: newStatus,
          paid_at: paystackStatus === 'success' ? transaction.paid_at : null,
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating payment status:', updateError);
        return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        status: newStatus,
        paystackStatus,
        message: `Payment status updated to ${newStatus}`,
      });
    } else {
      return NextResponse.json({ error: 'Paystack verification failed' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in POST /api/admin/payments/[id]/verify:', error);
    if (error.message === 'Forbidden: Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
