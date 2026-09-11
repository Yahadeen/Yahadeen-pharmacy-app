import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabase';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Verify and get reset token
    const { data: resetToken, error } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .is('used', false)
      .single();

    if (error || !resetToken) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      resetToken.user_id,
      { password }
    );

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    // Mark token as used
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', resetToken.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error confirming password reset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
