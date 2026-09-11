import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireCustomer } from '@/server/auth';
import { AddressService } from '@/server/services';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await AddressService.getAddresses(auth.userId);

    return NextResponse.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    const verifiedAuth = requireCustomer(auth);

    const body = await request.json();
    const address = await AddressService.createAddress(
      { ...body, user_id: verifiedAuth.userId },
      verifiedAuth
    );

    return NextResponse.json(address, { status: 201 });
  } catch (error: any) {
    console.error('Error creating address:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
