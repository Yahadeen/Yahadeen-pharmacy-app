import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/server/auth';
import { supabaseAdmin } from '@/server/supabase';
import { PushService } from '@/server/services/push.service';

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

    // First fetch messages
    const { data: messages, error } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching support messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Fetch sender information for each message
    const senderIds = [...new Set(messages?.map(m => m.sender_id) || [])];
    const { data: senders, error: sendersError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, role')
      .in('id', senderIds);

    if (sendersError) {
      console.error('Error fetching senders:', sendersError);
    }

    // Create a map of sender data
    const senderMap = new Map(senders?.map(s => [s.id, s]) || []);

    // Combine messages with sender information
    const formattedMessages = messages?.map(msg => ({
      ...msg,
      sender: senderMap.get(msg.sender_id) || null,
    })) || [];

    return NextResponse.json({ messages: formattedMessages });
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

    // Fetch the complete message with sender information
    const { data: completeMessage, error: fetchError } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .eq('id', String(messageId))
      .single();

    if (fetchError) {
      console.error('Error fetching complete message:', fetchError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Fetch sender information
    const { data: sender, error: senderError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, role')
      .eq('id', auth.userId)
      .single();

    if (senderError) {
      console.error('Error fetching sender:', senderError);
    }

    // Format the message with sender information
    const formattedMessage = {
      ...completeMessage,
      sender: sender || null,
    };

    // Send push notifications for new support message
    try {
      // Get ticket details to know who to notify
      const { data: ticket } = await supabaseAdmin
        .from('support_tickets')
        .select('customer_id, attendant_id, ticket_number')
        .eq('id', id)
        .single();

      if (ticket) {
        // If customer sent message, notify attendant/admin
        if (senderRole === 'customer') {
          const notifyIds = [ticket.attendant_id].filter(Boolean);
          if (notifyIds.length > 0) {
            await PushService.sendToUsers(notifyIds, {
              title: 'New Support Message',
              body: `New message in ticket #${ticket.ticket_number}`,
              data: {
                type: 'support_message',
                ticket_id: id,
                screen: 'support/[id]',
              },
            });
          }
        }
        // If attendant/admin sent message, notify customer
        else {
          await PushService.sendToUser(ticket.customer_id, {
            title: 'Support Reply',
            body: `New reply in ticket #${ticket.ticket_number}`,
            data: {
              type: 'support_message',
              ticket_id: id,
              screen: 'support/[id]',
            },
          });
        }
      }
    } catch (pushError) {
      // Don't fail the message sending if push fails
      console.error('Failed to send push notification:', pushError);
    }

    return NextResponse.json({ message: formattedMessage }, { status: 201 });
  } catch (error: any) {
    console.error('Support message creation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
