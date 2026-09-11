/**
 * Inventory presentation: the shelf row in the Inventory tab, the level meter
 * and the movement-history row on the stock edit screen.
 *
 * Quantity is the whole point of this surface, so unlike the customer catalogue
 * the number is always shown as a number — a "Low stock" pill on its own never
 * tells an attendant whether to reorder five or five hundred.
 */
import { Feather } from '@expo/vector-icons';
import {
  RADIUS,
  SPACE,
  STOCK_STATE_META,
  TYPE,
  formatNaira,
  stockState,
  toneColors,
  type ProductWithStock,
  type StockMovement,
} from '@pharmago/shared';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { FeatherName } from './Glass';
import { formatOrderDate } from './Queue';
import { StatusPill } from './Ui';
import { useTheme } from '@/src/theme';

const PLACEHOLDER = require('../../assets/images/logo.png');

/** How each `stock_movements.reason` reads on screen. */
export const MOVEMENT_META: Record<
  StockMovement['reason'],
  { label: string; icon: FeatherName }
> = {
  sale: { label: 'Sale', icon: 'shopping-bag' },
  restock: { label: 'Restock', icon: 'package' },
  correction: { label: 'Correction', icon: 'edit-3' },
  expiry: { label: 'Expired', icon: 'alert-triangle' },
  return: { label: 'Customer return', icon: 'corner-up-left' },
};

/** The order reasons appear in the stock-edit picker — commonest first. */
export const MOVEMENT_REASONS: StockMovement['reason'][] = [
  'restock',
  'correction',
  'sale',
  'expiry',
  'return',
];

export function StockRow({ product, onPress }: { product: ProductWithStock; onPress: () => void }) {
  const { colors } = useTheme();
  const state = stockState(product.quantity, product.low_stock_threshold);
  const meta = STOCK_STATE_META[state];
  const { fg } = toneColors(colors, meta.tone);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${product.quantity} in stock, ${meta.label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.thumbBox, { backgroundColor: colors.surfaceAlt }]}>
        <Image
          source={product.image_url ? { uri: product.image_url } : PLACEHOLDER}
          style={styles.thumb}
          contentFit={product.image_url ? 'cover' : 'contain'}
          transition={180}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.nameLine}>
          <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
            {product.name}
          </Text>
          {product.requires_prescription && (
            <Feather name="file-text" size={12} color={colors.primary} />
          )}
        </View>
        <Text numberOfLines={1} style={[TYPE.caption, { color: colors.faintText }]}>
          {product.pack_size ?? product.brand ?? '—'} · {formatNaira(product.price_kobo)}
        </Text>
        <StatusPill label={meta.label} tone={meta.tone} style={styles.pill} />
      </View>

      <View style={styles.qtyBox}>
        <Text style={[styles.qty, { color: fg }]}>{product.quantity}</Text>
        <Text style={[TYPE.caption, { color: colors.faintText }]}>units</Text>
      </View>
      <Feather name="chevron-right" size={17} color={colors.faintText} />
    </Pressable>
  );
}

/**
 * Level bar. Full width is three times the reorder threshold — arbitrary but
 * stable; the bar exists to make "near the reorder line" obvious at a glance,
 * not to be a to-scale chart. Proportions use `flex` rather than percentage
 * widths so the fill can never overflow its track.
 */
export function StockMeter({
  quantity,
  threshold,
  style,
}: {
  quantity: number;
  threshold: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const { fg } = toneColors(colors, STOCK_STATE_META[stockState(quantity, threshold)].tone);
  const filled = Math.min(1, quantity / Math.max(threshold * 3, 1));

  return (
    <View style={style}>
      <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
        <View style={{ flex: filled, backgroundColor: fg }} />
        <View style={{ flex: 1 - filled }} />
      </View>
      <View style={styles.legend}>
        <Text style={[TYPE.caption, { color: colors.mutedText }]}>
          {quantity} {quantity === 1 ? 'unit' : 'units'} on the shelf
        </Text>
        <Text style={[TYPE.caption, { color: colors.faintText }]}>Reorder at {threshold}</Text>
      </View>
    </View>
  );
}

/** One line of stock history. `delta` is signed, so the sign carries the meaning. */
export function MovementRow({ movement }: { movement: StockMovement }) {
  const { colors } = useTheme();
  const meta = MOVEMENT_META[movement.reason];
  const up = movement.delta > 0;
  const tint = up ? colors.success : colors.danger;

  return (
    <View style={styles.moveRow}>
      <View
        style={[styles.moveIcon, { backgroundColor: up ? colors.successSoft : colors.dangerSoft }]}
      >
        <Feather name={meta.icon} size={14} color={tint} />
      </View>
      <View style={styles.flex}>
        <Text style={[TYPE.label, { color: colors.text }]}>{meta.label}</Text>
        <Text numberOfLines={1} style={[TYPE.caption, styles.moveWhen, { color: colors.faintText }]}>
          {movement.note ? `${movement.note} · ` : ''}
          {formatOrderDate(movement.created_at)}
        </Text>
      </View>
      <View style={styles.moveRight}>
        <Text style={[styles.moveDelta, { color: tint }]}>
          {up ? '+' : ''}
          {movement.delta}
        </Text>
        <Text style={[TYPE.caption, { color: colors.faintText }]}>→ {movement.quantity_after}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    padding: SPACE.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  pressed: { opacity: 0.75 },
  thumbBox: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    padding: 4,
  },
  thumb: { flex: 1 },
  body: { flex: 1, gap: 2 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { flexShrink: 1, fontSize: 14.5, fontWeight: '800' },
  pill: { marginTop: 4 },
  qtyBox: { alignItems: 'flex-end', minWidth: 44 },
  qty: { fontSize: 19, fontWeight: '900' },

  track: { flexDirection: 'row', height: 8, borderRadius: RADIUS.pill, overflow: 'hidden' },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },

  moveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    paddingVertical: SPACE.sm,
  },
  moveIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveWhen: { marginTop: 2 },
  moveRight: { alignItems: 'flex-end' },
  moveDelta: { fontSize: 15, fontWeight: '900' },
});
