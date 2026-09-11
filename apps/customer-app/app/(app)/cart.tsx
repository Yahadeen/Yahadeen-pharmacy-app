/**
 * Cart. Purely local state — nothing here has touched the server yet, and the
 * amounts shown are snapshots for display. Checkout re-derives every kobo from
 * `products.price_kobo`, so a stale line can never change what someone is charged.
 */
import { Feather } from '@expo/vector-icons';
import {
  FREE_DELIVERY_THRESHOLD_KOBO,
  MAX_QTY_PER_LINE,
  RADIUS,
  SPACE,
  TYPE,
  formatNaira,
} from '@pharmago/shared';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Divider,
  EmptyState,
  Entrance,
  GlassButton,
  ProductRow,
  QtyStepper,
  ScreenHeader,
  StickyBar,
} from '@/src/components';
import { useCart } from '@/src/state/CartProvider';
import { useTheme } from '@/src/theme';

export default function Cart() {
  const router = useRouter();
  const { colors } = useTheme();
  const cart = useCart();

  const remaining = FREE_DELIVERY_THRESHOLD_KOBO - cart.subtotalKobo;
  const qualifiesForFreeDelivery = remaining <= 0;
  const progress = Math.min(1, cart.subtotalKobo / FREE_DELIVERY_THRESHOLD_KOBO);

  const confirmClear = () => {
    Alert.alert('Empty your cart?', 'This removes every item. It cannot be undone.', [
      { text: 'Keep items', style: 'cancel' },
      { text: 'Empty cart', style: 'destructive', onPress: cart.clear },
    ]);
  };

  if (cart.hydrated && cart.lines.length === 0) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={styles.gutter}>
          <ScreenHeader title="Your cart" onBack={() => router.back()} />
        </View>
        <EmptyState
          icon="shopping-bag"
          title="Your cart is empty"
          message="Search for a medicine or browse a category to get started."
          actionLabel="Find medicines"
          onAction={() => router.push('/(app)/search')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.gutter}>
        <ScreenHeader
          title="Your cart"
          subtitle={`${cart.count} ${cart.count === 1 ? 'item' : 'items'}`}
          onBack={() => router.back()}
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Empty cart"
              hitSlop={8}
              onPress={confirmClear}
            >
              <Text style={[TYPE.label, { color: colors.danger }]}>Clear</Text>
            </Pressable>
          }
        />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.freeBox,
            {
              backgroundColor: qualifiesForFreeDelivery ? colors.accentSoft : colors.surface,
              borderColor: qualifiesForFreeDelivery ? colors.accent : colors.border,
            },
          ]}
        >
          <View style={styles.freeTop}>
            <Feather
              name={qualifiesForFreeDelivery ? 'check-circle' : 'truck'}
              size={16}
              color={qualifiesForFreeDelivery ? colors.accentText : colors.primary}
            />
            <Text
              style={[
                TYPE.caption,
                styles.flex,
                { color: qualifiesForFreeDelivery ? colors.accentText : colors.mutedText },
              ]}
            >
              {qualifiesForFreeDelivery
                ? 'Delivery is on us for this order.'
                : `Add ${formatNaira(remaining)} more for free delivery.`}
            </Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.surfaceStrong }]}>
            <View
              style={[
                styles.trackFill,
                {
                  width: `${Math.round(progress * 100)}%`,
                  backgroundColor: qualifiesForFreeDelivery ? colors.accent : colors.primary,
                },
              ]}
            />
          </View>
        </View>

        {cart.requiresPrescription && (
          <View style={[styles.rxNote, { backgroundColor: colors.warningSoft }]}>
            <Feather name="file-text" size={16} color={colors.warning} />
            <Text style={[TYPE.caption, styles.flex, { color: colors.warning }]}>
              Your cart has prescription items. You will upload the prescription at checkout, and a
              pharmacist reviews it before dispatch.
            </Text>
          </View>
        )}

        {cart.lines.map((line, index) => (
          <Entrance key={line.product_id} delay={index * 50} distance={10} style={styles.lineGap}>
            <ProductRow
              name={line.name}
              packSize={line.pack_size}
              imageUrl={line.image_url}
              priceKobo={line.unit_price_kobo}
              requiresPrescription={line.requires_prescription}
              note={line.qty > 1 ? `× ${line.qty}` : undefined}
              onPress={() => router.push(`/(app)/product/${line.product_id}`)}
            />
            <View style={styles.lineTools}>
              <QtyStepper
                compact
                value={line.qty}
                max={Math.min(MAX_QTY_PER_LINE, Math.max(1, line.stock))}
                onChange={(next) => cart.setQty(line.product_id, next)}
              />
              <Text style={[styles.lineTotal, { color: colors.text }]}>
                {formatNaira(line.unit_price_kobo * line.qty)}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${line.name}`}
                hitSlop={8}
                onPress={() => cart.remove(line.product_id)}
                style={[styles.removeBtn, { backgroundColor: colors.dangerSoft }]}
              >
                <Feather name="trash-2" size={14} color={colors.danger} />
              </Pressable>
            </View>
            {line.stock > 0 && line.qty >= line.stock && (
              <Text style={[TYPE.caption, styles.capNote, { color: colors.warning }]}>
                Only {line.stock} in stock right now.
              </Text>
            )}
            {index < cart.lines.length - 1 && <Divider />}
          </Entrance>
        ))}
      </ScrollView>

      <StickyBar>
        <View style={styles.totalRow}>
          <View>
            <Text style={[TYPE.caption, { color: colors.mutedText }]}>Subtotal</Text>
            <Text style={[styles.total, { color: colors.text }]}>
              {formatNaira(cart.subtotalKobo)}
            </Text>
          </View>
          <Text style={[TYPE.caption, styles.feeNote, { color: colors.faintText }]}>
            Delivery calculated{'\n'}at checkout
          </Text>
        </View>
        <GlassButton
          title="Continue to checkout"
          icon="arrow-right"
          iconRight
          onPress={() => router.push('/(app)/checkout')}
        />
      </StickyBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gutter: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.md },
  scroll: { paddingHorizontal: SPACE.xl, paddingBottom: SPACE.xl },

  freeBox: {
    gap: SPACE.sm,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACE.lg,
  },
  freeTop: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  track: { height: 5, borderRadius: RADIUS.pill, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: RADIUS.pill },

  rxNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.sm,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACE.lg,
  },

  lineGap: { marginBottom: SPACE.sm },
  lineTools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    marginTop: SPACE.sm,
    paddingLeft: 58 + SPACE.md,
  },
  lineTotal: { flex: 1, fontSize: 14, fontWeight: '800' },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capNote: { marginTop: 6, paddingLeft: 58 + SPACE.md },

  totalRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  total: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  feeNote: { textAlign: 'right', lineHeight: 15 },
});
