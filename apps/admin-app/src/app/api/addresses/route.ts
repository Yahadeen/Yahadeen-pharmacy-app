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
    
    // Validate required fields
    if (!body.full_name || !body.address_line1 || !body.city || !body.state) {
      return NextResponse.json({ 
        error: 'Missing required fields: full_name, address_line1, city, and state are required' 
      }, { status: 400 });
    }

    const addressInput = {
      user_id: verifiedAuth.userId,
      full_name: body.full_name,
      phone: body.phone,
      address_line1: body.address_line1,
      address_line2: body.address_line2,
      city: body.city,
      state: body.state,
      postal_code: body.postal_code,
      country: body.country || 'Nigeria',
      is_default: body.is_default || false
    };

    const address = await AddressService.createAddress(addressInput, verifiedAuth);

    return NextResponse.json(address, { status: 201 });
  } catch (error: any) {
    console.error('Error creating address:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
