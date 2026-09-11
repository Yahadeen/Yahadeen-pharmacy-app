import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabase';
import { getAuthContext, requireAdmin } from '@/server/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    requireAdmin(auth);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    return NextResponse.json(payments || []);
  } catch (error: any) {
    console.error('Error in GET /api/admin/payments:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
