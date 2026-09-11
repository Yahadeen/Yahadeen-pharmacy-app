import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabase';

export async function POST(request: NextRequest) {
  try {
    const { invite_code, email, full_name, phone, password, department, permissions } = await request.json();

    if (!invite_code || !email || !full_name || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify invite code
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('admin_invites')
      .select('*')
      .eq('code', invite_code.toUpperCase())
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      console.error('Invite verification error:', inviteError);
      return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 400 });
    }

    // For attendant roles, allow any email with a valid invite code
    // For admin/super_admin roles, email must match the invite
    if (invite.role === 'admin' || invite.role === 'super_admin') {
      if (invite.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json({ error: 'Email does not match the invited email' }, { status: 400 });
      }
    }

    // Check if email already exists in auth.users
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const authUserExists = existingAuthUser.users.some(u => u.email === email);

    if (authUserExists) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Check if email already exists in custom users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Create auth user using signUp
    // Trigger is disabled, so we'll handle profile creation manually
    let authData, authError;
    let retries = 3;
    
    for (let i = 0; i < retries; i++) {
      const result = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            phone,
          },
          emailRedirectTo: undefined,
        },
      });
      
      authData = result.data;
      authError = result.error;
      
      if (authError && (authError.name === 'AuthRetryableFetchError' || authError.status === 500) && i < retries - 1) {
        console.log(`Retryable error, attempt ${i + 1}/${retries}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      
      break;
    }

    if (authError || !authData?.user) {
      console.error('Auth user creation error:', authError);
      console.error('Error details:', JSON.stringify(authError, null, 2));
      return NextResponse.json({ 
        error: 'Failed to create user. Please try again.', 
        details: authError?.message 
      }, { status: 500 });
    }

    // Manually confirm the user email
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
      authData.user.id,
      { email_confirm: true }
    );

    if (confirmError) {
      console.error('Email confirmation error:', confirmError);
    }

    // Manually create user profile entry (trigger is disabled)
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name,
        phone,
        role: invite.role,
        is_active: true,
        email_verified: true,
      });

    if (insertError) {
      console.error('User profile creation error:', insertError);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
    }

    // Manually create role-specific profile
    if (invite.role === 'attendant') {
      const employeeId = `YD-${full_name.toLowerCase().replace(/\s+/g, '-')}`;
      
      const { error: attendantError } = await supabaseAdmin
        .from('attendant_profiles')
        .insert({
          user_id: authData.user.id,
          employee_id: employeeId,
          schedule: {},
        });

      if (attendantError) {
        console.error('Attendant profile creation error:', attendantError);
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        await supabaseAdmin.from('users').delete().eq('id', authData.user.id);
        return NextResponse.json({ error: 'Failed to create attendant profile' }, { status: 500 });
      }
    } else if (invite.role === 'admin' || invite.role === 'super_admin') {
      const { error: adminError } = await supabaseAdmin
        .from('admin_profiles')
        .insert({
          user_id: authData.user.id,
          department: department || invite.department || 'General',
          permissions: invite.role === 'super_admin' ? { all: true } : (permissions || {}),
        });

      if (adminError) {
        console.error('Admin profile creation error:', adminError);
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        await supabaseAdmin.from('users').delete().eq('id', authData.user.id);
        return NextResponse.json({ error: 'Failed to create admin profile' }, { status: 500 });
      }

      // Create access control entries if provided
      if (invite.access && typeof invite.access === 'object') {
        const accessEntries = Object.entries(invite.access).map(([feature, perms]: [string, any]) => ({
          admin_id: authData.user.id,
          feature,
          can_view: perms.can_view || false,
          can_create: perms.can_create || false,
          can_edit: perms.can_edit || false,
          can_delete: perms.can_delete || false,
        }));

        if (accessEntries.length > 0) {
          await supabaseAdmin.from('admin_access').insert(accessEntries);
        }
      }
    } else if (invite.role === 'customer') {
      const { error: customerError } = await supabaseAdmin
        .from('customer_profiles')
        .insert({
          user_id: authData.user.id,
        });

      if (customerError) {
        console.error('Customer profile creation error:', customerError);
      }
    }

    // Mark invite as used
    await supabaseAdmin
      .from('admin_invites')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
      })
      .eq('id', invite.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
