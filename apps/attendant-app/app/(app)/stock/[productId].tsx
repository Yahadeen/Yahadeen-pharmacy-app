/**
 * Stock edit — one product, one number that has to match the shelf.
 *
 * The field holds an **absolute** count, not a delta, because that is what an
 * attendant reads off the box in front of them. The signed movement is derived
 * (`new − current`) and shown before saving, so the write is never a surprise.
 * Quick ±chips are there for the common cases; the keypad is there for the
 * fifty-carton delivery.
 *
 * Every save is a `stock_movements` row with a reason and the attendant's id —
 * the history card below is that same log, which is why nothing here silently
 * overwrites a count.
 */
import { Feather } from '@expo/vector-icons';
import {
  RADIUS,
  SPACE,
  STOCK_STATE_META,
  TYPE,
  formatNaira,
  stockState,
  type StockMovement,
} from '@pharmago/shared';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Divider,
  EmptyState,
  Entrance,
  Field,
  GlassButton,
  Loading,
  MOVEMENT_META,
  MOVEMENT_REASONS as REASONS,
  MovementRow,
  ScreenHeader,
  StatusPill,
  StickyBar,
  StockMeter,
} from '@/src/components';
import { useAsync } from '@/src/hooks/useAsync';
import { data } from '@/src/lib/data';
import { useToast } from '@/src/state/ToastProvider';
import { useTheme } from '@/src/theme';

const PLACEHOLDER = require('../../../assets/images/logo.png');

/** Counter-sized adjustments; anything else goes through the keypad. */
const BUMPS = [-10, -1, 1, 10, 50];

