/**
 * Delivery addresses. Reached from Account and from Checkout's "Manage
 * addresses" link, so it has to work as both a browsing screen and a quick
 * add-one-and-go detour.
 *
 * The form is a bottom sheet rather than a second route: adding an address is
 * almost always a two-field correction to something the customer half-remembers,
 * and pushing a screen for that loses the list they were comparing against.
 */
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACE, TYPE, isNigerianPhone, normalizeNigerianPhone } from '@pharmago/shared';
import type { Address } from '@pharmago/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  ScreenHeader,
  StatusPill,
} from '@/src/components';
import { useAsync } from '@/src/hooks/useAsync';
import { data } from '@/src/lib/data';
import { useToast } from '@/src/state/ToastProvider';
import { useTheme } from '@/src/theme';

/** Everything the form collects. */
type Draft = {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
};

const EMPTY: Draft = {
  full_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: 'Lagos',
  postal_code: '',
  is_default: false,
};

const QUICK_LABELS = ['Home', 'Office', 'Other'];

function draftFrom(address: Address): Draft {
  return {
    full_name: address.full_name,
    phone: address.phone ?? '',
    address_line1: address.address_line1,
    address_line2: address.address_line2 ?? '',
    city: address.city,
    state: address.state,
    postal_code: address.postal_code ?? '',
    is_default: address.is_default,
  };
}

