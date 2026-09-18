/**
 * Order detail — where the work actually happens.
 *
 * Everything an attendant needs to fulfil one order, in the order they need it:
 * where it is in the flow, who it is for, what to pick off the shelf, and the one
 * button that moves it forward. The next step is derived from
 * `ORDER_STATUS_FLOW`, never hardcoded, so the client can't offer a transition
 * the server will reject.
 *
 * The pick list is a checklist because packing the wrong box is the expensive
 * mistake in a pharmacy. Ticks live in local state only — they are a working aid
 * for the person holding the phone, not a record, and the "Mark packed" button
 * stays disabled until every line is ticked.
 */
import { Feather } from '@expo/vector-icons';
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_META,
  RADIUS,
  SPACE,
  TYPE,
  formatNaira,
  type OrderStatus,
} from '@pharmago/shared';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ConfirmModal,
  DetailRow,
  Divider,
  EmptyState,
  Entrance,
  Field,
  GlassButton,
  Loading,
  OrderProgress,
  PrescriptionPreviewModal,
  ScreenHeader,
  StatusPill,
  StickyBar,
  formatOrderDate,
  type FeatherName,
  type GlassButtonVariant,
} from '@/src/components';
import { useAsync } from '@/src/hooks/useAsync';
import { data } from '@/src/lib/data';
import { useToast } from '@/src/state/ToastProvider';
import { useTheme } from '@/src/theme';

/** The single forward move offered for each status, phrased as the action. */
const NEXT_STEP: Partial<
  Record<OrderStatus, { to: OrderStatus; label: string; icon: FeatherName; variant: GlassButtonVariant }>
> = {
  paid: { to: 'confirmed', label: 'Confirm this order', icon: 'check', variant: 'primary' },
  confirmed: { to: 'preparing', label: 'Start preparing', icon: 'play', variant: 'primary' },
  preparing: { to: 'packed', label: 'Mark packed', icon: 'package', variant: 'accent' },
  packed: { to: 'ready_for_pickup', label: 'Ready for pickup', icon: 'bell', variant: 'accent' },
  ready_for_pickup: { to: 'picked_up', label: 'Rider collected it', icon: 'user-check', variant: 'primary' },
  picked_up: { to: 'out_for_delivery', label: 'Out for delivery', icon: 'truck', variant: 'primary' },
  out_for_delivery: { to: 'delivered', label: 'Mark delivered', icon: 'check-circle', variant: 'accent' },
};

const CANCEL_REASONS = [
  'Item out of stock',
  'Customer changed their mind',
  'Prescription not valid',
  'Cannot reach the customer',
];

