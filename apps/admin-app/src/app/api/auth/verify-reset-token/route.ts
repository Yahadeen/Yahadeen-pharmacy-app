import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabase';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const { data: resetToken, error } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .is('used', false)
      .single();

    if (error || !resetToken) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Error verifying reset token:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
