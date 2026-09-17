import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabase';
import { getAuthContext, requireAdmin } from '@/server/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(request);
    requireAdmin(auth);

    const body = await request.json();
    const { id } = await params;

    const { data: deliveryFee, error } = await supabaseAdmin
      .from('delivery_fees')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating delivery fee:', error);
      return NextResponse.json({ error: 'Failed to update delivery fee' }, { status: 500 });
    }

    return NextResponse.json(deliveryFee);
  } catch (error: any) {
    console.error('Error in PUT /api/admin/delivery-fees/[id]:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(request);
    requireAdmin(auth);

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('delivery_fees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting delivery fee:', error);
      return NextResponse.json({ error: 'Failed to delete delivery fee' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/delivery-fees/[id]:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