export default function AddressesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();

  const view = useAsync(() => data.addresses(), []);
  const list = view.data ?? [];

  const [editing, setEditing] = useState<Address | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const openNew = () => {
    setEditing(null);
    setDraft({ ...EMPTY, is_default: list.length === 0 });
    setErrors({});
    setSheetOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditing(address);
    setDraft(draftFrom(address));
    setErrors({});
    setSheetOpen(true);
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof Draft, string>> = {};
    if (!draft.full_name.trim()) next.full_name = 'Who should the rider ask for?';
    if (!draft.phone.trim()) next.phone = 'A number the rider can call.';
    else if (!isNigerianPhone(draft.phone)) next.phone = 'That does not look like a phone number.';
    if (!draft.address_line1.trim()) next.address_line1 = 'Street and house number.';
    if (!draft.city.trim()) next.city = 'Which area?';
    if (!draft.state.trim()) next.state = 'Which state?';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      full_name: draft.full_name.trim(),
      phone: normalizeNigerianPhone(draft.phone),
      address_line1: draft.address_line1.trim(),
      address_line2: draft.address_line2.trim() || null,
      city: draft.city.trim(),
      state: draft.state.trim(),
      postal_code: draft.postal_code.trim() || null,
      country: 'Nigeria',
      is_default: draft.is_default,
    };

    try {
      if (editing) await data.updateAddress(editing.id, payload);
      else await data.createAddress(payload);
      setSheetOpen(false);
      toast.success(editing ? 'Address updated.' : 'Address saved.');
      await view.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'That address could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (address: Address) => {
    try {
      await data.updateAddress(address.id, { is_default: true });
      toast.success('That address is now your default.');
      await view.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not change your default address.');
    }
  };

  const confirmRemove = (address: Address) => {
    Alert.alert(
      'Remove this address?',
      'Orders already placed keep the address they were sent to.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await data.removeAddress(address.id);
              toast.success('Address removed.');
              await view.reload();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Could not remove that address.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.gutter}>
        <ScreenHeader
          title="Delivery addresses"
          subtitle={list.length ? `${list.length} saved` : 'Where we bring your orders'}
          onBack={() => router.back()}
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add an address"
              hitSlop={8}
              onPress={openNew}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="plus" size={18} color={colors.onPrimary} />
            </Pressable>
          }
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
        {view.loading ? (
          <Loading label="Loading your addresses…" />
        ) : view.error && !list.length ? (
          <EmptyState
            icon="wifi-off"
            title="Could not load addresses"
            message={view.error}
            actionLabel="Try again"
            onAction={() => void view.reload()}
          />
        ) : !list.length ? (
          <EmptyState
            icon="map-pin"
            title="No addresses yet"
            message="Add the place you want your medicines delivered to. You can save as many as you need."
            actionLabel="Add an address"
            onAction={openNew}
          />
        ) : (
          list.map((address, index) => (
            <Entrance key={address.id} delay={index * 55} distance={10}>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: address.is_default ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.pin, { backgroundColor: colors.primarySoft }]}>
                    <Feather name="map-pin" size={16} color={colors.primary} />
                  </View>
                  <View style={styles.flex}>
                    <View style={styles.titleRow}>
                      <Text style={[TYPE.label, { color: colors.text }]}>
                        {address.full_name}
                      </Text>
                      {address.is_default && <StatusPill label="Default" tone="info" />}
                    </View>
                    <Text style={[TYPE.caption, styles.lines, { color: colors.mutedText }]}>
                      {[address.address_line1, address.address_line2, address.city, address.state]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                    <Text style={[TYPE.caption, { color: colors.faintText }]}>
                      {address.phone}
                    </Text>
                  </View>
                </View>

                <Divider style={styles.cardDivider} />

                <View style={styles.tools}>
                  {!address.is_default && (
                    <Pressable
                      accessibilityRole="button"
                      hitSlop={6}
                      onPress={() => void makeDefault(address)}
                      style={styles.tool}
                    >
                      <Feather name="check-circle" size={14} color={colors.primary} />
                      <Text style={[TYPE.caption, { color: colors.primary }]}>Set as default</Text>
                    </Pressable>
                  )}
                  <View style={styles.flex} />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${address.full_name}`}
                    hitSlop={6}
                    onPress={() => openEdit(address)}
                    style={styles.tool}
                  >
                    <Feather name="edit-2" size={14} color={colors.mutedText} />
                    <Text style={[TYPE.caption, { color: colors.mutedText }]}>Edit</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${address.full_name}`}
                    hitSlop={6}
                    onPress={() => confirmRemove(address)}
                    style={styles.tool}
                  >
                    <Feather name="trash-2" size={14} color={colors.danger} />
                    <Text style={[TYPE.caption, { color: colors.danger }]}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            </Entrance>
          ))
        )}
      </ScrollView>

      <Modal
        visible={sheetOpen}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setSheetOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.backdropTap}
            onPress={() => setSheetOpen(false)}
          />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.sheet, { backgroundColor: colors.background }]}>
              <View style={[styles.grabber, { backgroundColor: colors.border }]} />
              <Text style={[TYPE.title, styles.sheetTitle, { color: colors.text }]}>
                {editing ? 'Edit address' : 'New address'}
              </Text>

              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetBody}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Field
                  label="Full Name"
                  icon="user"
                  placeholder="John Doe"
                  autoCapitalize="words"
                  value={draft.full_name}
                  error={errors.full_name}
                  onChangeText={(t) => set('full_name', t)}
                  style={styles.field}
                />
                <Field
                  label="Phone"
                  icon="phone"
                  placeholder="08012345678"
                  keyboardType="phone-pad"
                  value={draft.phone}
                  error={errors.phone}
                  onChangeText={(t) => set('phone', t)}
                  style={styles.field}
                />
                <Field
                  label="Street Address"
                  icon="home"
                  placeholder="14B Admiralty Way"
                  value={draft.address_line1}
                  error={errors.address_line1}
                  onChangeText={(t) => set('address_line1', t)}
                  style={styles.field}
                />
                <Field
                  label="Apartment or Floor (Optional)"
                  placeholder="Flat 3, Floor 2"
                  value={draft.address_line2}
                  onChangeText={(t) => set('address_line2', t)}
                  style={styles.field}
                />
                <View style={styles.pair}>
                  <Field
                    label="City"
                    placeholder="Lekki Phase 1"
                    autoCapitalize="words"
                    value={draft.city}
                    error={errors.city}
                    onChangeText={(t) => set('city', t)}
                    style={styles.flex}
                  />
                  <Field
                    label="State"
                    placeholder="Lagos"
                    autoCapitalize="words"
                    value={draft.state}
                    error={errors.state}
                    onChangeText={(t) => set('state', t)}
                    style={styles.flex}
                  />
                </View>
                <Field
                  label="Postal Code (Optional)"
                  placeholder="100001"
                  value={draft.postal_code}
                  onChangeText={(t) => set('postal_code', t)}
                  style={styles.field}
                />

                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: draft.is_default }}
                  onPress={() => set('is_default', !draft.is_default)}
                  style={[
                    styles.defaultRow,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.check,
                      {
                        backgroundColor: draft.is_default ? colors.primary : 'transparent',
                        borderColor: draft.is_default ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {draft.is_default && <Feather name="check" size={13} color={colors.onPrimary} />}
                  </View>
                  <View style={styles.flex}>
                    <Text style={[TYPE.label, { color: colors.text }]}>Use as my default</Text>
                    <Text style={[TYPE.caption, { color: colors.faintText }]}>
                      Preselected at checkout
                    </Text>
                  </View>
                </Pressable>
              </ScrollView>

              <View style={styles.sheetActions}>
                <GlassButton
                  title="Cancel"
                  variant="ghost"
                  disabled={saving}
                  onPress={() => setSheetOpen(false)}
                  style={styles.flex}
                />
                <GlassButton
                  title={editing ? 'Save changes' : 'Save address'}
                  icon="check"
                  loading={saving}
                  onPress={save}
                  style={styles.flex}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gutter: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.md },
  scroll: { paddingHorizontal: SPACE.xl, paddingBottom: SPACE.xxl },

  addBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    padding: SPACE.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACE.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.md },
  pin: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  lines: { marginTop: 3, marginBottom: 2, lineHeight: 17 },
  cardDivider: { marginVertical: SPACE.md },
  tools: { flexDirection: 'row', alignItems: 'center', gap: SPACE.lg },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(8,15,26,0.5)' },
  backdropTap: { flex: 1 },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.md,
    paddingBottom: SPACE.xl,
  },
  grabber: {
    width: 42,
    height: 4,
    borderRadius: RADIUS.pill,
    alignSelf: 'center',
    marginBottom: SPACE.md,
  },
  sheetTitle: { marginBottom: SPACE.lg },
  sheetScroll: { flexGrow: 0 },
  sheetBody: { paddingBottom: SPACE.md },

  fieldLabel: { marginBottom: 6 },
  labelRow: { flexDirection: 'row', gap: SPACE.sm, marginBottom: SPACE.md },
  labelChip: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  field: { marginBottom: SPACE.md },
  pair: { flexDirection: 'row', gap: SPACE.md, marginBottom: SPACE.md },

  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sheetActions: { flexDirection: 'row', gap: SPACE.md, marginTop: SPACE.lg },
});
