/**
 * Account tab. Who is at the counter, what they have handled, appearance and
 * sign-out. No addresses and no cart — a staff account owns none of that.
 */
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACE, TYPE, type OrderStatus, type UserRole } from '@pharmago/shared';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ConfirmModal, Entrance, GlassButton, Screen, ScreenHeader, type FeatherName } from '@/src/components';
import { useAsync } from '@/src/hooks/useAsync';
import { DEMO_MODE, data } from '@/src/lib/data';
import { useSession } from '@/src/state/SessionProvider';
import { useTheme, type ThemeMode } from '@/src/theme';

const MODES: { key: ThemeMode; label: string; icon: FeatherName }[] = [
  { key: 'system', label: 'System', icon: 'smartphone' },
  { key: 'light', label: 'Light', icon: 'sun' },
  { key: 'dark', label: 'Dark', icon: 'moon' },
];

const ROLE_LABEL: Record<UserRole, string> = {
  customer: 'Customer',
  attendant: 'Attendant',
  admin: 'Pharmacy admin',
  super_admin: 'Owner',
};

/** Everything still on the counter's plate — used for the open-orders tile. */
const OPEN_AT_COUNTER: readonly OrderStatus[] = [
  'paid',
  'confirmed',
  'preparing',
  'packed',
  'ready_for_pickup',
  'picked_up',
  'out_for_delivery',
];

function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'PG';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function Account() {
  const router = useRouter();
  const { colors, mode, setMode } = useTheme();
  const { profile, user, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const orders = useAsync(async () => (await data.orders()).items, []);
  // Order summaries carry no attendant id, so these are counter-wide numbers
  // rather than personal ones — honest with what the list endpoint returns.
  const all = orders.data ?? [];
  const openNow = all.filter((o) => OPEN_AT_COUNTER.includes(o.status)).length;
  const completed = all.filter((o) => o.status === 'delivered').length;

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      setLogoutModalVisible(false);
    } finally {
      setBusy(false);
    }
  };

  const rows: { icon: FeatherName; label: string; hint?: string; onPress: () => void }[] = [
    {
      icon: 'bell',
      label: 'Notifications',
      hint: 'New orders and low-stock alerts',
      onPress: () => router.push('/(app)/notifications'),
    },
    {
      icon: 'package',
      label: 'Inventory',
      hint: 'Correct counts and see movement history',
      onPress: () => router.push('/(app)/(tabs)/inventory'),
    },
    {
      icon: 'list',
      label: 'Back to the queue',
      onPress: () => router.push('/(app)/(tabs)'),
    },
  ];

  return (
    <Screen scroll tabBarPadding>
      <ScreenHeader title="Account" subtitle="You, and how the app behaves" />

      <Entrance>
        <View
          style={[
            styles.profile,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={[styles.avatar, styles.avatarImage]}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                {initials(profile?.full_name)}
              </Text>
            </View>
          )}
          <View style={styles.flex}>
            <Text numberOfLines={1} style={[TYPE.heading, { color: colors.text }]}>
              {profile?.full_name ?? 'Yahadeen Staff'}
            </Text>
            <Text
              numberOfLines={1}
              style={[TYPE.caption, styles.profileMeta, { color: colors.mutedText }]}
            >
              {profile?.email ?? user?.email ?? '—'}
            </Text>
            {!!profile?.role && (
              <View style={[styles.roleTag, { backgroundColor: colors.primarySoft }]}>
                <Feather name="shield" size={10} color={colors.primary} />
                <Text style={[styles.roleText, { color: colors.primary }]}>
                  {ROLE_LABEL[profile.role]}
                </Text>
              </View>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            hitSlop={8}
            onPress={() => router.push('/(app)/profile-edit')}
            style={[styles.editBtn, { backgroundColor: colors.primarySoft }]}
          >
            <Feather name="edit-2" size={15} color={colors.primary} />
          </Pressable>
        </View>
      </Entrance>

      <View style={styles.stats}>
        <Stat label="Open at the counter" value={openNow} icon="clock" tone={colors.warning} />
        <Stat label="Delivered" value={completed} icon="check-circle" tone={colors.accentText} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {rows.map((row, index) => (
          <Pressable
            key={row.label}
            accessibilityRole="button"
            onPress={row.onPress}
            style={({ pressed }) => [
              styles.row,
              index > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: colors.border,
              },
              pressed && { backgroundColor: colors.surfaceAlt },
            ]}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.surfaceAlt }]}>
              <Feather name={row.icon} size={17} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={[TYPE.label, { color: colors.text }]}>{row.label}</Text>
              {!!row.hint && (
                <Text style={[TYPE.caption, styles.rowHint, { color: colors.faintText }]}>
                  {row.hint}
                </Text>
              )}
            </View>
            <Feather name="chevron-right" size={18} color={colors.faintText} />
          </Pressable>
        ))}
      </View>

      <Text style={[TYPE.label, styles.sectionLabel, { color: colors.mutedText }]}>Appearance</Text>
      <View style={styles.modes}>
        {MODES.map((m) => {
          const active = mode === m.key;
          return (
            <Pressable
              key={m.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setMode(m.key)}
              style={[
                styles.mode,
                {
                  backgroundColor: active ? colors.primarySoft : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Feather name={m.icon} size={17} color={active ? colors.primary : colors.mutedText} />
              <Text style={[TYPE.caption, { color: active ? colors.primary : colors.mutedText }]}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <GlassButton
        title="Sign out"
        icon="log-out"
        variant="ghost"
        loading={busy}
        onPress={() => setLogoutModalVisible(true)}
        style={styles.signOut}
      />

      <ConfirmModal
        visible={logoutModalVisible}
        title="Sign out?"
        message="You will need your work email and password to open the counter again."
        confirmText="Sign out"
        cancelText="Cancel"
        destructive={true}
        onConfirm={handleSignOut}
        onCancel={() => setLogoutModalVisible(false)}
        loading={busy}
      />

      <View style={styles.footer}>
        <Text style={[TYPE.caption, { color: colors.faintText }]}>
          Yahadeen Staff v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
        {DEMO_MODE && (
          <View style={[styles.demoTag, { backgroundColor: colors.warningSoft }]}>
            <Feather name="alert-circle" size={11} color={colors.warning} />
            <Text style={[styles.demoText, { color: colors.warning }]}>Demo data</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

/** Two-up counter tile — the only numbers a shift actually cares about. */
function Stat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: FeatherName;
  tone: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Feather name={icon} size={16} color={tone} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[TYPE.caption, { color: colors.mutedText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    padding: SPACE.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.pill,
  },
  avatarText: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  profileMeta: { marginTop: 3 },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  roleText: { fontSize: 10.5, fontWeight: '900', letterSpacing: 0.4 },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stats: { flexDirection: 'row', gap: SPACE.md, marginTop: SPACE.md },
  stat: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 2,
    padding: SPACE.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  statValue: { fontSize: 26, fontWeight: '900', marginTop: 4 },

  card: { marginTop: SPACE.xl, borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, padding: SPACE.lg },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowHint: { marginTop: 2 },

  sectionLabel: { marginTop: SPACE.xxl, marginBottom: SPACE.md },
  modes: { flexDirection: 'row', gap: SPACE.sm },
  mode: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },

  signOut: { marginTop: SPACE.xxl },
  footer: { alignItems: 'center', gap: SPACE.sm, marginTop: SPACE.lg },
  demoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACE.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  demoText: { fontSize: 11, fontWeight: '800' },
});
