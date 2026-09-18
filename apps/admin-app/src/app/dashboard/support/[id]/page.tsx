'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { SUPPORT_TICKET_STATUS_LABELS, SUPPORT_TICKET_STATUS_COLORS, SENDER_ROLE_LABELS, type SupportTicket, type SupportMessage } from '@pharmago/shared';
import { DetailsModal } from '@/components/details-modal';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SupportChatPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get current user ID
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });

    loadTicket();
    loadMessages();
    subscribeToMessages();

    return () => {
      supabase.channel(`support_messages:${id}`).unsubscribe();
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const loadTicket = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/support/tickets/${id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json();
      setTicket(data.ticket);
    } catch (error) {
      console.error('Error loading ticket:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/support/tickets/${id}/messages`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json();
      setMessages(data.messages || []);
      // Scroll to bottom after messages are loaded
      setTimeout(() => scrollToBottom(), 300);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`support_messages:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${id}`,
        },
        async (payload) => {
          const newMessage = payload.new as SupportMessage;
          
          // Fetch sender data for the new message
          const { data: sender } = await supabase
            .from('users')
            .select('id, full_name, role')
            .eq('id', newMessage.sender_id)
            .single();
          
          const enrichedMessage = {
            ...newMessage,
            sender: sender || undefined,
          };
          
          // Check if message already exists to avoid duplicates
          // Also check if it's our own optimistic message to avoid duplication
          setMessages((prev) => {
            const isDuplicate = prev.some(m => m.id === newMessage.id);
            const isOurOptimistic = prev.some(m => m.id.startsWith('temp-') && m.sender_id === currentUserId);
            
            if (isDuplicate) {
              return prev;
            }
            
            // If this is a real message and we have a matching optimistic message, replace it
            if (isOurOptimistic && newMessage.sender_id === currentUserId) {
              const optimisticIndex = prev.findIndex(m => m.id.startsWith('temp-'));
              if (optimisticIndex >= 0) {
                const updated = [...prev];
                updated[optimisticIndex] = enrichedMessage;
                return updated;
              }
            }
            
            // Otherwise add the new message
            return [...prev, enrichedMessage];
          });
          setTimeout(() => scrollToBottom(), 100);
        }
      )
      .subscribe();
  };

  const sendMessage = async () => {
    if ((!messageText.trim() && !selectedImage) || sending) return;

    const tempId = `temp-${Date.now()}`;
    let attachmentUrl: string | null = null;

    // Upload image if selected
    if (selectedImage) {
      attachmentUrl = await uploadImage(selectedImage);
      if (!attachmentUrl) {
        return; // Upload failed
      }
    }

    const optimisticMessage: SupportMessage = {
      id: tempId,
      ticket_id: id,
      sender_id: currentUserId || 'unknown',
      sender_role: 'admin',
      message: messageText.trim() || (selectedImage ? 'Image attachment' : ''),
      attachment_url: attachmentUrl,
      is_internal: false,
      created_at: new Date().toISOString(),
    };

    // Optimistically add message
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageText('');
    setSelectedImage(null);
    setSending(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/support/tickets/${id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ 
          message: messageText.trim() || 'Image attachment',
          attachment_url: attachmentUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Replace optimistic message with real one
        setMessages((prev) => prev.map(m => m.id === tempId ? data.message : m));
      } else {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter(m => m.id !== tempId));
        setMessageText(messageText);
        setSelectedImage(selectedImage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      setMessageText(messageText);
      setSelectedImage(selectedImage);
    } finally {
      setSending(false);
    }
  };

  const updateTicketStatus = async (status: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/support/tickets/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const data = await response.json();
        setTicket(data.ticket);
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const loadOrderDetails = async () => {
    if (!ticket?.order_id) return;
    
    setLoadingOrder(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/orders/${ticket.order_id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setOrderDetails(data);
        setOrderModalOpen(true);
      }
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const clearAttachment = () => {
    setSelectedImage(null);
  };

  const renderMessage = (message: SupportMessage) => {
    const isOwnMessage = message.sender_role === 'admin';
    const roleLabel = SENDER_ROLE_LABELS[message.sender_role] || message.sender_role;
    
    return (
      <div
        key={message.id}
        style={{
          display: 'flex',
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            maxWidth: 400,
            padding: 16,
            borderRadius: 16,
            background: isOwnMessage ? 'var(--brand)' : 'var(--surface)',
            border: isOwnMessage ? 'none' : '1px solid var(--border)',
            color: isOwnMessage ? 'white' : 'var(--text)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, opacity: 0.8 }}>
            {roleLabel}
          </div>
          <div style={{ fontSize: 14 }}>{message.message}</div>
          {message.attachment_url && (
            <div style={{ marginTop: 8 }}>
              <img 
                src={message.attachment_url} 
                alt="Attachment" 
                style={{ 
                  maxWidth: '100%', 
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setPreviewImageUrl(message.attachment_url);
                  setImagePreviewOpen(true);
                }}
              />
            </div>
          )}
          <div style={{ fontSize: 11, marginTop: 8, opacity: 0.7 }}>
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <div style={{ 
          animation: 'spin 1s linear infinite',
          borderRadius: '50%',
          height: 48,
          width: 48,
          borderBottom: '2px solid var(--brand)',
        }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: 'calc(100vh - 80px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: 8,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 24 }}>←</span>
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text)' }}>
            {ticket?.ticket_number}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {ticket?.subject}
          </p>
          {ticket?.customer && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              Customer: {ticket.customer.full_name}
            </p>
          )}
        </div>
        {ticket?.order_id && (
          <button
            onClick={loadOrderDetails}
            disabled={loadingOrder}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text)',
              fontWeight: 600,
              cursor: loadingOrder ? 'not-allowed' : 'pointer',
              fontSize: 13,
            }}
          >
            {loadingOrder ? 'Loading...' : '📦 View Order'}
          </button>
        )}
        <span
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            background: SUPPORT_TICKET_STATUS_COLORS[ticket?.status || 'open'],
            color: 'white',
          }}
        >
          {SUPPORT_TICKET_STATUS_LABELS[ticket?.status || 'open']}
        </span>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 16,
          flexShrink: 0,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
          Update Status
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(['open', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => updateTicketStatus(status)}
              disabled={updatingStatus}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: ticket?.status === status ? 'var(--brand)' : 'var(--surface-2)',
                color: ticket?.status === status ? 'white' : 'var(--text)',
                fontWeight: 600,
                cursor: updatingStatus ? 'not-allowed' : 'pointer',
                fontSize: 13,
              }}
            >
              {SUPPORT_TICKET_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div 
          ref={messagesContainerRef}
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 16, 
            overflowY: 'auto',
            flex: 1,
            paddingRight: 8,
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{ 
                animation: 'spin 1s linear infinite',
                borderRadius: '50%',
                height: 48,
                width: 48,
                borderBottom: '2px solid var(--brand)',
              }}></div>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No messages yet</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Start the conversation
              </p>
            </div>
          ) : (
            <>
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} style={{ height: 1 }} />
            </>
          )}
        </div>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 16,
          flexShrink: 0,
        }}
      >
        {selectedImage && (
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <img 
              src={URL.createObjectURL(selectedImage)} 
              alt="Preview" 
              style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }}
            />
            <button
              onClick={clearAttachment}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                border: 'none',
                background: '#ef4444',
                color: 'white',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Remove
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 16 }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <button
            onClick={() => document.getElementById('image-upload')?.click()}
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            📎
          </button>
          <input
            type="text"
            placeholder="Type your message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text)',
              fontSize: 14,
              outline: 'none',
            }}
            maxLength={1000}
          />
          <button
            onClick={sendMessage}
            disabled={(!messageText.trim() && !selectedImage) || sending || uploadingImage}
            style={{
              padding: '12px 24px',
              borderRadius: 8,
              border: 'none',
              background: (!messageText.trim() && !selectedImage) || sending || uploadingImage ? 'var(--surface-2)' : 'var(--brand)',
              color: (!messageText.trim() && !selectedImage) || sending || uploadingImage ? 'var(--text-muted)' : 'white',
              fontWeight: 600,
              cursor: (!messageText.trim() && !selectedImage) || sending || uploadingImage ? 'not-allowed' : 'pointer',
              fontSize: 14,
            }}
          >
            {sending || uploadingImage ? '...' : 'Send'}
          </button>
        </div>
      </div>

      {orderModalOpen && (
        <DetailsModal
          isOpen={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
          title="Order Details"
          size="md"
        >
          {loadingOrder ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{
                animation: 'spin 1s linear infinite',
                borderRadius: '50%',
                height: 40,
                width: 40,
                borderBottom: '2px solid var(--brand)',
                margin: '0 auto',
              }}></div>
            </div>
          ) : orderDetails ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Order Code
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{orderDetails.code}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Status
                </label>
                <div style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 600 }}>
                  {orderDetails.status?.replace(/_/g, ' ').toUpperCase()}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Total
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>
                  ₦{(orderDetails.total_kobo / 100).toLocaleString()}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Created
                </label>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>
                  {new Date(orderDetails.created_at).toLocaleString()}
                </div>
              </div>
              {orderDetails.notes && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                    Notes
                  </label>
                  <div style={{ fontSize: 14, color: 'var(--text)' }}>{orderDetails.notes}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No order details available</p>
            </div>
          )}
        </DetailsModal>
      )}

      {imagePreviewOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => setImagePreviewOpen(false)}
        >
          <img
            src={previewImageUrl || ''}
            alt="Full preview"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setImagePreviewOpen(false)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
