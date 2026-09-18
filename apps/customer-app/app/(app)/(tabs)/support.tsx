import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAsync } from '@/src/hooks/useAsync';
import { data } from '@/src/lib/data';
import { Loading, EmptyState } from '@/src/components';
import { SUPPORT_TICKET_STATUS_LABELS, SUPPORT_TICKET_PRIORITY_LABELS, SUPPORT_TICKET_STATUS_COLORS, SUPPORT_TICKET_PRIORITY_COLORS, RADIUS, SPACE, TYPE, type SupportTicket } from '@pharmago/shared';
import { useTheme } from '@/src/theme';

export default function SupportTabScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data: tickets, loading, reload } = useAsync(() => data.supportTickets(), []);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    reload();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderTicket = (ticket: SupportTicket) => (
    <Pressable
      key={ticket.id}
      accessibilityRole="button"
      accessibilityLabel={`View ticket ${ticket.ticket_number}`}
      onPress={() => router.push(`/support/${ticket.id}`)}
      style={({ pressed }) => [
        styles.ticketCard,
        { 
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.ticketHeader}>
        <Text style={[styles.ticketNumber, { color: colors.text }]}>
          #{ticket.ticket_number}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: SUPPORT_TICKET_STATUS_COLORS[ticket.status] }]}>
          <Text style={styles.statusText}>
            {SUPPORT_TICKET_STATUS_LABELS[ticket.status]}
          </Text>
        </View>
      </View>

      <Text style={[styles.subject, { color: colors.text }]} numberOfLines={2}>
        {ticket.subject}
      </Text>

      <View style={styles.ticketMeta}>
        <View style={[styles.priorityBadge, { backgroundColor: SUPPORT_TICKET_PRIORITY_COLORS[ticket.priority] }]}>
          <Text style={styles.priorityText}>
            {SUPPORT_TICKET_PRIORITY_LABELS[ticket.priority]}
          </Text>
        </View>
        {ticket.orders?.code && (
          <Text style={[styles.orderText, { color: colors.mutedText }]}>
            Order #{ticket.orders.code}
          </Text>
        )}
      </View>

      <Text style={[styles.dateText, { color: colors.faintText }]}>
        {new Date(ticket.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
      </Text>
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Text style={[TYPE.title, { color: colors.text }]}>Support</Text>
        </View>
        <View style={[styles.centerContent, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[TYPE.label, styles.loadingText, { color: colors.mutedText }]}>
            Loading your tickets…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[TYPE.title, { color: colors.text }]}>Support</Text>
        <Text style={[TYPE.label, styles.headerSubtitle, { color: colors.mutedText }]}>
          {!tickets || tickets.length === 0 ? 'No tickets yet' : `${tickets.length} tickets`}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {!tickets || tickets.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
              <Feather name="message-circle" size={32} color={colors.primary} />
            </View>
            <Text style={[TYPE.heading, styles.emptyTitle, { color: colors.text }]}>
              No support tickets
            </Text>
            <Text style={[TYPE.body, styles.emptyMessage, { color: colors.mutedText }]}>
              Tap 'Get Help' on any order to create a ticket
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {tickets.map(renderTicket)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  
  // Header styles
  header: {
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.lg,
    paddingBottom: SPACE.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerSubtitle: {
    marginTop: 2,
  },

  // Content styles
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACE.xl,
    paddingBottom: SPACE.xl * 2,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.md,
  },
  loadingText: {
    marginTop: SPACE.sm,
  },

  // Empty state styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACE.xxxl,
    paddingHorizontal: SPACE.xl,
    minHeight: 300,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.lg,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: SPACE.sm,
  },
  emptyMessage: {
    textAlign: 'center',
    lineHeight: 21,
  },

  // Ticket card styles
  list: {
    gap: SPACE.md,
  },
  ticketCard: {
    borderRadius: RADIUS.lg,
    padding: SPACE.lg,
    borderWidth: 1,
    marginBottom: SPACE.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.sm,
  },
  ticketNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: SPACE.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACE.sm,
    lineHeight: 22,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACE.sm,
    gap: SPACE.sm,
  },
  priorityBadge: {
    paddingHorizontal: SPACE.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  orderText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
