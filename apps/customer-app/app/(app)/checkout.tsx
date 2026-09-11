/**
 * Checkout. Address → prescription → review → place.
 *
 * The amounts on this screen are a preview: `POST /api/orders` recomputes the
 * subtotal from `products.price_kobo` and re-quotes delivery server-side, so what
 * is charged never depends on what the client believed.
 */
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACE, TYPE, formatNaira } from '@pharmago/shared';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DetailRow,
  Divider,
  Entrance,
  GlassButton,
  ScreenHeader,
  Skeleton,
  StickyBar,
} from '@/src/components';
import { useAsync } from '@/src/hooks/useAsync';
import { data } from '@/src/lib/data';
import { uploadPrescription } from '@/src/lib/uploads';
import { useCart } from '@/src/state/CartProvider';
import { useToast } from '@/src/state/ToastProvider';
import { useTheme } from '@/src/theme';

export default function Checkout() {
  const router = useRouter();
  const { colors } = useTheme();
  const cart = useCart();
  const toast = useToast();

  const [addressId, setAddressId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [rxUri, setRxUri] = useState<string | null>(null);
  const [rxUrl, setRxUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [placing, setPlacing] = useState(false);

  const addresses = useAsync(() => data.addresses(), []);

  // Preselect the default address as soon as the list lands.
  useEffect(() => {
    if (addressId || !addresses.data?.length) return;
    setAddressId((addresses.data.find((a) => a.is_default) ?? addresses.data[0]).id);
  }, [addresses.data, addressId]);

  const quote = useAsync(
    () =>
      addressId
        ? data.deliveryQuote(addressId, cart.subtotalKobo)
        : Promise.resolve(null),
    [addressId, cart.subtotalKobo],
  );

  const deliveryFee = quote.data?.fee_kobo ?? 0;
  const total = cart.subtotalKobo + deliveryFee;
  const rxMissing = cart.requiresPrescription && !rxUrl;

  const pick = async (from: 'camera' | 'library') => {
    const permission =
      from === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      toast.error(
        from === 'camera'
          ? 'Camera access is needed to photograph your prescription.'
          : 'Photo access is needed to attach your prescription.',
      );
      return;
    }

    const result =
      from === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.7, mediaTypes: 'images' })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: 'images' });

    if (result.canceled) return;
    const asset = result.assets[0];

    setRxUri(asset.uri);
    setUploading(true);
    try {
      const url = await uploadPrescription({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
      setRxUrl(url);
      toast.success('Prescription attached.');
    } catch (err) {
      setRxUri(null);
      toast.error(err instanceof Error ? err.message : 'That upload did not go through.');
    } finally {
      setUploading(false);
    }
  };

  const attach = () => {
    Alert.alert('Attach prescription', 'A clear photo of the whole page works best.', [
      { text: 'Take a photo', onPress: () => void pick('camera') },
      { text: 'Choose from library', onPress: () => void pick('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const place = async () => {
    if (!addressId) {
      toast.error('Choose where we should deliver first.');
      return;
    }
    if (rxMissing) {
      toast.error('Attach your prescription before placing this order.');
      return;
    }

    setPlacing(true);
    try {
      const { order, payment_url } = await data.createOrder({
        address_id: addressId,
        items: cart.lines.map((l) => ({ product_id: l.product_id, qty: l.qty })),
        note: note.trim() || undefined,
        prescription_url: rxUrl ?? undefined,
      });
      cart.clear();
      if (payment_url) await WebBrowser.openBrowserAsync(payment_url);
      router.replace(`/(app)/order/${order.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'We could not place that order.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.gutter}>
        <ScreenHeader
          title="Checkout"
          subtitle={`${cart.count} ${cart.count === 1 ? 'item' : 'items'} · ${formatNaira(total)}`}
          onBack={() => router.back()}
        />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Entrance>
          <Section title="Deliver to" step={1}>
            {addresses.loading ? (
              <>
                <Skeleton height={72} radius={RADIUS.md} />
                <Skeleton height={72} radius={RADIUS.md} style={styles.gapSm} />
              </>
            ) : !addresses.data?.length ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(app)/addresses')}
                style={[styles.addRow, { borderColor: colors.primary }]}
              >
                <Feather name="plus-circle" size={18} color={colors.primary} />
                <Text style={[TYPE.label, { color: colors.primary }]}>Add a delivery address</Text>
              </Pressable>
            ) : (
              <>
                {addresses.data.map((a) => {
                  const active = a.id === addressId;
                  return (
                    <Pressable
                      key={a.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      onPress={() => setAddressId(a.id)}
                      style={[
                        styles.address,
                        {
                          backgroundColor: active ? colors.primarySoft : colors.surface,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.radio,
                          { borderColor: active ? colors.primary : colors.border },
                        ]}
                      >
                        {active && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                      </View>
                      <View style={styles.flex}>
                        <View style={styles.addressTop}>
                          <Text style={[TYPE.label, { color: colors.text }]}>
                            {a.label ?? 'Address'}
                          </Text>
                          {a.is_default && (
                            <Text style={[styles.defaultTag, { color: colors.accentText }]}>
                              DEFAULT
                            </Text>
                          )}
                        </View>
                        <Text style={[TYPE.caption, styles.addressLine, { color: colors.mutedText }]}>
                          {[a.line1, a.line2, a.city, a.state].filter(Boolean).join(', ')}
                        </Text>
                        <Text style={[TYPE.caption, { color: colors.faintText }]}>
                          {a.recipient_name} · {a.phone}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
                <Pressable
                  accessibilityRole="button"
                  hitSlop={6}
                  onPress={() => router.push('/(app)/addresses')}
                  style={styles.manageLink}
                >
                  <Feather name="settings" size={13} color={colors.primary} />
                  <Text style={[TYPE.caption, { color: colors.primary }]}>Manage addresses</Text>
                </Pressable>
              </>
            )}
          </Section>

          {cart.requiresPrescription && (
            <Section title="Prescription" step={2}>
              <Text style={[TYPE.caption, styles.sectionNote, { color: colors.mutedText }]}>
                Your cart includes items we can only dispense against a prescription. A licensed
                pharmacist reviews your upload before the order is packed.
              </Text>
              {rxUri ? (
                <View style={[styles.rxCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Image source={{ uri: rxUri }} style={styles.rxThumb} contentFit="cover" />
                  <View style={styles.flex}>
                    <Text style={[TYPE.label, { color: colors.text }]}>
                      {uploading ? 'Uploading…' : 'Prescription attached'}
                    </Text>
                    <Text style={[TYPE.caption, { color: colors.faintText }]}>
                      {uploading ? 'Hold on a moment' : 'Tap to replace'}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Replace prescription"
                    hitSlop={8}
                    onPress={attach}
                    style={[styles.replaceBtn, { backgroundColor: colors.surfaceAlt }]}
                  >
                    <Feather name="refresh-cw" size={15} color={colors.primary} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={attach}
                  style={[styles.upload, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
                >
                  <Feather name="camera" size={22} color={colors.primary} />
                  <Text style={[TYPE.label, { color: colors.primary }]}>Attach prescription</Text>
                  <Text style={[TYPE.caption, { color: colors.mutedText }]}>
                    Photo or scan · JPG, PNG or PDF
                  </Text>
                </Pressable>
              )}
            </Section>
          )}

          <Section title="Delivery note" step={cart.requiresPrescription ? 3 : 2} optional>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={200}
              placeholder="Landmark, gate code, or “call before you arrive”"
              placeholderTextColor={colors.faintText}
              style={[
                styles.note,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text },
              ]}
            />
          </Section>

          <Section title="Order summary" step={cart.requiresPrescription ? 4 : 3}>
            <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {cart.lines.map((l) => (
                <DetailRow
                  key={l.product_id}
                  label={`${l.name} × ${l.qty}`}
                  value={formatNaira(l.unit_price_kobo * l.qty)}
                />
              ))}
              <Divider />
              <DetailRow label="Subtotal" value={formatNaira(cart.subtotalKobo)} />
              <DetailRow
                label={
                  quote.data?.distance_km
                    ? `Delivery · ${quote.data.distance_km} km`
                    : 'Delivery'
                }
                value={
                  quote.loading
                    ? 'Calculating…'
                    : deliveryFee === 0
                      ? (quote.data?.free_reason ?? 'Free')
                      : formatNaira(deliveryFee)
                }
                valueColor={deliveryFee === 0 ? colors.accentText : undefined}
              />
              <Divider />
              <DetailRow label="Total" value={formatNaira(total)} strong />
              {!!quote.data?.eta_minutes && (
                <Text style={[TYPE.caption, styles.eta, { color: colors.mutedText }]}>
                  Estimated arrival in about {quote.data.eta_minutes} minutes after the pharmacy
                  confirms.
                </Text>
              )}
            </View>
          </Section>
        </Entrance>
      </ScrollView>

      <StickyBar>
        <View style={styles.totalRow}>
          <Text style={[TYPE.label, { color: colors.mutedText }]}>Total to pay</Text>
          <Text style={[styles.total, { color: colors.text }]}>{formatNaira(total)}</Text>
        </View>
        <GlassButton
          title={rxMissing ? 'Attach prescription to continue' : 'Place order'}
          icon={rxMissing ? 'file-text' : 'check-circle'}
          variant={rxMissing ? 'glass' : 'accent'}
          loading={placing}
          disabled={!addressId || uploading}
          onPress={rxMissing ? attach : place}
        />
      </StickyBar>
    </SafeAreaView>
  );
}

/** Numbered block. The step number makes a long form feel finite. */
function Section({
  title,
  step,
  optional = false,
  children,
}: {
  title: string;
  step: number;
  optional?: boolean;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={[styles.step, { backgroundColor: colors.primary }]}>
          <Text style={[styles.stepText, { color: colors.onPrimary }]}>{step}</Text>
        </View>
        <Text style={[TYPE.heading, { color: colors.text }]}>{title}</Text>
        {optional && (
          <Text style={[TYPE.caption, { color: colors.faintText }]}>Optional</Text>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gutter: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.md },
  scroll: { paddingHorizontal: SPACE.xl, paddingBottom: SPACE.xl },
  gapSm: { marginTop: SPACE.sm },

  section: { marginBottom: SPACE.xxl },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.md },
  step: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 11.5, fontWeight: '900' },
  sectionNote: { lineHeight: 17, marginBottom: SPACE.md },

  address: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.md,
    padding: SPACE.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACE.sm,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioDot: { width: 9, height: 9, borderRadius: RADIUS.pill },
  addressTop: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  addressLine: { marginTop: 3, lineHeight: 17 },
  defaultTag: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.6 },
  manageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingVertical: SPACE.sm,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    minHeight: 62,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },

  upload: {
    alignItems: 'center',
    gap: 5,
    paddingVertical: SPACE.xl,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  rxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  rxThumb: { width: 52, height: 52, borderRadius: RADIUS.sm },
  replaceBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  note: {
    minHeight: 88,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    fontSize: 14.5,
    fontWeight: '500',
    lineHeight: 20,
    textAlignVertical: 'top',
  },

  summary: { padding: SPACE.lg, borderRadius: RADIUS.lg, borderWidth: 1 },
  eta: { marginTop: SPACE.md, lineHeight: 17 },

  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  total: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
});
