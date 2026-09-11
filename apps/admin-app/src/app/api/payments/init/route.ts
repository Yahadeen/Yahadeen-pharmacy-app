import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireCustomer } from '@/server/auth';
import { PaymentService } from '@/server/services';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    const verifiedAuth = requireCustomer(auth);

    const body = await request.json();
    const result = await PaymentService.initPayment(body, verifiedAuth);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error initializing payment:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
