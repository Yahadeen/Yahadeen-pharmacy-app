import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RADIUS, SPACE, TYPE, SUPPORT_TICKET_STATUS_LABELS, SUPPORT_TICKET_PRIORITY_LABELS, SUPPORT_TICKET_STATUS_COLORS, SUPPORT_TICKET_PRIORITY_COLORS, type SupportTicket } from '@pharmago/shared';
import { useAsync } from '@/src/hooks/useAsync';
import { data } from '@/src/lib/data';
import { Loading, EmptyState, ScreenHeader } from '@/src/components';
import { useTheme } from '@/src/theme';

export default function SupportTabScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data: tickets, loading } = useAsync(() => data.supportTickets(), []);

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

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.gutter}>
        <ScreenHeader
          title="Support"
          subtitle={tickets?.length ? `${tickets.length} ticket${tickets.length === 1 ? '' : 's'}` : 'No tickets'}
        />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gutter: {
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.lg,
  },
  list: {
    paddingHorizontal: SPACE.xl,
    paddingBottom: SPACE.xl,
  },
  ticketCard: {
    borderRadius: RADIUS.lg,
    padding: SPACE.lg,
    marginBottom: SPACE.md,
    borderWidth: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.sm,
  },
  ticketNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACE.sm,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACE.sm,
  },
  priorityBadge: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginRight: SPACE.sm,
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
    marginBottom: SPACE.sm,
  },
  customerName: {
    fontSize: 13,
  },
  dateText: {
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACE.xl,
  },
});
