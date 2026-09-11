/**
 * The queue — the screen an attendant lives on.
 *
 * Three lanes instead of one long list: Active is everything that still needs
 * hands on it, Handed off is with a rider, Done is history. Inside Active the
 * orders are grouped by what to do next (confirm → prepare → hand over) and each
 * group runs oldest-first, because the person who has waited longest is always
 * the next one to serve.
 *
 * Unpaid orders never appear here at all — the pharmacy is only notified once
 * payment lands, so `pending_payment` and `payment_failed` are the customer
 * app's problem, not the counter's.
 */
import { SPACE, type OrderStatus, type StatusTone } from '@pharmago/shared';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BrandGradient,
  EmptyState,
  Entrance,
  GlassIconButton,
  QueueCard,
  QueueGroupHeader,
  Screen,
  ScreenHeader,
  Segmented,
  Skeleton,
  waitedFor,
} from '@/src/components';
import { useAsync } from '@/src/hooks/useAsync';
import { data } from '@/src/lib/data';
import { useSession } from '@/src/state/SessionProvider';
import { useTheme } from '@/src/theme';

const LANES = [
  { value: 'active', label: 'Active' },
  { value: 'handoff', label: 'Handed off' },
  { value: 'done', label: 'Done' },
] as const;

type Lane = (typeof LANES)[number]['value'];

const LANE_STATUSES: Record<Lane, readonly OrderStatus[]> = {
  active: ['paid', 'confirmed', 'preparing', 'packed', 'ready_for_pickup'],
  handoff: ['picked_up', 'out_for_delivery'],
  done: ['delivered', 'cancelled'],
};

/** Active splits by the next action, not by raw status. */
const GROUPS: { title: string; tone: StatusTone; statuses: readonly OrderStatus[] }[] = [
  { title: 'New', tone: 'warning', statuses: ['paid'] },
  { title: 'Preparing', tone: 'info', statuses: ['confirmed', 'preparing'] },
  { title: 'Ready', tone: 'success', statuses: ['packed', 'ready_for_pickup'] },
];

export default function Queue() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useSession();
  const [lane, setLane] = useState<Lane>('active');

  const queue = useAsync(async () => (await data.orders()).items, []);
  const notices = useAsync(() => data.notifications(), []);

  // Coming back from an order detail should show the move that was just made.
  // A silent refresh rather than a reload, so the list never blanks to skeletons.
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void queue.refresh();
      void notices.refresh();
    }, [queue.refresh, notices.refresh]),
  );

  const all = queue.data ?? [];
  const unread = (notices.data ?? []).filter((n) => !n.read_at).length;

  const visible = useMemo(() => {
    const inLane = all.filter((o) => LANE_STATUSES[lane].includes(o.status));
    // Active is a work queue (oldest first); the other two are logs (newest first).
    return lane === 'active' ? inLane : [...inLane].reverse();
  }, [all, lane]);

  const openCount = all.filter((o) => LANE_STATUSES.active.includes(o.status)).length;
  const oldest = all.find((o) => LANE_STATUSES.active.includes(o.status)) ?? null;

  const firstName = profile?.full_name?.split(' ')[0];

  return (
    <Screen scroll tabBarPadding refreshing={queue.refreshing} onRefresh={queue.refresh}>
      <ScreenHeader
        title="Queue"
        subtitle={firstName ? `Signed in as ${firstName}` : 'Pharmacy counter'}
        right={
          <GlassIconButton
            icon="bell"
            badge={unread}
            accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
            onPress={() => router.push('/(app)/notifications')}
          />
        }
      />

      <BrandGradient style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.flex}>
            <Text style={styles.heroNumber}>{openCount}</Text>
            <Text style={styles.heroLabel}>
              {openCount === 1 ? 'order needs you' : 'orders need you'}
            </Text>
          </View>
          <View style={styles.heroSide}>
            <Text style={styles.heroSideLabel}>Longest wait</Text>
            <Text style={styles.heroSideValue}>
              {oldest ? waitedFor(oldest.created_at) : '—'}
            </Text>
          </View>
        </View>
      </BrandGradient>

      <Segmented options={LANES} value={lane} onChange={setLane} style={styles.lanes} />

      {queue.loading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.skelCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Skeleton height={15} width="35%" />
              <Skeleton height={12} width="55%" style={styles.skelGap} />
              <Skeleton height={12} width="80%" style={styles.skelGap} />
              <Skeleton height={18} width="30%" style={styles.skelGapLg} />
            </View>
          ))}
        </View>
      ) : queue.error ? (
        <EmptyState
          icon="wifi-off"
          title="Could not load the queue"
          message={queue.error}
          actionLabel="Try again"
          onAction={queue.reload}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={lane === 'active' ? 'check-circle' : lane === 'handoff' ? 'truck' : 'clock'}
          title={
            lane === 'active'
              ? 'Queue is clear'
              : lane === 'handoff'
                ? 'Nothing with a rider'
                : 'No finished orders yet'
          }
          message={
            lane === 'active'
              ? 'Every paid order has been handled. New ones land here the moment payment clears.'
              : 'Switch lanes to see the rest of the counter.'
          }
        />
      ) : lane === 'active' ? (
        <View style={styles.groups}>
          {GROUPS.map((group) => {
            const rows = visible.filter((o) => group.statuses.includes(o.status));
            if (!rows.length) return null;
            return (
              <View key={group.title}>
                <QueueGroupHeader title={group.title} count={rows.length} tone={group.tone} />
                <View style={styles.list}>
                  {rows.map((order, index) => (
                    <Entrance key={order.id} delay={index * 55}>
                      <QueueCard
                        order={order}
                        onPress={() => router.push(`/(app)/order/${order.id}`)}
                      />
                    </Entrance>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.list}>
          {visible.map((order, index) => (
            <Entrance key={order.id} delay={index * 55}>
              <QueueCard order={order} onPress={() => router.push(`/(app)/order/${order.id}`)} />
            </Entrance>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  hero: { marginBottom: SPACE.lg },
  heroRow: { flexDirection: 'row', alignItems: 'center', padding: SPACE.lg, gap: SPACE.md },
  heroNumber: { fontSize: 40, fontWeight: '900', color: '#FFFFFF', lineHeight: 44 },
  heroLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.82)',
  },
  heroSide: { alignItems: 'flex-end' },
  heroSideLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.72)',
  },
  heroSideValue: { marginTop: 2, fontSize: 22, fontWeight: '900', color: '#FFFFFF' },

  lanes: { marginBottom: SPACE.lg },
  groups: { gap: SPACE.xl },
  list: { gap: SPACE.md },
  skelCard: { padding: SPACE.lg, borderRadius: 20, borderWidth: 1 },
  skelGap: { marginTop: SPACE.sm },
  skelGapLg: { marginTop: SPACE.lg },
});
