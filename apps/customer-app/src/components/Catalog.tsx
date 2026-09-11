/**
 * Catalogue building blocks: the product grid tile, its skeleton, the compact
 * row used by search and cart, and the category tile.
 *
 * These take `ProductWithStock` — the joined shape the API actually returns —
 * so a card can show stock state without a second request.
 */
import { Feather } from '@expo/vector-icons';
import {
  RADIUS,
  SPACE,
  STOCK_STATE_META,
  TYPE,
  formatNaira,
  stockState,
  type Category,
  type ProductWithStock,
} from '@pharmago/shared';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Skeleton, StatusPill } from './Ui';
import type { FeatherName } from './Glass';
import { useTheme } from '@/src/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PLACEHOLDER = require('../../assets/images/logo.png');

/** Small "Rx" flag. Prescription items are dispensed only after review. */
export function RxBadge({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.rx, { backgroundColor: colors.primary }, style]}>
      <Feather name="file-text" size={10} color={colors.onPrimary} />
      <Text style={[styles.rxText, { color: colors.onPrimary }]}>Rx</Text>
    </View>
  );
}

/* --------------------------------------------------------------- grid tile -- */

export function ProductCard({
  product,
  onPress,
  onAdd,
  inCart = 0,
  style,
}: {
  product: ProductWithStock;
  onPress: () => void;
  onAdd?: () => void;
  /** Quantity already in the cart, shown on the add button. */
  inCart?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const state = stockState(product.quantity, product.low_stock_threshold);
  const soldOut = state === 'out_of_stock';

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={product.name}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 18 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18 });
      }}
      style={[anim, style]}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
        ]}
      >
        <View style={[styles.thumbBox, { backgroundColor: colors.surfaceAlt }]}>
          <Image
            source={product.image_url ? { uri: product.image_url } : PLACEHOLDER}
            style={styles.thumb}
            contentFit={product.image_url ? 'cover' : 'contain'}
            transition={180}
          />
          {product.requires_prescription && <RxBadge style={styles.thumbRx} />}
          {soldOut && (
            <View style={[styles.soldOut, { backgroundColor: colors.overlay }]}>
              <Text style={[styles.soldOutText, { color: '#FFFFFF' }]}>Out of stock</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text numberOfLines={2} style={[styles.cardName, { color: colors.text }]}>
            {product.name}
          </Text>
          <Text numberOfLines={1} style={[TYPE.caption, { color: colors.faintText }]}>
            {product.pack_size ?? product.brand ?? '—'}
          </Text>

          {state === 'low_stock' && (
            <StatusPill
              label={`Only ${product.quantity} left`}
              tone={STOCK_STATE_META.low_stock.tone}
              style={styles.cardPill}
            />
          )}

          <View style={styles.cardFoot}>
            <Text style={[styles.cardPrice, { color: colors.text }]}>
              {formatNaira(product.price_kobo)}
            </Text>
            {!!onAdd && !soldOut && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Add ${product.name} to cart`}
                hitSlop={6}
                onPress={onAdd}
                style={[
                  styles.add,
                  { backgroundColor: inCart > 0 ? colors.accent : colors.primary },
                ]}
              >
                {inCart > 0 ? (
                  <Text style={[styles.addCount, { color: colors.onAccent }]}>{inCart}</Text>
                ) : (
                  <Feather name="plus" size={17} color={colors.onPrimary} />
                )}
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export function ProductCardSkeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      <Skeleton height={112} radius={0} />
      <View style={styles.cardBody}>
        <Skeleton height={13} />
        <Skeleton height={13} width="60%" style={styles.skelGap} />
        <Skeleton height={18} width="45%" style={styles.skelGapLg} />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------- list row -- */

/** Compact horizontal row. Used by search results and the cart. */
export function ProductRow({
  name,
  packSize,
  imageUrl,
  priceKobo,
  requiresPrescription = false,
  note,
  right,
  onPress,
}: {
  name: string;
  packSize?: string | null;
  imageUrl?: string | null;
  priceKobo: number;
  requiresPrescription?: boolean;
  /** Small line under the price, e.g. "×2" or "Out of stock". */
  note?: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[styles.rowThumbBox, { backgroundColor: colors.surfaceAlt }]}>
        <Image
          source={imageUrl ? { uri: imageUrl } : PLACEHOLDER}
          style={styles.rowThumb}
          contentFit={imageUrl ? 'cover' : 'contain'}
          transition={180}
        />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTitleLine}>
          <Text numberOfLines={2} style={[styles.rowName, { color: colors.text }]}>
            {name}
          </Text>
          {requiresPrescription && <RxBadge />}
        </View>
        {!!packSize && (
          <Text numberOfLines={1} style={[TYPE.caption, { color: colors.faintText }]}>
            {packSize}
          </Text>
        )}
        <Text style={[styles.rowPrice, { color: colors.text }]}>
          {formatNaira(priceKobo)}
          {!!note && <Text style={[TYPE.caption, { color: colors.mutedText }]}>{`  ${note}`}</Text>}
        </Text>
      </View>
      {right}
    </Pressable>
  );
}

/* --------------------------------------------------------- category tile -- */

export function CategoryTile({
  category,
  onPress,
}: {
  category: Category;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={category.name}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cat,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.catPressed,
      ]}
    >
      <View style={[styles.catIcon, { backgroundColor: colors.primarySoft }]}>
        <Feather name={category.icon as FeatherName || 'grid'} size={19} color={colors.primary} />
      </View>
      <Text numberOfLines={2} style={[styles.catName, { color: colors.text }]}>
        {category.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rx: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  rxText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.3 },

  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  thumbBox: { height: 112, alignItems: 'center', justifyContent: 'center' },
  thumb: { width: '100%', height: '100%' },
  thumbRx: { position: 'absolute', top: SPACE.sm, left: SPACE.sm },
  soldOut: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  soldOutText: { fontSize: 12, fontWeight: '800' },

  cardBody: { padding: SPACE.md, gap: 3 },
  cardName: { fontSize: 14, fontWeight: '700', lineHeight: 18, minHeight: 36 },
  cardPill: { marginTop: 2 },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACE.sm,
  },
  cardPrice: { fontSize: 15.5, fontWeight: '900' },
  add: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCount: { fontSize: 13, fontWeight: '900' },
  skelGap: { marginTop: SPACE.sm },
  skelGapLg: { marginTop: SPACE.md },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  rowThumbBox: {
    width: 58,
    height: 58,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowThumb: { width: '100%', height: '100%' },
  rowBody: { flex: 1, gap: 2 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  rowName: { flex: 1, fontSize: 14.5, fontWeight: '700', lineHeight: 19 },
  rowPrice: { marginTop: 2, fontSize: 14.5, fontWeight: '900' },

  cat: {
    width: 86,
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  catPressed: { opacity: 0.7 },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: { fontSize: 11.5, fontWeight: '700', textAlign: 'center', lineHeight: 15 },
});

