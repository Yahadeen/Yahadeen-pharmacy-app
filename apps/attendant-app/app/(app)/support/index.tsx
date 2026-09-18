import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useToast } from '@/src/state/ToastProvider';
import { supabase } from '@/src/lib/supabase';
import { SPACE, SUPPORT_TICKET_STATUS_LABELS, SUPPORT_TICKET_PRIORITY_LABELS, SUPPORT_TICKET_STATUS_COLORS, SUPPORT_TICKET_PRIORITY_COLORS, type SupportTicket } from '@pharmago/shared';
import { useTheme } from '@/src/theme';
import { Screen, ScreenHeader, EmptyState } from '@/src/components';

export default function SupportScreen() {
  const router = useRouter();
  const toast = useToast();
  const { colors } = useTheme();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    loadTickets();
  }, [filter]);

  const loadTickets = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/support/tickets?status=${filter === 'all' ? '' : filter}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTickets(data.tickets || []);
      } else {
        toast.error('Failed to load support tickets');
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const renderTicket = ({ item }: { item: SupportTicket }) => (
    <TouchableOpacity
      style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push(`/support/${item.id}` as any)}
    >
      <View style={styles.ticketHeader}>
        <Text style={[styles.ticketNumber, { color: colors.text }]}>{item.ticket_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: SUPPORT_TICKET_STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusText}>{SUPPORT_TICKET_STATUS_LABELS[item.status]}</Text>
        </View>
      </View>

      <Text style={[styles.subject, { color: colors.text }]}>{item.subject}</Text>

      <View style={styles.ticketMeta}>
        <View style={[styles.priorityBadge, { backgroundColor: SUPPORT_TICKET_PRIORITY_COLORS[item.priority] }]}>
          <Text style={styles.priorityText}>{SUPPORT_TICKET_PRIORITY_LABELS[item.priority]}</Text>
        </View>
        <Text style={[styles.orderText, { color: colors.mutedText }]}>Order #{item.orders?.code}</Text>
      </View>

      <View style={styles.customerInfo}>
        <Feather name="user" size={14} color={colors.mutedText} />
        <Text style={[styles.customerName, { color: colors.mutedText }]}>
          {item.customer?.full_name}
        </Text>
      </View>

      <Text style={[styles.dateText, { color: colors.faintText }]}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const renderFilter = (value: 'all' | 'open' | 'in_progress' | 'resolved', label: string) => (
    <TouchableOpacity
      key={value}
      style={[styles.filterButton, { backgroundColor: filter === value ? colors.primary : colors.surfaceAlt }, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterText, { color: filter === value ? colors.onPrimary : colors.mutedText }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <Screen>
        <View style={styles.gutter}>
          <ScreenHeader
            title="Support Tickets"
            subtitle="Loading tickets…"
            onBack={() => router.back()}
          />
        </View>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.gutter}>
        <ScreenHeader
          title="Support Tickets"
          subtitle={tickets.length === 0 ? 'No tickets' : `${tickets.length} tickets`}
          onBack={() => router.back()}
        />
      </View>

      <View style={[styles.filters, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {renderFilter('all', 'All')}
        {renderFilter('open', 'Open')}
        {renderFilter('in_progress', 'In Progress')}
        {renderFilter('resolved', 'Resolved')}
      </View>

      <View style={styles.scrollContent}>
          {tickets.length === 0 ? (
            <EmptyState
              icon="message-circle"
              title="No support tickets"
              message="Tickets will appear here when customers need help"
            />
          ) : (
            <View style={styles.gutter}>
              {tickets.map((ticket, index) => (
                <TouchableOpacity
                  key={ticket.id}
                  style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push(`/support/${ticket.id}`)}
                >
                  <View style={styles.ticketHeader}>
                    <Text style={[styles.ticketNumber, { color: colors.text }]}>{ticket.ticket_number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: SUPPORT_TICKET_STATUS_COLORS[ticket.status] }]}>
                      <Text style={styles.statusText}>{SUPPORT_TICKET_STATUS_LABELS[ticket.status]}</Text>
                    </View>
                  </View>

                  <Text style={[styles.subject, { color: colors.text }]}>{ticket.subject}</Text>

                  <View style={styles.ticketMeta}>
                    <View style={[styles.priorityBadge, { backgroundColor: SUPPORT_TICKET_PRIORITY_COLORS[ticket.priority] }]}>
                      <Text style={styles.priorityText}>{SUPPORT_TICKET_PRIORITY_LABELS[ticket.priority]}</Text>
                    </View>
                    <Text style={[styles.orderText, { color: colors.mutedText }]}>Order #{ticket.orders?.code}</Text>
                  </View>

                  <View style={styles.customerInfo}>
                    <Feather name="user" size={14} color={colors.mutedText} />
                    <Text style={[styles.customerName, { color: colors.mutedText }]}>
                      {ticket.customer?.full_name}
                    </Text>
                  </View>

                  <Text style={[styles.dateText, { color: colors.faintText }]}>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gutter: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.lg },
  scrollContent: { padding: 20, paddingTop: 0 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  filters: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterButtonActive: {
    // Active state handled by theme colors
  },
  filterText: {
    fontSize: 13,
  },
  ticketCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  orderText: {
    fontSize: 13,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  customerName: {
    fontSize: 13,
  },
  dateText: {
    fontSize: 12,
  },
});
