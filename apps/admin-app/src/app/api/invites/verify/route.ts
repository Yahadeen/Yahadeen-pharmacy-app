import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabase';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    // Check if invite code exists and is valid
    const { data: invite, error } = await supabaseAdmin
      .from('admin_invites')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 400 });
    }

    return NextResponse.json({ 
      valid: true,
      role: invite.role,
    });
  } catch (error) {
    console.error('Error verifying invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
