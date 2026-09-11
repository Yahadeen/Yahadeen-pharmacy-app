import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabase';
import { getAuthContext, requireSuperAdmin } from '@/server/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    requireSuperAdmin(auth);

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let query = supabaseAdmin
      .from('admin_invites')
      .select('*')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    const { data: invites, error } = await query;

    if (error) {
      console.error('Error fetching invites:', error);
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
    }

    return NextResponse.json(invites || []);
  } catch (error: any) {
    console.error('Error fetching invites:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    requireSuperAdmin(auth);

    const { email, role, department, permissions, access } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['admin', 'attendant', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Generate a random 6-character invite code
    const generateInviteCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    const code = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Check if invite already exists for this email
    const { data: existingInvite } = await supabaseAdmin
      .from('admin_invites')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json({ error: 'Pending invite already exists for this email' }, { status: 400 });
    }

    // Create invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('admin_invites')
      .insert({
        code,
        email: email.toLowerCase(),
        role,
        department: department || null,
        access: access || null,
        created_by: auth.userId,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        is_used: false,
      })
      .select()
      .single();

    if (inviteError || !invite) {
      console.error('Invite creation error:', inviteError);
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }

    // TODO: Send email with invite code and registration link
    // For now, return the invite code so it can be displayed to the admin

    return NextResponse.json({ 
      success: true,
      invite_code: code,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error creating invite:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
