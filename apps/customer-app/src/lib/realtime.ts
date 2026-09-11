import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEvent<T = any> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T | null;
};

export function subscribeToOrderStatus(
  orderId: string,
  callback: (event: RealtimeEvent) => void
): RealtimeChannel {
  return supabase
    .channel(`order-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();
}

export function subscribeToStockUpdates(
  productId: string,
  callback: (event: RealtimeEvent) => void
): RealtimeChannel {
  return supabase
    .channel(`inventory-${productId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'inventory',
        filter: `product_id=eq.${productId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();
}

export function subscribeToChatMessages(
  threadId: string,
  callback: (event: RealtimeEvent) => void
): RealtimeChannel {
  return supabase
    .channel(`chat-${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();
}

export function subscribeToNotifications(
  userId: string,
  callback: (event: RealtimeEvent) => void
): RealtimeChannel {
  return supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();
}

export function unsubscribe(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}

// Helper to subscribe to multiple channels and return cleanup function
export function subscribeToMultiple(
  channels: RealtimeChannel[]
): () => void {
  return () => {
    channels.forEach((channel) => supabase.removeChannel(channel));
  };
}
