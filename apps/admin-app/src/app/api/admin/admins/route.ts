import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireSuperAdmin } from '@/server/auth';
import { supabaseAdmin } from '@/server/supabase';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    requireSuperAdmin(auth);

    const { data: admins, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        is_active,
        created_at,
        admin_profiles (
          department,
          permissions
        )
      `)
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(admins || []);
  } catch (error: any) {
    console.error('Error fetching admins:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    requireSuperAdmin(auth);

    const { email, full_name, phone, department, permissions } = await request.json();

    if (!email || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: Math.random().toString(36).slice(-8), // Generate random password
      email_confirm: true,
      user_metadata: {
        full_name,
        phone,
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Update user with admin role
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .update({
        full_name,
        phone,
        role: 'admin',
        is_active: true,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    // Create admin profile
    await supabaseAdmin
      .from('admin_profiles')
      .insert({
        user_id: authData.user.id,
        department: department || null,
        permissions: permissions || {},
      });

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (error: any) {
    console.error('Error creating admin:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
