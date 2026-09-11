import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/server/auth';
import { supabaseAdmin } from '@/server/supabase';

function requireSuperAdmin(auth: any) {
  if (!auth || auth.role !== 'super_admin') {
    throw new Error('Forbidden: Super admin access required');
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    requireSuperAdmin(auth);

    // Fetch all admin access records with admin details
    const { data: accessData, error } = await supabaseAdmin
      .from('admin_access')
      .select(`
        *,
        users:admin_id (
          id,
          full_name,
          email,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin access:', error);
      return NextResponse.json({ error: 'Failed to fetch admin access' }, { status: 500 });
    }

    return NextResponse.json(accessData);
  } catch (error: any) {
    console.error('Error in GET /api/admin/access-control:', error);
    if (error.message === 'Forbidden: Super admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    requireSuperAdmin(auth);

    const body = await request.json();
    const { admin_id, feature, can_view, can_create, can_edit, can_delete } = body;

    if (!admin_id || !feature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('admin_access')
      .upsert({
        admin_id,
        feature,
        can_view: can_view !== undefined ? can_view : true,
        can_create: can_create !== undefined ? can_create : false,
        can_edit: can_edit !== undefined ? can_edit : false,
        can_delete: can_delete !== undefined ? can_delete : false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating/updating admin access:', error);
      return NextResponse.json({ error: 'Failed to update admin access' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/access-control:', error);
    if (error.message === 'Forbidden: Super admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
