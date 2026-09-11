/**
 * Product detail. One fetch, then everything a customer needs to decide: stock
 * state, what the pack contains, and whether a prescription is required before
 * we can dispense it.
 *
 * Out-of-stock products swap the add button for a restock watch, so the screen is
 * never a dead end.
 */
import { Feather } from '@expo/vector-icons';
import {
  RADIUS,
  SPACE,
  STOCK_STATE_META,
  TYPE,
  formatNaira,
  stockState,
} from '@pharmago/shared';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Divider,
  EmptyState,
  Entrance,
  GlassButton,
  Loading,
  QtyStepper,
  RxBadge,
  StatusPill,
  StickyBar,
} from '@/src/components';
import { useAsync } from '@/src/hooks/useAsync';
import { data } from '@/src/lib/data';
import { useCart } from '@/src/state/CartProvider';
import { useToast } from '@/src/state/ToastProvider';
import { useTheme } from '@/src/theme';

const PLACEHOLDER = require('../../../assets/images/logo.png');

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const cart = useCart();
  const toast = useToast();

  const [qty, setQty] = useState(1);
  const [watching, setWatching] = useState(false);

  const view = useAsync(() => data.product(id), [id]);
  const product = view.data;

  if (view.loading) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <Loading label="Fetching product…" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="alert-circle"
          title="Product unavailable"
          message={view.error ?? 'We could not load this product.'}
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const state = stockState(product.quantity, product.low_stock_threshold);
  const soldOut = state === 'out_of_stock';
  const inCart = cart.qtyOf(product.id);
  const max = Math.max(1, product.quantity);

  const watch = async () => {
    try {
      await data.watchRestock(product.id);
      setWatching(true);
      toast.success('We will let you know the moment it is back.');
    } catch {
      toast.error('Could not set that alert. Try again shortly.');
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: colors.surfaceAlt }]}>
          <Image
            source={product.image_url ? { uri: product.image_url } : PLACEHOLDER}
            style={styles.heroImage}
            contentFit={product.image_url ? 'cover' : 'contain'}
            transition={220}
          />
          <SafeAreaView edges={['top']} style={styles.heroBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={10}
              onPress={() => router.back()}
              style={[styles.circle, { backgroundColor: colors.surface }]}
            >
              <Feather name="chevron-left" size={22} color={colors.text} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open cart"
              hitSlop={10}
              onPress={() => router.push('/(app)/cart')}
              style={[styles.circle, { backgroundColor: colors.surface }]}
            >
              <Feather name="shopping-bag" size={19} color={colors.text} />
              {cart.count > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.badgeText, { color: colors.onAccent }]}>{cart.count}</Text>
                </View>
              )}
            </Pressable>
          </SafeAreaView>
        </View>

        <Entrance style={styles.body}>
          <View style={styles.titleLine}>
            <Text style={[TYPE.title, styles.flex, { color: colors.text }]}>{product.name}</Text>
            {product.requires_prescription && <RxBadge />}
          </View>

          {!!(product.brand ?? product.generic_name) && (
            <Text style={[TYPE.body, styles.sub, { color: colors.mutedText }]}>
              {[product.brand, product.generic_name].filter(Boolean).join(' · ')}
            </Text>
          )}

          <View style={styles.priceLine}>
            <Text style={[styles.price, { color: colors.text }]}>
              {formatNaira(product.price_kobo)}
            </Text>
            <StatusPill
              label={
                state === 'low_stock'
                  ? `Only ${product.quantity} left`
                  : STOCK_STATE_META[state].label
              }
              tone={STOCK_STATE_META[state].tone}
            />
          </View>

          <View style={[styles.facts, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Fact icon="package" label="Pack size" value={product.pack_size ?? 'Single unit'} />
            <Divider style={styles.factDivider} />
            <Fact icon="grid" label="Category" value={product.category_name ?? 'General'} />
            <Divider style={styles.factDivider} />
            <Fact
              icon="truck"
              label="Delivery"
              value="Same day within Lagos"
            />
          </View>

          {product.requires_prescription && (
            <View style={[styles.rxNote, { backgroundColor: colors.warningSoft }]}>
              <Feather name="file-text" size={16} color={colors.warning} />
              <Text style={[TYPE.caption, styles.rxNoteText, { color: colors.warning }]}>
                Prescription required. You will be asked to upload it at checkout, and a licensed
                pharmacist reviews it before your order is dispensed.
              </Text>
            </View>
          )}

          {!!product.description && (
            <View style={styles.section}>
              <Text style={[TYPE.heading, { color: colors.text }]}>About this product</Text>
              <Text style={[TYPE.body, styles.description, { color: colors.mutedText }]}>
                {product.description}
              </Text>
            </View>
          )}

          <View style={[styles.disclaimer, { borderColor: colors.border }]}>
            <Feather name="info" size={14} color={colors.faintText} />
            <Text style={[TYPE.caption, styles.disclaimerText, { color: colors.faintText }]}>
              Always read the label. If symptoms persist, speak to a pharmacist or your doctor.
            </Text>
          </View>
        </Entrance>
      </ScrollView>

      <StickyBar>
        {soldOut ? (
          <GlassButton
            title={watching ? 'You are on the waitlist' : 'Notify me when back in stock'}
            icon={watching ? 'check' : 'bell'}
            variant={watching ? 'ghost' : 'glass'}
            disabled={watching}
            onPress={watch}
          />
        ) : (
          <View style={styles.barRow}>
            <QtyStepper value={qty} onChange={setQty} max={max} />
            <GlassButton
              title={inCart > 0 ? `Add ${qty} more` : `Add ${formatNaira(product.price_kobo * qty)}`}
              icon="shopping-bag"
              onPress={() => {
                cart.add(product, qty);
                toast.success(
                  `${qty} × ${product.name} added to your cart`,
                );
                setQty(1);
              }}
              style={styles.flex}
            />
          </View>
        )}
      </StickyBar>
    </View>
  );
}

/** Icon + label + value column used in the facts strip. */
function Fact({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.fact}>
      <Feather name={icon} size={16} color={colors.primary} />
      <Text style={[TYPE.caption, styles.factLabel, { color: colors.faintText }]}>{label}</Text>
      <Text numberOfLines={2} style={[styles.factValue, { color: colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: SPACE.xxl },

  hero: { height: 300 },
  heroImage: { width: '100%', height: '100%' },
  heroBar: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.lg,
  },
  circle: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACE.sm,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: 2,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '900' },

  body: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.xl },
  titleLine: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.sm },
  sub: { marginTop: SPACE.xs },
  priceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.md,
    marginTop: SPACE.lg,
  },
  price: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },

  facts: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: SPACE.xl,
    padding: SPACE.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  fact: { flex: 1, alignItems: 'center', gap: 5 },
  factLabel: { textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10 },
  factValue: { fontSize: 12.5, fontWeight: '800', textAlign: 'center' },
  factDivider: { width: StyleSheet.hairlineWidth, height: 'auto', marginVertical: 0, marginHorizontal: SPACE.md },

  rxNote: {
    flexDirection: 'row',
    gap: SPACE.sm,
    marginTop: SPACE.lg,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
  },
  rxNoteText: { flex: 1, lineHeight: 17 },

  section: { marginTop: SPACE.xxl, gap: SPACE.sm },
  description: { lineHeight: 22 },

  disclaimer: {
    flexDirection: 'row',
    gap: SPACE.sm,
    marginTop: SPACE.xxl,
    paddingTop: SPACE.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  disclaimerText: { flex: 1, lineHeight: 17 },

  barRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
});
