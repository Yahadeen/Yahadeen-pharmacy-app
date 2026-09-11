import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabase';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email)
      .single();

    if (error || !user) {
      // Don't reveal if email exists for security
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token
    await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    // Send email with reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    
    // TODO: Send actual email using email service
    console.log('Password reset link:', resetUrl);
    console.log('Send to:', email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending reset email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
