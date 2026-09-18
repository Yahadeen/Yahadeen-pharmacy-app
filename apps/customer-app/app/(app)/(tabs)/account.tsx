/**
 * Account tab. Profile, addresses, appearance and sign-out — the settings a
 * customer actually touches, kept on one screen so nothing is buried.
 */
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACE, TYPE } from '@pharmago/shared';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import {
  ConfirmModal,
  Entrance,
  GlassButton,
  Screen,
  ScreenHeader,
  type FeatherName,
} from '@/src/components';
import { DEMO_MODE, data } from '@/src/lib/data';
import { getPushPermissionStatus, requestPushRegistration } from '@/src/lib/push-registration';
import { useCart } from '@/src/state/CartProvider';
import { useSession } from '@/src/state/SessionProvider';
import { useToast } from '@/src/state/ToastProvider';
import { useTheme, type ThemeMode } from '@/src/theme';

const MODES: { key: ThemeMode; label: string; icon: FeatherName }[] = [
  { key: 'system', label: 'System', icon: 'smartphone' },
  { key: 'light', label: 'Light', icon: 'sun' },
  { key: 'dark', label: 'Dark', icon: 'moon' },
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
  const toast = useToast();
  const cart = useCart();
  const [busy, setBusy] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushHint, setPushHint] = useState('Checking notification status...');
  const [activePushToken, setActivePushToken] = useState<string | null>(null);

  const loadPushStatus = useCallback(async () => {
    try {
      const [status, permission] = await Promise.all([
        data.pushTokenStatus(),
        getPushPermissionStatus(),
      ]);
      const token = status.tokens[0]?.token ?? null;
      const enabled = status.has_active_token && permission === 'granted';
      setActivePushToken(token);
      setPushEnabled(enabled);
      setPushHint(
        permission === 'unavailable'
          ? 'Available in installed builds on a physical device'
          : enabled
            ? 'Order updates can reach this device'
            : status.has_active_token
              ? 'Device permission is off'
              : 'Tap to enable order updates',
      );
    } catch (error) {
      console.warn('Failed to load push token status:', error);
      setPushEnabled(false);
      setPushHint('Could not check notification status');
    }
  }, []);

  useEffect(() => {
    void loadPushStatus();
  }, [loadPushStatus]);

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      setShowLogoutModal(false);
    } finally {
      setBusy(false);
    }
  };

  const handleTogglePush = async (next: boolean) => {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      if (next) {
        const registration = await requestPushRegistration();
        if (!registration) {
          setPushEnabled(false);
          setPushHint('Notifications were not granted on this device');
          toast.error('Notifications were not enabled');
          return;
        }
        await data.registerPushToken(registration.token, registration.platform, registration.deviceInfo);
        setActivePushToken(registration.token);
        setPushEnabled(true);
        setPushHint('Order updates can reach this device');
        toast.success('Push notifications enabled');
      } else {
        await data.removePushToken(activePushToken ?? undefined);
        setActivePushToken(null);
        setPushEnabled(false);
        setPushHint('Tap to enable order updates');
        toast.show('Push notifications disabled');
      }
      void loadPushStatus();
    } catch (error) {
      console.warn('Failed to update push notification setting:', error);
      toast.error('Could not update notification setting');
      void loadPushStatus();
    } finally {
      setPushBusy(false);
    }
  };

  const rows: {
    icon: FeatherName;
    label: string;
    hint?: string;
    onPress: () => void;
  }[] = [
    {
      icon: 'map-pin',
      label: 'Delivery addresses',
      hint: 'Where we bring your orders',
      onPress: () => router.push('/(app)/addresses'),
    },
    {
      icon: 'bell',
      label: 'Notifications',
      hint: 'Order updates and restock alerts',
      onPress: () => router.push('/(app)/notifications'),
    },
    {
      icon: 'shopping-bag',
      label: 'Your cart',
      hint: cart.count ? `${cart.count} ${cart.count === 1 ? 'item' : 'items'} waiting` : 'Empty',
      onPress: () => router.push('/(app)/cart'),
    },
    {
      icon: 'package',
      label: 'Order history',
      onPress: () => router.push('/(app)/(tabs)/orders'),
    },
  ];

  return (
    <Screen scroll tabBarPadding>
      <ScreenHeader title="Account" subtitle="Profile and preferences" />

      <Entrance>
        <View
          style={[
            styles.profile,
            { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
              {initials(profile?.full_name)}
            </Text>
          </View>
          <View style={styles.flex}>
            <Text numberOfLines={1} style={[TYPE.heading, { color: colors.text }]}>
              {profile?.full_name ?? 'yahadeen customer'}
            </Text>
            <Text numberOfLines={1} style={[TYPE.caption, styles.profileMeta, { color: colors.mutedText }]}>
              {profile?.email ?? user?.email ?? '—'}
            </Text>
            {!!profile?.phone && (
              <Text style={[TYPE.caption, { color: colors.faintText }]}>{profile.phone}</Text>
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

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: colors.surfaceAlt }]}>
            <Feather name="radio" size={17} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={[TYPE.label, { color: colors.text }]}>Push notifications</Text>
            <Text style={[TYPE.caption, styles.rowHint, { color: colors.faintText }]}>
              {pushHint}
            </Text>
          </View>
          <Switch
            value={pushEnabled}
            disabled={pushBusy}
            onValueChange={handleTogglePush}
            trackColor={{ false: colors.border, true: colors.primarySoft }}
            thumbColor={pushEnabled ? colors.primary : colors.surfaceAlt}
          />
        </View>
        {rows.map((row) => (
          <Pressable
            key={row.label}
            accessibilityRole="button"
            onPress={row.onPress}
            style={({ pressed }) => [
              styles.row,
              { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
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
              <Feather
                name={m.icon}
                size={17}
                color={active ? colors.primary : colors.mutedText}
              />
              <Text
                style={[
                  TYPE.caption,
                  { color: active ? colors.primary : colors.mutedText },
                ]}
              >
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
        onPress={() => setShowLogoutModal(true)}
        style={styles.signOut}
      />

      <ConfirmModal
        visible={showLogoutModal}
        title="Sign out?"
        message="Your cart stays saved on this device."
        confirmText="Sign out"
        cancelText="Cancel"
        destructive
        onConfirm={handleSignOut}
        onCancel={() => setShowLogoutModal(false)}
        loading={busy}
      />

      <View style={styles.footer}>
        <Text style={[TYPE.caption, { color: colors.faintText }]}>
          Yahadeen Pharm Go v{Constants.expoConfig?.version ?? '1.0.0'}
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
  avatarText: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  profileMeta: { marginTop: 3 },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    marginTop: SPACE.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
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
  footer: {
    alignItems: 'center',
    gap: SPACE.sm,
    marginTop: SPACE.lg,
  },
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
