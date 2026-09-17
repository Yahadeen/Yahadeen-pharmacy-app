import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAsync } from '@/src/hooks/useAsync';
import { data } from '@/src/lib/data';
import { Loading, EmptyState } from '@/src/components';
import { SUPPORT_TICKET_STATUS_LABELS, SUPPORT_TICKET_PRIORITY_LABELS, SUPPORT_TICKET_STATUS_COLORS, SUPPORT_TICKET_PRIORITY_COLORS, type SupportTicket } from '@pharmago/shared';

export default function SupportTabScreen() {
  const router = useRouter();
  const { data: tickets, loading } = useAsync(() => data.supportTickets(), []);

  const renderTicket = ({ item }: { item: SupportTicket }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => router.push(`/support/${item.id}` as any)}
    >
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketNumber}>{item.ticket_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: SUPPORT_TICKET_STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusText}>{SUPPORT_TICKET_STATUS_LABELS[item.status]}</Text>
        </View>
      </View>

      <Text style={styles.subject}>{item.subject}</Text>

      <View style={styles.ticketMeta}>
        <View style={[styles.priorityBadge, { backgroundColor: SUPPORT_TICKET_PRIORITY_COLORS[item.priority] }]}>
          <Text style={styles.priorityText}>{SUPPORT_TICKET_PRIORITY_LABELS[item.priority]}</Text>
        </View>
        <Text style={styles.orderText}>Order #{item.orders?.code}</Text>
      </View>

      <View style={styles.customerInfo}>
        <Feather name="user" size={14} color="#6b7280" />
        <Text style={styles.customerName}>
          {item.customer?.full_name}
        </Text>
      </View>

      <Text style={styles.dateText}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Support</Text>
      </View>

      {!tickets || tickets.length === 0 ? (
        <View style={styles.emptyState}>
          <EmptyState
            icon="message-circle"
            title="No support tickets"
            message="Tickets will appear here when customers need help"
          />
        </View>
      ) : (
        <View style={styles.list}>
          {tickets?.map((ticket) => (
            <View key={ticket.id}>
              {renderTicket({ item: ticket })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#022EAD',
    padding: 16,
    paddingTop: 20,
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    color: '#374151',
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
    color: '#111827',
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
    color: '#6b7280',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  customerName: {
    fontSize: 13,
    color: '#6b7280',
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
});
