import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.warn('PAYSTACK_SECRET_KEY not set in environment variables');
}

if (!PAYSTACK_PUBLIC_KEY) {
  console.warn('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY not set in environment variables');
}

export interface InitializePaymentInput {
  amount_kobo: number;
  email: string;
  order_id: string;
  customer_id: string;
  metadata?: Record<string, any>;
}

export interface InitializePaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function initializePayment(
  input: InitializePaymentInput
): Promise<InitializePaymentResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key not configured');
  }

  const reference = `YD-${Date.now()}-${input.order_id.slice(0, 8)}`;
  
  const payload = {
    amount: input.amount_kobo,
    email: input.email,
    reference,
    metadata: {
      order_id: input.order_id,
      customer_id: input.customer_id,
      ...input.metadata,
    },
    // Use the dedicated callback URL environment variable
    callback_url: process.env.PAYSTACK_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
  };

  console.log('Initializing Paystack payment:', reference);

  // Retry logic for network errors
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        console.error('Paystack initialization failed:', data.message);
        throw new Error(data.message || 'Paystack initialization failed');
      }

      console.log('Paystack initialization successful:', data);
      return data;
    } catch (error: any) {
      console.error(`Paystack initialization attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw new Error(`Failed to initialize payment after ${maxRetries} attempts: ${error.message}`);
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }

  throw new Error('Failed to initialize payment');
}

export async function verifyTransaction(reference: string): Promise<any> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key not configured');
  }

  console.log('Verifying Paystack transaction:', reference);

  // Retry logic for network errors
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        console.error('Paystack verification failed:', data.message);
        throw new Error(data.message || 'Paystack verification failed');
      }

      console.log('Paystack verification successful:', data);
      return data;
    } catch (error: any) {
      console.error(`Paystack verification attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw new Error(`Failed to verify transaction after ${maxRetries} attempts: ${error.message}`);
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }

  throw new Error('Failed to verify transaction');
}

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!PAYSTACK_SECRET_KEY) {
    return false;
  }

  const hmac = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY);
  hmac.update(payload);
  const digest = hmac.digest('hex');

  return digest === signature;
}
