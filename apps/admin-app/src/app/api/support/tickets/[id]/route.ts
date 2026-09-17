import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/server/auth';
import { supabaseAdmin } from '@/server/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;

    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .select(`
        *,
        orders:order_id (
          id,
          code,
          total_kobo,
          status
        ),
        messages:support_messages (
          id,
          message,
          sender_id,
          sender_role,
          attachment_url,
          is_internal,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: 'Support ticket not found' }, { status: 404 });
    }

    // Check access based on role
    if (auth.role === 'customer' && ticket.customer_id !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ ticket });
  } catch (error: any) {
    console.error('Support ticket fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const { status, priority, attendant_id } = body;

    // Only admins and attendants can update tickets
    if (auth.role === 'customer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (attendant_id !== undefined) updateData.attendant_id = attendant_id;

    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = auth.userId;
    }

    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating support ticket:', error);
      return NextResponse.json({ error: 'Failed to update support ticket' }, { status: 500 });
    }

    return NextResponse.json({ ticket });
  } catch (error: any) {
    console.error('Support ticket update error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
