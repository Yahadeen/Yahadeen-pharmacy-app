import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireSuperAdmin } from '@/server/auth';
import { supabaseAdmin } from '@/server/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthContext(request);
    requireSuperAdmin(auth);

    const { is_active } = await request.json();
    const adminId = params.id;

    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_active })
      .eq('id', adminId)
      .in('role', ['admin', 'super_admin']);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating admin:', error);
    if (error.message === 'Forbidden') {
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

    const adminId = params.id;

    // Check if trying to delete super admin
    const { data: admin } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single();

    if (admin?.role === 'super_admin') {
      return NextResponse.json({ error: 'Cannot delete super admin' }, { status: 403 });
    }

    // Delete from auth.users (this cascades to custom tables)
    await supabaseAdmin.auth.admin.deleteUser(adminId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting admin:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
