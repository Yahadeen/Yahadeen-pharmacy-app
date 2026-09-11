import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabase';
import { getAuthContext, requireAdmin } from '@/server/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    requireAdmin(auth);

    const { data: deliveryFees, error } = await supabaseAdmin
      .from('delivery_fees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching delivery fees:', error);
      return NextResponse.json({ error: 'Failed to fetch delivery fees' }, { status: 500 });
    }

    return NextResponse.json(deliveryFees || []);
  } catch (error: any) {
    console.error('Error in GET /api/admin/delivery-fees:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    requireAdmin(auth);

    const body = await request.json();
    const { name, description, base_fee_naira, fee_per_km_naira, free_delivery_threshold_naira, city, state, is_active } = body;

    if (!name || !base_fee_naira || !fee_per_km_naira || !free_delivery_threshold_naira) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: deliveryFee, error } = await supabaseAdmin
      .from('delivery_fees')
      .insert({
        name,
        description,
        base_fee_naira,
        fee_per_km_naira,
        free_delivery_threshold_naira,
        city: city || null,
        state: state || null,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating delivery fee:', error);
      return NextResponse.json({ error: 'Failed to create delivery fee' }, { status: 500 });
    }

    return NextResponse.json(deliveryFee, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/delivery-fees:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
