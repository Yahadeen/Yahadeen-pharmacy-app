/**
 * Order presentation: the summary card used in the Orders tab, and the vertical
 * tracking timeline on the detail screen.
 *
 * Both read from `ORDER_STATUS_META` / `ORDER_TIMELINE` in the shared package so
 * a status never reads one way here and another way in the dashboard.
 */
import { Feather } from '@expo/vector-icons';
import {
  ORDER_STATUS_META,
  ORDER_TIMELINE,
  RADIUS,
  SPACE,
  TYPE,
  formatNaira,
  type Order,
  type OrderStatus,
  type OrderSummary,
} from '@pharmago/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusPill } from './Ui';
import { useTheme } from '@/src/theme';

/** `12 Mar, 14:05` — short enough for a card, unambiguous enough for support. */
export function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function OrderCard({ order, onPress }: { order: OrderSummary; onPress: () => void }) {
  const { colors } = useTheme();
  const meta = ORDER_STATUS_META[order.status];
  const needsAction = order.status === 'pending_payment' || order.status === 'payment_failed';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.code}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: needsAction ? colors.warning : colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.flex}>
          <Text style={[styles.code, { color: colors.text }]}>{order.code}</Text>
          <Text style={[TYPE.caption, { color: colors.faintText }]}>
            {formatOrderDate(order.created_at)}
          </Text>
        </View>
        <StatusPill label={meta.label} tone={meta.tone} />
      </View>

      <Text numberOfLines={2} style={[TYPE.body, styles.preview, { color: colors.mutedText }]}>
        {order.preview}
      </Text>

      <View style={[styles.cardFoot, { borderTopColor: colors.border }]}>
        <Text style={[TYPE.caption, { color: colors.mutedText }]}>
          {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
        </Text>
        <View style={styles.totalLine}>
          <Text style={[styles.total, { color: colors.text }]}>{formatNaira(order.total_kobo)}</Text>
          <Feather name="chevron-right" size={17} color={colors.faintText} />
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Vertical progress rail. A cancelled order shows only the steps it reached plus
 * a red terminal node — pretending it is still "in progress" would be a lie.
 */
export function OrderTimeline({ order }: { order: Order }) {
  const { colors } = useTheme();
  const cancelled = order.status === 'cancelled';
  const reachedIndex = ORDER_TIMELINE.indexOf(order.status);

  const stamps: Partial<Record<OrderStatus, string | null>> = {
    paid: order.paid_at,
    confirmed: order.confirmed_at,
    packed: order.packed_at,
    out_for_delivery: order.dispatched_at,
    delivered: order.delivered_at,
  };

  const steps = cancelled
    ? ORDER_TIMELINE.filter((s) => !!stamps[s])
    : ORDER_TIMELINE;

  return (
    <View>
      {steps.map((status, index) => {
        const meta = ORDER_STATUS_META[status];
        const done = cancelled ? true : reachedIndex >= 0 && index <= reachedIndex;
        const current = !cancelled && index === reachedIndex;
        const last = index === steps.length - 1 && !cancelled;
        const stamp = stamps[status];

        return (
          <View key={status} style={styles.step}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.node,
                  {
                    backgroundColor: done ? colors.accent : colors.surfaceAlt,
                    borderColor: current ? colors.accentDeep : 'transparent',
                  },
                ]}
              >
                {done && <Feather name="check" size={11} color={colors.onAccent} />}
              </View>
              {!last && (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: done && index < reachedIndex ? colors.accent : colors.border },
                  ]}
                />
              )}
            </View>
            <View style={styles.stepBody}>
              <Text
                style={[
                  TYPE.label,
                  { color: done ? colors.text : colors.faintText, fontWeight: current ? '800' : '600' },
                ]}
              >
                {meta.label}
              </Text>
              {(current || done) && (
                <Text style={[TYPE.caption, styles.stepDetail, { color: colors.mutedText }]}>
                  {meta.detail}
                </Text>
              )}
              {!!stamp && (
                <Text style={[TYPE.caption, styles.stepStamp, { color: colors.faintText }]}>
                  {formatOrderDate(stamp)}
                </Text>
              )}
            </View>
          </View>
        );
      })}

      {cancelled && (
        <View style={styles.step}>
          <View style={styles.rail}>
            <View style={[styles.node, { backgroundColor: colors.danger, borderColor: 'transparent' }]}>
              <Feather name="x" size={11} color={colors.onStatus} />
            </View>
          </View>
          <View style={styles.stepBody}>
            <Text style={[TYPE.label, { color: colors.text, fontWeight: '800' }]}>Cancelled</Text>
            <Text style={[TYPE.caption, styles.stepDetail, { color: colors.mutedText }]}>
              {order.cancel_reason ?? ORDER_STATUS_META.cancelled.detail}
            </Text>
            {!!order.cancelled_at && (
              <Text style={[TYPE.caption, styles.stepStamp, { color: colors.faintText }]}>
                {formatOrderDate(order.cancelled_at)}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    padding: SPACE.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACE.sm,
  },
  pressed: { opacity: 0.75 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.md },
  code: { fontSize: 15.5, fontWeight: '900', letterSpacing: 0.4 },
  preview: { lineHeight: 20 },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACE.xs,
    paddingTop: SPACE.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLine: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  total: { fontSize: 16, fontWeight: '900' },

  step: { flexDirection: 'row', gap: SPACE.md },
  rail: { alignItems: 'center', width: 22 },
  node: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { width: 2, flex: 1, minHeight: 26, marginVertical: 2 },
  stepBody: { flex: 1, paddingBottom: SPACE.lg },
  stepDetail: { marginTop: 2, lineHeight: 17 },
  stepStamp: { marginTop: 3 },
});
