import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction } from '@/server/paystack';
import { supabaseAdmin } from '@/server/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'No reference provided' }, { status: 400 });
    }

    // Auto-verify the payment with Paystack API (like WorkNow backend)
    try {
      const verification = await verifyTransaction(reference);

      if (!verification.data || verification.data.status !== 'success') {
        console.log('Paystack verification failed:', verification);
      } else {
        console.log('Paystack verification successful:', reference);
        
        const metadata = verification.data.metadata;
        const orderId = metadata?.order_id;

        if (orderId) {
          // Find existing payment record
          const { data: existingPayment } = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('payment_reference', reference)
            .single();

          if (existingPayment) {
            // Update existing payment record to success (idempotent)
            if (existingPayment.status !== 'success') {
              const { error: updateError } = await supabaseAdmin
                .from('payments')
                .update({
                  status: 'success',
                  paid_at: new Date().toISOString(),
                })
                .eq('id', existingPayment.id);

              if (updateError) {
                console.error('Error updating payment status:', updateError);
              } else {
                console.log('Payment status updated to success');
              }
            } else {
              console.log('Payment already verified, skipping update');
            }
          } else {
            // Create payment record if it doesn't exist
            const { error: paymentError } = await supabaseAdmin
              .from('payments')
              .insert({
                order_id: orderId,
                amount_kobo: verification.data.amount,
                payment_method: 'paystack',
                payment_reference: reference,
                status: 'success',
                paid_at: new Date().toISOString(),
              });

            if (paymentError) {
              console.error('Error creating payment record:', paymentError);
            } else {
              console.log('Payment record created');
            }
          }

          // Update order status to paid (idempotent)
          const { data: order } = await supabaseAdmin
            .from('orders')
            .select('status')
            .eq('id', orderId)
            .single();

          if (order && order.status !== 'paid') {
            const { error: orderError } = await supabaseAdmin
              .from('orders')
              .update({
                status: 'paid',
              })
              .eq('id', orderId);

            if (orderError) {
              console.error('Error updating order status:', orderError);
            } else {
              console.log('Order status updated to paid');
            }
          } else if (order && order.status === 'paid') {
            console.log('Order already paid, skipping update');
          }
        }
      }
    } catch (error) {
      console.error('Payment verification error in callback:', error);
    }
    
    // Return HTML that tells the WebView to close and navigate back to orders
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Complete</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 20px;
          }
          .checkmark {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            animation: scaleIn 0.3s ease-out;
          }
          .checkmark svg {
            width: 50px;
            height: 50px;
            stroke: #6366f1;
          }
          @keyframes scaleIn {
            0% { transform: scale(0); }
            100% { transform: scale(1); }
          }
          h1 { margin: 0 0 10px; font-size: 24px; }
          p { margin: 0; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="checkmark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1>Payment Successful!</h1>
          <p>You can now close this window</p>
        </div>
        <script>
          // Tell React Native WebView that payment is complete
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage('PAYMENT_SUCCESS:${reference}');
          }
          
          // Auto-close after 2 seconds
          setTimeout(function() {
            window.close();
          }, 2000);
        </script>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
