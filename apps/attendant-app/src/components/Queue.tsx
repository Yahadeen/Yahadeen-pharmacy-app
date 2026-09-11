/**
 * Queue presentation for the staff app.
 *
 * A card here answers three things at a glance: how long the customer has been
 * waiting, what is in the bag, and what stage the order sits at. Wait time is
 * the urgent signal, so it is the only thing that gets tinted — after
 * `WARN_MINS` the card edge turns amber, after `LATE_MINS` red. Nothing else on
 * the card competes for that attention.
 */
import { Feather } from '@expo/vector-icons';
import {
  OPEN_ORDER_STATUSES,
  ORDER_STATUS_META,
  ORDER_TIMELINE,
  RADIUS,
  SPACE,
  TYPE,
  formatNaira,
  toneColors,
  type Order,
  type OrderStatus,
  type OrderSummary,
  type StatusTone,
} from '@pharmago/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusPill } from './Ui';
import { useTheme } from '@/src/theme';

/** Minutes waited before a still-open order is flagged, then flagged harder. */
const WARN_MINS = 15;
const LATE_MINS = 30;

const minsSince = (iso: string) => Math.max(0, (Date.now() - new Date(iso).getTime()) / 60_000);

/** `4m`, `1h 08m`, `2d` — compact enough for the corner of a card. */
export function waitedFor(iso: string): string {
  const mins = Math.round(minsSince(iso));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${String(mins % 60).padStart(2, '0')}m`;
  return `${Math.floor(hours / 24)}d`;
}

/** `12 Mar, 14:05` — short enough for a card, unambiguous enough for support. */
export function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function QueueCard({ order, onPress }: { order: OrderSummary; onPress: () => void }) {
  const { colors } = useTheme();
  const meta = ORDER_STATUS_META[order.status];
  const open = OPEN_ORDER_STATUSES.includes(order.status);
  // Only a queue that someone still has to clear can be "late".
  const waiting = open ? minsSince(order.created_at) : 0;
  const late = waiting >= LATE_MINS;
  const warn = !late && waiting >= WARN_MINS;
  const flag = late ? colors.danger : warn ? colors.warning : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.code}, ${meta.label}, waiting ${waitedFor(order.created_at)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: flag ?? colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.stripe, { backgroundColor: flag ?? colors.primarySoft }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.flex}>
            <Text style={[styles.code, { color: colors.text }]}>{order.code}</Text>
            <Text
              numberOfLines={1}
              style={[TYPE.caption, styles.customer, { color: colors.mutedText }]}
            >
              {order.customer_name ?? 'Walk-in customer'}
            </Text>
          </View>
          <View style={styles.topRight}>
            <StatusPill label={meta.label} tone={meta.tone} />
            <View style={styles.waitLine}>
              <Feather name="clock" size={11} color={flag ?? colors.faintText} />
              <Text style={[styles.wait, { color: flag ?? colors.faintText }]}>
                {waitedFor(order.created_at)}
              </Text>
            </View>
          </View>
        </View>

        <Text numberOfLines={2} style={[TYPE.body, styles.preview, { color: colors.mutedText }]}>
          {order.preview}
        </Text>

        <View style={[styles.foot, { borderTopColor: colors.border }]}>
          <Text style={[TYPE.caption, { color: colors.mutedText }]}>
            {order.item_count} {order.item_count === 1 ? 'item' : 'items'} ·{' '}
            {formatOrderDate(order.created_at)}
          </Text>
          <View style={styles.totalLine}>
            <Text style={[styles.total, { color: colors.text }]}>
              {formatNaira(order.total_kobo)}
            </Text>
            <Feather name="chevron-right" size={17} color={colors.faintText} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Group heading with a count pill — `New · 2`. The pill is tone-coloured so a
 * long "New" queue reads as pressure without needing any extra copy.
 */
export function QueueGroupHeader({
  title,
  count,
  tone = 'neutral',
}: {
  title: string;
  count: number;
  tone?: StatusTone;
}) {
  const { colors } = useTheme();
  const { fg, bg } = toneColors(colors, tone);
  return (
    <View style={styles.groupHeader}>
      <Text style={[TYPE.heading, { color: colors.text }]}>{title}</Text>
      <View style={[styles.count, { backgroundColor: bg }]}>
        <Text style={[styles.countText, { color: fg }]}>{count}</Text>
      </View>
    </View>
  );
}

/** Short labels — the `ORDER_STATUS_META` ones are too long for a 7-node strip. */
const SHORT_LABEL: Partial<Record<OrderStatus, string>> = {
  paid: 'Paid',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  packed: 'Packed',
  ready_for_pickup: 'Ready',
  out_for_delivery: 'On way',
  delivered: 'Delivered',
};

/** `picked_up` has no node of its own — it sits on the "Ready" one. */
function timelineIndex(status: OrderStatus): number {
  return ORDER_TIMELINE.indexOf(status === 'picked_up' ? 'ready_for_pickup' : status);
}

/**
 * Horizontal step rail. Staff only need "where is this in the flow", so this is
 * a dot strip rather than the customer app's verbose vertical timeline. A
 * cancelled order gets a banner instead — drawing progress for an order that
 * stopped would be a lie.
 */
export function OrderProgress({ order }: { order: Order }) {
  const { colors } = useTheme();

  if (order.status === 'cancelled') {
    return (
      <View style={[styles.cancelled, { backgroundColor: colors.dangerSoft }]}>
        <Feather name="x-circle" size={16} color={colors.danger} />
        <View style={styles.flex}>
          <Text style={[TYPE.label, { color: colors.danger }]}>Cancelled</Text>
          {!!order.cancel_reason && (
            <Text style={[TYPE.caption, styles.cancelReason, { color: colors.danger }]}>
              {order.cancel_reason}
            </Text>
          )}
        </View>
      </View>
    );
  }

  const reached = timelineIndex(order.status);
  const lastIndex = ORDER_TIMELINE.length - 1;

  return (
    <View style={styles.rail}>
      {ORDER_TIMELINE.map((status, i) => {
        const done = reached >= 0 && i <= reached;
        const current = i === reached;
        return (
          <View key={status} style={styles.railStep}>
            <View style={styles.railTrack}>
              <View
                style={[
                  styles.railLine,
                  { backgroundColor: i === 0 ? 'transparent' : done ? colors.accent : colors.border },
                ]}
              />
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: done ? colors.accent : colors.surfaceAlt,
                    borderColor: current ? colors.accentDeep : 'transparent',
                  },
                ]}
              >
                {done && <Feather name="check" size={9} color={colors.onAccent} />}
              </View>
              <View
                style={[
                  styles.railLine,
                  {
                    backgroundColor:
                      i === lastIndex ? 'transparent' : i < reached ? colors.accent : colors.border,
                  },
                ]}
              />
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.railLabel,
                { color: current ? colors.text : colors.faintText, fontWeight: current ? '800' : '600' },
              ]}
            >
              {SHORT_LABEL[status] ?? ORDER_STATUS_META[status].label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { flexDirection: 'row', borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
  pressed: { opacity: 0.75 },
  /** Colour-coded left edge: the urgency signal, readable from across a counter. */
  stripe: { width: 4 },
  body: { flex: 1, padding: SPACE.lg, gap: SPACE.sm },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.md },
  code: { fontSize: 15.5, fontWeight: '900', letterSpacing: 0.4 },
  customer: { marginTop: 2 },
  topRight: { alignItems: 'flex-end', gap: 5 },
  waitLine: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  wait: { fontSize: 11.5, fontWeight: '800' },
  preview: { lineHeight: 20 },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACE.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLine: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  total: { fontSize: 16, fontWeight: '900' },

  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    marginBottom: SPACE.md,
  },
  count: {
    minWidth: 24,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 12, fontWeight: '900' },

  cancelled: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.sm,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
  },
  cancelReason: { marginTop: 2, lineHeight: 16 },

  rail: { flexDirection: 'row', alignItems: 'flex-start' },
  railStep: { flex: 1, alignItems: 'center' },
  railTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  railLine: { flex: 1, height: 2 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railLabel: { fontSize: 9.5, marginTop: 5, textAlign: 'center' },
});
