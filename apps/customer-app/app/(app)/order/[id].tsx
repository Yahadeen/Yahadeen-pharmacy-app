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
import { useState, useEffect } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BrandGradient,
  ConfirmModal,
  DetailRow,
  Divider,
  EmptyState,
  Entrance,
  GlassButton,
  Loading,
  OrderTimeline,
  PrescriptionPreviewModal,
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
import { supabase } from '@/src/lib/supabase';

/** Statuses a customer may still call off themselves (before packed stage). */
const CANCELLABLE = ['pending_payment', 'payment_failed', 'paid', 'confirmed', 'preparing'];

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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [prescriptionPreviewOpen, setPrescriptionPreviewOpen] = useState(false);

  const view = useAsync(() => data.order(id), [id]);
  const order = view.data;

  // Subscribe to realtime order status updates
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`order:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        () => {
          // Reload order data when status changes
          data.order(id).then(updatedOrder => {
            if (updatedOrder) {
              view.setData(updatedOrder);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.channel(`order:${id}`).unsubscribe();
    };
  }, [id]);

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
  const address = order.address;
  const rider = order.delivery?.rider_name;
  const needsPayment = order.status === 'pending_payment' || order.status === 'payment_failed';
  const finished = order.status === 'delivered' || order.status === 'cancelled';

  const pay = async () => {
    setBusy(true);
    try {
      // Navigate to payment confirmation screen instead of directly to payment
      router.push(`/(app)/payment-confirm/${order.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open the payment page.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      await data.cancelOrder(order.id, 'Cancelled by customer');
      toast.success('Order cancelled.');
      setShowCancelModal(false);
      await view.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel that order.');
    } finally {
      setBusy(false);
    }
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
        cart.add(product, item.quantity);
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

  const handleGetHelp = async () => {
    setBusy(true);
    try {
      // Check if support ticket already exists for this order
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/support/tickets?order_id=${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        const existingTicket = data.tickets?.[0];
        
        if (existingTicket) {
          // Navigate to existing chat
          router.push(`/(app)/support/${existingTicket.id}`);
        } else {
          // Navigate to create new ticket
          router.push(`/(app)/support/create?orderId=${id}`);
        }
      } else {
        // If API fails, fall back to create screen
        router.push(`/(app)/support/create?orderId=${id}`);
      }
    } catch (error) {
      console.error('Error checking support ticket:', error);
      // Fall back to create screen on error
      router.push(`/(app)/support/create?orderId=${id}`);
    } finally {
      setBusy(false);
    }
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
                name={item.product?.name || `Product ${item.product_id}`}
                packSize={null}
                imageUrl={item.product?.image_url || null}
                priceKobo={item.unit_price_kobo}
                note={`× ${item.quantity}`}
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open prescription preview"
                onPress={() => setPrescriptionPreviewOpen(true)}
                style={({ pressed }) => [
                  styles.card,
                  styles.rxCard,
                  { backgroundColor: pressed ? colors.surfaceAlt : colors.surface, borderColor: colors.border },
                ]}
              >
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
                <Feather name="maximize-2" size={16} color={colors.faintText} />
              </Pressable>
            </>
          )}

          <Text style={[TYPE.heading, styles.sectionTitle, { color: colors.text }]}>
            Delivery address
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[TYPE.label, { color: colors.text }]}>{address?.full_name}</Text>
            <Text style={[TYPE.body, styles.addressLine, { color: colors.mutedText }]}>
              {[address?.address_line1, address?.address_line2, address?.city, address?.state]
                .filter(Boolean)
                .join(', ')}
            </Text>
            <Text style={[TYPE.caption, { color: colors.faintText }]}>{address?.phone}</Text>
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
                onPress={() => setShowCancelModal(true)}
              />
            )}
            <GlassButton
              title="Get help with this order"
              icon="message-circle"
              variant="ghost"
              onPress={handleGetHelp}
            />
          </View>
        </Entrance>
      </ScrollView>

      <ConfirmModal
        visible={showCancelModal}
        title="Cancel this order?"
        message="The pharmacy will be told, and anything already paid is refunded to your original payment method."
        confirmText="Cancel order"
        cancelText="Keep order"
        destructive
        onConfirm={cancel}
        onCancel={() => setShowCancelModal(false)}
        loading={busy}
      />
      <PrescriptionPreviewModal
        visible={prescriptionPreviewOpen}
        url={order.prescription_url}
        onClose={() => setPrescriptionPreviewOpen(false)}
      />
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

  cancelReason: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.md,
    marginTop: SPACE.md,
    padding: SPACE.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  cancelIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelReasonText: { marginTop: 3, lineHeight: 21 },

  rxCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  rxThumb: { width: 52, height: 52, borderRadius: RADIUS.sm },
  rxFallback: { alignItems: 'center', justifyContent: 'center' },
  rxNote: { marginTop: 2, lineHeight: 17 },

  addressLine: { marginTop: 4, marginBottom: 3, lineHeight: 21 },
  noteText: { marginTop: 3, lineHeight: 21 },
  payNote: { marginTop: SPACE.md },

  actions: { marginTop: SPACE.xxl, gap: SPACE.sm },
});