export default function StockEdit() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();

  const view = useAsync(() => data.product(productId), [productId]);
  const history = useAsync(() => data.stockMovements(productId), [productId]);

  const [qty, setQty] = useState('');
  const [reason, setReason] = useState<StockMovement['reason']>('correction');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const product = view.data;

  // The field mirrors the saved count — including straight after a save, which
  // is what clears the pending delta.
  useEffect(() => {
    if (product) setQty(String(product.quantity));
  }, [product?.id, product?.quantity]);

  if (view.loading) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <Loading label="Checking the shelf…" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="alert-circle"
          title="Product not found"
          message={view.error ?? 'That product is no longer on the shelf.'}
          actionLabel="Back to inventory"
          onAction={() => router.replace('/(app)/(tabs)/inventory')}
        />
      </SafeAreaView>
    );
  }

  const state = stockState(product.quantity, product.low_stock_threshold);
  const stateMeta = STOCK_STATE_META[state];
  const parsed = Number.parseInt(qty, 10);
  const valid = Number.isFinite(parsed) && parsed >= 0;
  const delta = valid ? parsed - product.quantity : 0;
  const changed = valid && delta !== 0;
  const moves = history.data ?? [];

  const bump = (by: number) => {
    const from = Number.isFinite(parsed) ? parsed : product.quantity;
    setQty(String(Math.max(0, from + by)));
  };

  const save = async () => {
    if (!changed) return;
    setBusy(true);
    try {
      const updated = await data.setStock(product.id, {
        quantity: parsed,
        reason,
        note: note.trim() || undefined,
      });
      view.setData(updated);
      setNote('');
      void history.refresh();
      toast.success(`${updated.name}: ${updated.quantity} on the shelf.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save that count.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.gutter}>
        <ScreenHeader
          title={product.name}
          subtitle={product.pack_size ?? product.brand ?? 'On the shelf'}
          onBack={() => router.back()}
          right={<StatusPill label={stateMeta.label} tone={stateMeta.tone} />}
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
          <View
            style={[
              styles.card,
              styles.productCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
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
            <View style={styles.flex}>
              <Text numberOfLines={2} style={[TYPE.heading, { color: colors.text }]}>
                {product.name}
              </Text>
              <Text
                numberOfLines={1}
                style={[TYPE.caption, styles.tight, { color: colors.mutedText }]}
              >
                {product.generic_name ?? product.brand ?? '—'} · {formatNaira(product.price_kobo)}
              </Text>
              {product.requires_prescription && (
                <View style={[styles.rxTag, { backgroundColor: colors.primarySoft }]}>
                  <Feather name="file-text" size={10} color={colors.primary} />
                  <Text style={[styles.rxText, { color: colors.primary }]}>Prescription only</Text>
                </View>
              )}
            </View>
          </View>

          <View
            style={[
              styles.card,
              styles.stack,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <StockMeter quantity={product.quantity} threshold={product.low_stock_threshold} />
          </View>

          <Text style={[TYPE.label, styles.sectionTitle, { color: colors.mutedText }]}>
            Correct the count
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Field
              label="Units on the shelf"
              icon="hash"
              value={qty}
              onChangeText={(text) => setQty(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              returnKeyType="done"
              selectTextOnFocus
              error={qty.length > 0 && !valid ? 'Enter a whole number of units.' : null}
            />

            <View style={styles.bumps}>
              {BUMPS.map((by) => (
                <Pressable
                  key={by}
                  accessibilityRole="button"
                  accessibilityLabel={`Adjust by ${by}`}
                  onPress={() => bump(by)}
                  style={({ pressed }) => [
                    styles.bump,
                    {
                      backgroundColor: pressed ? colors.surfaceStrong : colors.surfaceAlt,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.bumpText, { color: by > 0 ? colors.accentText : colors.danger }]}
                  >
                    {by > 0 ? `+${by}` : by}
                  </Text>
                </Pressable>
              ))}
            </View>

            {changed && (
              <View
                style={[
                  styles.delta,
                  { backgroundColor: delta > 0 ? colors.accentSoft : colors.dangerSoft },
                ]}
              >
                <Feather
                  name={delta > 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={delta > 0 ? colors.accentText : colors.danger}
                />
                <Text
                  style={[
                    TYPE.caption,
                    styles.flex,
                    { color: delta > 0 ? colors.accentText : colors.danger },
                  ]}
                >
                  {product.quantity} → {parsed} · {delta > 0 ? `+${delta}` : delta}{' '}
                  {Math.abs(delta) === 1 ? 'unit' : 'units'}
                </Text>
              </View>
            )}
          </View>

          <Text style={[TYPE.label, styles.sectionTitle, { color: colors.mutedText }]}>
            Why did it change?
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.chips}>
              {REASONS.map((r) => {
                const on = reason === r;
                const rm = MOVEMENT_META[r];
                return (
                  <Pressable
                    key={r}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => setReason(r)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: on ? colors.primarySoft : colors.surfaceAlt,
                        borderColor: on ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Feather
                      name={rm.icon}
                      size={12}
                      color={on ? colors.primary : colors.mutedText}
                    />
                    <Text
                      style={[styles.chipText, { color: on ? colors.primary : colors.mutedText }]}
                    >
                      {rm.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Field
              label="Note"
              placeholder="Optional — batch number, invoice, who counted"
              value={note}
              onChangeText={setNote}
              style={styles.noteField}
            />
          </View>

          <Text style={[TYPE.label, styles.sectionTitle, { color: colors.mutedText }]}>
            Movement history
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {history.loading ? (
              <Text style={[TYPE.caption, { color: colors.faintText }]}>Loading the log…</Text>
            ) : moves.length === 0 ? (
              <Text style={[TYPE.caption, { color: colors.faintText }]}>
                No movement recorded yet. Your first correction will show up here.
              </Text>
            ) : (
              moves.map((movement, index) => (
                <View key={movement.id}>
                  {index > 0 && <Divider />}
                  <MovementRow movement={movement} />
                </View>
              ))
            )}
          </View>

          <Text style={[TYPE.caption, styles.footnote, { color: colors.faintText }]}>
            Counts are shared with the customer app the moment you save, so an item that
            reaches zero stops selling straight away.
          </Text>
        </Entrance>
      </ScrollView>

      <StickyBar>
        <GlassButton
          title={changed ? `Save ${delta > 0 ? `+${delta}` : delta}` : 'Nothing to save'}
          icon="save"
          variant="accent"
          loading={busy}
          disabled={!changed}
          onPress={save}
        />
      </StickyBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tight: { marginTop: 3 },
  gutter: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.md },
  scroll: { paddingHorizontal: SPACE.xl, paddingBottom: SPACE.xxl },
  card: { padding: SPACE.lg, borderRadius: RADIUS.lg, borderWidth: 1 },
  stack: { marginTop: SPACE.md },
  sectionTitle: { marginTop: SPACE.xl, marginBottom: SPACE.md },

  productCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  thumbBox: { width: 64, height: 64, borderRadius: RADIUS.md, overflow: 'hidden', padding: 5 },
  thumb: { flex: 1 },
  rxTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  rxText: { fontSize: 10.5, fontWeight: '900', letterSpacing: 0.3 },

  bumps: { flexDirection: 'row', gap: SPACE.sm, marginTop: SPACE.md },
  bump: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  bumpText: { fontSize: 13.5, fontWeight: '900' },
  delta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    marginTop: SPACE.md,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 12.5, fontWeight: '700' },
  noteField: { marginTop: SPACE.lg },

  footnote: { marginTop: SPACE.lg, textAlign: 'center', lineHeight: 17 },
});
