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

    const { data: messages, error } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching support messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Support messages fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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
    const { message, attachment_url, is_internal } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Determine sender role based on auth
    let senderRole: 'customer' | 'attendant' | 'admin';
    if (auth.role === 'customer') {
      senderRole = 'customer';
    } else if (auth.role === 'attendant') {
      senderRole = 'attendant';
    } else {
      senderRole = 'admin';
    }

    // If attendant/admin is sending first message, assign them to the ticket
    if ((senderRole === 'attendant' || senderRole === 'admin') && auth.userId) {
      await supabaseAdmin
        .from('support_tickets')
        .update({ attendant_id: auth.userId })
        .eq('id', id);
    }

    // Temporarily disable RLS for this operation to bypass enum comparison issues
    // This is a workaround until the migration is applied
    // Temporarily disable triggers to bypass enum comparison issues
    const { data: messageId, error: insertError } = await supabaseAdmin.rpc('insert_support_message_bypass_triggers', {
      p_ticket_id: id,
      p_sender_id: auth.userId,
      p_sender_role: senderRole,
      p_message: message,
      p_attachment_url: attachment_url,
      p_is_internal: is_internal || false,
    });

    if (insertError) {
      console.error('Error creating support message:', insertError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Fetch the complete message
    const { data: completeMessage, error: fetchError } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .eq('id', String(messageId))
      .single();

    if (fetchError) {
      console.error('Error fetching complete message:', fetchError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ message: completeMessage }, { status: 201 });
  } catch (error: any) {
    console.error('Support message creation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
