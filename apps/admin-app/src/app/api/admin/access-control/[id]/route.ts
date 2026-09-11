import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/server/auth';
import { supabaseAdmin } from '@/server/supabase';

function requireSuperAdmin(auth: any) {
  if (!auth || auth.role !== 'super_admin') {
    throw new Error('Forbidden: Super admin access required');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthContext(request);
    requireSuperAdmin(auth);

    const body = await request.json();
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('admin_access')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating admin access:', error);
      return NextResponse.json({ error: 'Failed to update admin access' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in PUT /api/admin/access-control/[id]:', error);
    if (error.message === 'Forbidden: Super admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthContext(request);
    requireSuperAdmin(auth);

    const { id } = params;

    const { error } = await supabaseAdmin
      .from('admin_access')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting admin access:', error);
      return NextResponse.json({ error: 'Failed to delete admin access' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/access-control/[id]:', error);
    if (error.message === 'Forbidden: Super admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