const PAYMENT_LABEL: Record<'paystack' | 'flutterwave' | 'manual', string> = {
  paystack: 'Paystack',
  flutterwave: 'Flutterwave',
  manual: 'At the counter',
};

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();

  const view = useAsync(() => data.order(id), [id]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [note, setNote] = useState('');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [prescriptionPreviewOpen, setPrescriptionPreviewOpen] = useState(false);

  if (view.loading) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <Loading label="Opening the order…" />
      </SafeAreaView>
    );
  }

  const order = view.data;

  if (!order) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="alert-circle"
          title="Order not found"
          message={view.error ?? 'That order is no longer in the queue.'}
          actionLabel="Back to the queue"
          onAction={() => router.replace('/(app)/(tabs)')}
        />
      </SafeAreaView>
    );
  }

  const meta = ORDER_STATUS_META[order.status];
  const address = order.address_snapshot || order.address;
  // Held in a local so the narrowing survives into the onPress closure.
  const rx = order.prescription_url;
  const next = NEXT_STEP[order.status];
  // Plain locals, again so the narrowing reaches the call closure.
  const riderName = order.delivery?.rider_name ?? null;
  const riderPhone = order.delivery?.rider_phone ?? null;
  const canCancel = ORDER_STATUS_FLOW[order.status].includes('cancelled');
  const ticked = order.items?.filter((i) => checked[i.id]).length || 0;
  const allTicked = order.items ? ticked === order.items.length : false;
  // Only the pack step is gated — checking items off is pointless once the box
  // is sealed, and blocking a delivery hand-off on it would be theatre.
  const gated = next?.to === 'packed' && !allTicked;

  const call = (phone: string) => void Linking.openURL(`tel:${phone}`);

  // Helper to get address properties regardless of address type
  const getAddressLine1 = () => address?.address_line1 || '';
  const getAddressLine2 = () => address?.address_line2 || '';
  const getCity = () => address?.city || '';
  const getState = () => address?.state || '';
  const getPhone = () => address?.phone || '';
  const getFullName = () => address?.full_name || order.customer?.full_name || '';

  const advance = async () => {
    if (!next) return;
    setBusy(true);
    try {
      const updated = await data.advanceStatus(order.id, next.to);
      view.setData(updated);
      // Refresh the view to recalculate all derived values
      await view.refresh();
      toast.success(`${order.code} is now ${ORDER_STATUS_META[updated.status].label.toLowerCase()}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not move that order.');
    } finally {
      setBusy(false);
    }
  };

  const submitCancel = () => {
    const full = note.trim() ? `${reason} — ${note.trim()}` : reason;
    setConfirmCancelOpen(true);
  };

  const confirmCancel = async () => {
    const full = note.trim() ? `${reason} — ${note.trim()}` : reason;
    setBusy(true);
    try {
      const updated = await data.cancelOrder(order.id, full);
      view.setData(updated);
      // Refresh the view to recalculate all derived values
      await view.refresh();
      setCancelOpen(false);
      setConfirmCancelOpen(false);
      setNote('');
      toast.success(`${order.code} cancelled.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel that order.');
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
        keyboardShouldPersistTaps="handled"
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
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <OrderProgress order={order} />
          </View>

          <Text style={[TYPE.label, styles.sectionTitle, { color: colors.mutedText }]}>
            Customer
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.personRow}>
              <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
                <Feather name="user" size={17} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text numberOfLines={1} style={[TYPE.label, { color: colors.text }]}>
                  {getFullName()}
                </Text>
                <Text style={[TYPE.caption, styles.tight, { color: colors.mutedText }]}>
                  {getPhone()}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Call the customer"
                hitSlop={8}
                onPress={() => call(getPhone())}
                style={[styles.callBtn, { backgroundColor: colors.accentSoft }]}
              >
                <Feather name="phone" size={16} color={colors.accentText} />
              </Pressable>
            </View>

            <Divider />

            <View style={styles.iconRow}>
              <Feather name="map-pin" size={15} color={colors.faintText} />
              <View style={styles.flex}>
                <Text style={[TYPE.body, { color: colors.text }]}>
                  {getAddressLine1()}
                  {getAddressLine2() ? `, ${getAddressLine2()}` : ''}
                </Text>
                <Text style={[TYPE.caption, styles.tight, { color: colors.mutedText }]}>
                  {getCity()}, {getState()}
                </Text>
              </View>
            </View>

            {!!order.note && (
              <>
                <Divider />
                <View style={styles.iconRow}>
                  <Feather name="message-square" size={15} color={colors.warning} />
                  <Text style={[TYPE.body, styles.flex, { color: colors.text }]}>{order.note}</Text>
                </View>
              </>
            )}
          </View>

          {!!rx && (
            <>
              <Text style={[TYPE.label, styles.sectionTitle, { color: colors.mutedText }]}>
                Prescription
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open the prescription full size"
                onPress={() => setPrescriptionPreviewOpen(true)}
                style={({ pressed }) => [
                  styles.card,
                  styles.rxCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <Image source={{ uri: rx }} style={styles.rxThumb} contentFit="cover" transition={160} />
                <View style={styles.flex}>
                  <Text style={[TYPE.label, { color: colors.text }]}>Uploaded by the customer</Text>
                  <Text style={[TYPE.caption, styles.tight, { color: colors.mutedText }]}>
                    Read it against the pack before you dispense.
                  </Text>
                </View>
                <Feather name="maximize-2" size={16} color={colors.faintText} />
              </Pressable>
            </>
          )}

          <View style={styles.sectionRow}>
            <Text style={[TYPE.label, { color: colors.mutedText }]}>Pick list</Text>
            <Text
              style={[TYPE.caption, { color: allTicked ? colors.accentText : colors.faintText }]}
            >
              {ticked} of {order.items?.length || 0} picked
            </Text>
          </View>
          <View
            style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {(order.items || []).map((item, index) => {
              const on = !!checked[item.id];
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${item.product?.name || item.name_snapshot || 'Item'}, pick ${item.quantity}`}
                  onPress={() => setChecked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                  style={({ pressed }) => [
                    styles.itemRow,
                    index > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: colors.border,
                    },
                    pressed && { backgroundColor: colors.surfaceAlt },
                  ]}
                >
                  <View
                    style={[
                      styles.check,
                      on
                        ? { backgroundColor: colors.accent, borderColor: colors.accent }
                        : { borderColor: colors.border },
                    ]}
                  >
                    {on && <Feather name="check" size={13} color={colors.onAccent} />}
                  </View>
                  <ItemThumb uri={item.image_url_snapshot || item.product?.image_url} />
                  <View style={styles.flex}>
                    <Text
                      numberOfLines={2}
                      style={[TYPE.label, on && styles.struck, { color: colors.text }]}
                    >
                      {item.product?.name || item.name_snapshot || 'Item'}
                    </Text>
                    <Text style={[TYPE.caption, styles.tight, { color: colors.mutedText }]}>
                      {item.pack_size_snapshot ? `${item.pack_size_snapshot} · ` : ''}
                      {formatNaira(item.unit_price_kobo)} each
                    </Text>
                  </View>
                  <View style={[styles.qtyBox, { backgroundColor: colors.surfaceAlt }]}>
                    <Text style={[styles.qtyText, { color: colors.text }]}>×{item.quantity}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {gated && (
            <View style={[styles.hint, { backgroundColor: colors.warningSoft }]}>
              <Feather name="alert-circle" size={14} color={colors.warning} />
              <Text style={[TYPE.caption, styles.flex, { color: colors.warning }]}>
                Tick every line above before you mark this packed.
              </Text>
            </View>
          )}

          <Text style={[TYPE.label, styles.sectionTitle, { color: colors.mutedText }]}>Payment</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <DetailRow label="Subtotal" value={formatNaira(order.subtotal_kobo)} />
            <DetailRow
              label="Delivery"
              value={order.delivery_fee_kobo ? formatNaira(order.delivery_fee_kobo) : 'Free'}
            />
            <Divider />
            <DetailRow
              label="Total"
              value={formatNaira(order.total_kobo, { alwaysDecimals: true })}
              strong
            />
            {!!order.payment && (
              <>
                <Divider />
                <DetailRow
                  label="Paid with"
                  value={
                    order.payment.channel
                      ? `${PAYMENT_LABEL[order.payment.provider]} · ${order.payment.channel}`
                      : PAYMENT_LABEL[order.payment.provider]
                  }
                />
                <DetailRow label="Reference" value={order.payment.provider_ref ?? '—'} />
              </>
            )}
          </View>

          {!!riderName && (
            <>
              <Text style={[TYPE.label, styles.sectionTitle, { color: colors.mutedText }]}>Rider</Text>
              <View
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.personRow}>
                  <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
                    <Feather name="truck" size={17} color={colors.accentText} />
                  </View>
                  <View style={styles.flex}>
                    <Text numberOfLines={1} style={[TYPE.label, { color: colors.text }]}>
                      {riderName}
                    </Text>
                    <Text style={[TYPE.caption, styles.tight, { color: colors.mutedText }]}>
                      {riderPhone ?? order.delivery?.provider ?? 'Assigned'}
                    </Text>
                  </View>
                  {!!riderPhone && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Call the rider"
                      hitSlop={8}
                      onPress={() => call(riderPhone)}
                      style={[styles.callBtn, { backgroundColor: colors.accentSoft }]}
                    >
                      <Feather name="phone" size={16} color={colors.accentText} />
                    </Pressable>
                  )}
                </View>
              </View>
            </>
          )}

          {cancelOpen && (
            <>
              <Text style={[TYPE.label, styles.sectionTitle, { color: colors.danger }]}>
                Why are you cancelling?
              </Text>
              <View
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.danger }]}
              >
                <View style={styles.chips}>
                  {CANCEL_REASONS.map((r) => {
                    const on = reason === r;
                    return (
                      <Pressable
                        key={r}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        onPress={() => setReason(r)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: on ? colors.dangerSoft : colors.surfaceAlt,
                            borderColor: on ? colors.danger : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.chipText, { color: on ? colors.danger : colors.mutedText }]}
                        >
                          {r}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Field
                  label="Anything to add?"
                  placeholder="Optional — the customer sees this"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  style={styles.noteField}
                />
                <GlassButton
                  title="Review cancellation"
                  icon="arrow-right"
                  variant="danger"
                  loading={busy}
                  onPress={submitCancel}
                />
              </View>
            </>
          )}
        </Entrance>
      </ScrollView>

      {(!!next || canCancel) && (
        <StickyBar>
          {!!next && (
            <GlassButton
              title={next.label}
              icon={next.icon}
              variant={next.variant}
              loading={busy}
              disabled={gated}
              onPress={advance}
            />
          )}
          {canCancel && (
            <GlassButton
              title={cancelOpen ? 'Keep this order' : 'Cancel this order'}
              icon={cancelOpen ? 'corner-up-left' : 'x'}
              variant="ghost"
              size="sm"
              onPress={() => setCancelOpen((open) => !open)}
            />
          )}
        </StickyBar>
      )}

      <ConfirmModal
        visible={confirmCancelOpen}
        title="Cancel this order?"
        message={`The customer will be told: "${note.trim() ? `${reason} — ${note.trim()}` : reason}". This cannot be undone.`}
        confirmText="Cancel order"
        cancelText="Keep it"
        destructive
        onConfirm={confirmCancel}
        onCancel={() => setConfirmCancelOpen(false)}
        loading={busy}
      />
      <PrescriptionPreviewModal
        visible={prescriptionPreviewOpen}
        url={rx}
        onClose={() => setPrescriptionPreviewOpen(false)}
      />
    </SafeAreaView>
  );
}

/** Small square product image, with a pill glyph when the snapshot has no URL. */
function ItemThumb({ uri }: { uri: string | null | undefined }) {
  const { colors } = useTheme();
  if (!uri) {
    return (
      <View style={[styles.thumb, styles.thumbEmpty, { backgroundColor: colors.surfaceAlt }]}>
        <Feather name="package" size={15} color={colors.faintText} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={[styles.thumb, { backgroundColor: colors.surfaceAlt }]}
      contentFit="cover"
      transition={160}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tight: { marginTop: 2 },
  gutter: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.md },
  scroll: { paddingHorizontal: SPACE.xl, paddingBottom: SPACE.xxl },
  card: { padding: SPACE.lg, borderRadius: RADIUS.lg, borderWidth: 1 },
  sectionTitle: { marginTop: SPACE.xl, marginBottom: SPACE.md },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACE.xl,
    marginBottom: SPACE.md,
  },

  personRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.md },

  rxCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  rxThumb: { width: 54, height: 54, borderRadius: RADIUS.sm },

  listCard: { borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, padding: SPACE.lg },
  check: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm - 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  struck: { textDecorationLine: 'line-through' },
  thumb: { width: 40, height: 40, borderRadius: RADIUS.sm },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  qtyBox: { paddingHorizontal: SPACE.sm + 2, paddingVertical: 5, borderRadius: RADIUS.sm },
  qtyText: { fontSize: 13, fontWeight: '900' },

  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    marginTop: SPACE.md,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  chip: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 12.5, fontWeight: '700' },
  noteField: { marginTop: SPACE.lg, marginBottom: SPACE.lg },
});
