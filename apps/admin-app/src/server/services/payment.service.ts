import { supabaseAdmin } from '../supabase';
import { AuthContext } from '../auth';
import crypto from 'crypto';

export interface Payment {
  id: string;
  order_id: string;
  provider: string;
  provider_ref?: string;
  status: string;
  amount_kobo: number;
  raw?: any;
  created_at: string;
  updated_at: string;
  verified_at?: string;
}

export interface InitPaymentInput {
  order_id: string;
  amount_kobo: number;
  email: string;
}

export class PaymentService {
  private static PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
  private static PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY!;

  /**
   * Initialize a payment transaction with Paystack
   */
  static async initPayment(input: InitPaymentInput, auth: AuthContext): Promise<{
    authorization_url: string;
    reference: string;
  }> {
    // Get order details
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, profiles(email)')
      .eq('id', input.order_id)
      .single();

    if (error || !order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'pending_payment') {
      throw new Error('Order is not pending payment');
    }

    // Call Paystack API
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: input.amount_kobo,
        email: input.email || order.profiles.email,
        reference: `PG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          order_id: input.order_id,
          custom_fields: [
            {
              display_name: 'Order Code',
              variable_name: 'order_code',
              value: order.code,
            },
          ],
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
      }),
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || 'Failed to initialize payment');
    }

    // Create payment record
    await supabaseAdmin.from('payments').insert({
      order_id: input.order_id,
      provider: 'paystack',
      provider_ref: data.data.reference,
      status: 'pending',
      amount_kobo: input.amount_kobo,
      raw: data.data,
    });

    return {
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    };
  }

  /**
   * Verify Paystack webhook signature
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string
  ): boolean {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Process Paystack webhook
   */
  static async processWebhook(event: any): Promise<void> {
    const { event: eventType, data } = event;

    if (eventType === 'charge.success') {
      await this.handleSuccessfulPayment(data);
    } else if (eventType === 'charge.failed') {
      await this.handleFailedPayment(data);
    }
  }

  /**
   * Handle successful payment
   */
  private static async handleSuccessfulPayment(paystackData: any): Promise<void> {
    const reference = paystackData.reference;
    const amount = paystackData.amount; // in kobo

    // Find payment by reference
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('provider_ref', reference)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found for reference:', reference);
      return;
    }

    if (payment.status === 'success') {
      return; // Already processed
    }

    // Update payment status
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'success',
        verified_at: new Date().toISOString(),
        raw: paystackData,
      })
      .eq('id', payment.id);

    // Update order status
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', payment.order_id);

    // Decrement stock
    await this.decrementStock(payment.order_id);
  }

  /**
   * Handle failed payment
   */
  private static async handleFailedPayment(paystackData: any): Promise<void> {
    const reference = paystackData.reference;

    await supabaseAdmin
      .from('payments')
      .update({
        status: 'failed',
        raw: paystackData,
      })
      .eq('provider_ref', reference);

    // Update order status
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('order_id')
      .eq('provider_ref', reference)
      .single();

    if (payment) {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'payment_failed' })
        .eq('id', payment.order_id);
    }
  }

  /**
   * Decrement stock for order items
   */
  private static async decrementStock(orderId: string): Promise<void> {
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('product_id, qty')
      .eq('order_id', orderId);

    if (!items) return;

    for (const item of items) {
      await supabaseAdmin.rpc('decrement_stock', {
        product_id: item.product_id,
        amount: item.qty,
      });
    }
  }

  /**
   * Get payment by order ID
   */
  static async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }

    return data;
  }
}
