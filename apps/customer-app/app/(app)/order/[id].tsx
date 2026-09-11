/**
 * Order tracking. One fetch gives the status, the timeline stamps, the rider and
 * the receipt, so this screen is the single place a customer needs to check on an
 * order — and the only place the cancel / pay / reorder actions live.
 */
import { Feather } from '@expo/vector-icons';
import {
  ORDER_STATUS_META,
  RADIUS,
  SPACE,
  TYPE,
  formatNaira,
} from '@pharmago/shared';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BrandGradient,
  DetailRow,
  Divider,
  EmptyState,
  Entrance,
  GlassButton,
  Loading,
  OrderTimeline,
  ProductRow,
  ScreenHeader,
  StatusPill,
  formatOrderDate,
} from '@/src/components';
import { useAsync } from '@/src/hooks/useAsync';
import { data } from '@/src/lib/data';
import { useCart } from '@/src/state/CartProvider';
import { useToast } from '@/src/state/ToastProvider';
import { useTheme } from '@/src/theme';

/** Statuses a customer may still call off themselves. */
const CANCELLABLE = ['pending_payment', 'payment_failed', 'paid', 'confirmed'];

/** `eta` is an ISO timestamp; customers think in minutes. */
function etaText(iso: string): string {
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (minutes <= 1) return 'any moment now';
  if (minutes < 60) return `in about ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `in about ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const cart = useCart();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const view = useAsync(() => data.order(id), [id]);
  const order = view.data;

  if (view.loading) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <Loading label="Loading your order…" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="alert-circle"
          title="Order not found"
          message={view.error ?? 'We could not load that order.'}
          actionLabel="Back to orders"
          onAction={() => router.replace('/(app)/(tabs)/orders')}
        />
      </SafeAreaView>
    );
  }

  const meta = ORDER_STATUS_META[order.status];
  const address = order.address_snapshot;
  const rider = order.delivery?.rider_name;
  const needsPayment = order.status === 'pending_payment' || order.status === 'payment_failed';
  const finished = order.status === 'delivered' || order.status === 'cancelled';

  const pay = async () => {
    setBusy(true);
    try {
      const { payment_url } = await data.retryPayment(order.id);
      await WebBrowser.openBrowserAsync(payment_url);
      await view.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open the payment page.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    Alert.alert(
      'Cancel this order?',
      'The pharmacy will be told, and anything already paid is refunded to your original payment method.',
      [
        { text: 'Keep order', style: 'cancel' },
        {
          text: 'Cancel order',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await data.cancelOrder(order.id, 'Cancelled by customer');
              toast.success('Order cancelled.');
              await view.reload();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Could not cancel that order.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const reorder = async () => {
    setBusy(true);
    let added = 0;
    let skipped = 0;
    for (const item of order.items) {
      if (!item.product_id) {
        skipped += 1;
        continue;
      }
      try {
        const product = await data.product(item.product_id);
        if (product.quantity <= 0) {
          skipped += 1;
          continue;
        }
        cart.add(product, item.qty);
        added += 1;
      } catch {
        skipped += 1;
      }
    }
    setBusy(false);
    if (!added) {
      toast.error('None of those items are available right now.');
      return;
    }
    toast.success(
      skipped ? `${added} added — ${skipped} unavailable.` : 'Everything is back in your cart.',
    );
    router.push('/(app)/cart');
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.gutter}>
        <ScreenHeader
          title={order.code}
          subtitle={formatOrderDate(order.created_at)}
          onBack={() => router.back()}
          right={<StatusPill label={meta.label} tone={meta.tone} />}
        />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={view.refreshing}
            onRefresh={view.refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Entrance>
          <BrandGradient style={styles.hero}>
            <Text style={styles.heroLabel}>{meta.label.toUpperCase()}</Text>
            <Text style={styles.heroDetail}>{meta.detail}</Text>
            {!!order.delivery?.eta && !finished && (
              <View style={styles.heroEta}>
                <Feather name="clock" size={13} color="#FFFFFF" />
                <Text style={styles.heroEtaText}>Arriving {etaText(order.delivery.eta)}</Text>
              </View>
            )}
          </BrandGradient>

          {needsPayment && (
            <GlassButton
              title={order.status === 'payment_failed' ? 'Try payment again' : 'Pay now'}
              icon="credit-card"
              loading={busy}
              onPress={pay}
              style={styles.payBtn}
            />
          )}

          {!!rider && !finished && (
            <View style={[styles.rider, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.riderAvatar, { backgroundColor: colors.accentSoft }]}>
                <Feather name="user" size={18} color={colors.accentText} />
              </View>
              <View style={styles.flex}>
                <Text style={[TYPE.label, { color: colors.text }]}>{rider}</Text>
                <Text style={[TYPE.caption, { color: colors.faintText }]}>
                  Your rider
                  {order.delivery?.distance_km ? ` · ${order.delivery.distance_km} km away` : ''}
                </Text>
              </View>
              {!!order.delivery?.rider_phone && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${rider}`}
                  hitSlop={8}
                  onPress={() => void Linking.openURL(`tel:${order.delivery?.rider_phone}`)}
                  style={[styles.callBtn, { backgroundColor: colors.accent }]}
                >
                  <Feather name="phone" size={16} color={colors.onAccent} />
                </Pressable>
              )}
            </View>
          )}

          <Text style={[TYPE.heading, styles.sectionTitle, { color: colors.text }]}>Progress</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <OrderTimeline order={order} />
          </View>

          <Text style={[TYPE.heading, styles.sectionTitle, { color: colors.text }]}>
            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
          </Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemGap}>
              <ProductRow
                name={item.name_snapshot}
                packSize={item.pack_size_snapshot}
                imageUrl={item.image_url_snapshot}
                priceKobo={item.unit_price_kobo}
                note={`× ${item.qty}`}
                onPress={
                  item.product_id
                    ? () => router.push(`/(app)/product/${item.product_id}`)
                    : undefined
                }
              />
            </View>
          ))}

          {!!order.prescription_url && (
            <>
              <Text style={[TYPE.heading, styles.sectionTitle, { color: colors.text }]}>
                Prescription
              </Text>
              <View style={[styles.card, styles.rxCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {order.prescription_url.startsWith('http') ? (
                  <Image
                    source={{ uri: order.prescription_url }}
                    style={styles.rxThumb}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.rxThumb, styles.rxFallback, { backgroundColor: colors.surfaceAlt }]}>
                    <Feather name="file-text" size={20} color={colors.faintText} />
                  </View>
                )}
                <View style={styles.flex}>
                  <Text style={[TYPE.label, { color: colors.text }]}>Uploaded and on file</Text>
                  <Text style={[TYPE.caption, styles.rxNote, { color: colors.mutedText }]}>
                    A licensed pharmacist reviews this before your items are dispensed.
                  </Text>
                </View>
              </View>
            </>
          )}

          <Text style={[TYPE.heading, styles.sectionTitle, { color: colors.text }]}>
            Delivery address
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[TYPE.label, { color: colors.text }]}>{address.recipient_name}</Text>
            <Text style={[TYPE.body, styles.addressLine, { color: colors.mutedText }]}>
              {[address.line1, address.line2, address.landmark, address.city, address.state]
                .filter(Boolean)
                .join(', ')}
            </Text>
            <Text style={[TYPE.caption, { color: colors.faintText }]}>{address.phone}</Text>
            {!!order.note && (
              <>
                <Divider />
                <Text style={[TYPE.caption, { color: colors.faintText }]}>Your note</Text>
                <Text style={[TYPE.body, styles.noteText, { color: colors.mutedText }]}>
                  {order.note}
                </Text>
              </>
            )}
          </View>

          <Text style={[TYPE.heading, styles.sectionTitle, { color: colors.text }]}>Payment</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <DetailRow label="Subtotal" value={formatNaira(order.subtotal_kobo)} />
            <DetailRow
              label="Delivery"
              value={
                order.delivery_fee_kobo === 0 ? 'Free' : formatNaira(order.delivery_fee_kobo)
              }
              valueColor={order.delivery_fee_kobo === 0 ? colors.accentText : undefined}
            />
            <Divider />
            <DetailRow label="Total" value={formatNaira(order.total_kobo)} strong />
            {!!order.payment && (
              <Text style={[TYPE.caption, styles.payNote, { color: colors.faintText }]}>
                Paid by {order.payment.channel ?? order.payment.provider}
                {order.payment.paid_at ? ` · ${formatOrderDate(order.payment.paid_at)}` : ''}
              </Text>
            )}
          </View>

          <View style={styles.actions}>
            {finished && (
              <GlassButton
                title="Order these again"
                icon="rotate-ccw"
                variant="glass"
                loading={busy}
                onPress={reorder}
              />
            )}
            {CANCELLABLE.includes(order.status) && (
              <GlassButton
                title="Cancel order"
                icon="x-circle"
                variant="ghost"
                disabled={busy}
                onPress={cancel}
              />
            )}
            <GlassButton
              title="Get help with this order"
              icon="message-circle"
              variant="ghost"
              onPress={() =>
                toast.show('Support chat is coming in the next release.', 'info')
              }
            />
          </View>
        </Entrance>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gutter: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.md },
  scroll: { paddingHorizontal: SPACE.xl, paddingBottom: SPACE.xxl },

  hero: { padding: SPACE.xl },
  heroLabel: { fontSize: 11.5, fontWeight: '900', letterSpacing: 1.4, color: 'rgba(255,255,255,0.82)' },
  heroDetail: { marginTop: SPACE.sm, fontSize: 17, fontWeight: '800', lineHeight: 24, color: '#FFFFFF' },
  heroEta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: SPACE.md,
    paddingHorizontal: SPACE.md,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroEtaText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },

  payBtn: { marginTop: SPACE.lg },

  rider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    marginTop: SPACE.lg,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  riderAvatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: { marginTop: SPACE.xxl, marginBottom: SPACE.md },
  card: { padding: SPACE.lg, borderRadius: RADIUS.lg, borderWidth: 1 },
  itemGap: { marginBottom: SPACE.sm },

  rxCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  rxThumb: { width: 52, height: 52, borderRadius: RADIUS.sm },
  rxFallback: { alignItems: 'center', justifyContent: 'center' },
  rxNote: { marginTop: 2, lineHeight: 17 },

  addressLine: { marginTop: 4, marginBottom: 3, lineHeight: 21 },
  noteText: { marginTop: 3, lineHeight: 21 },
  payNote: { marginTop: SPACE.md },

  actions: { marginTop: SPACE.xxl, gap: SPACE.sm },
});
