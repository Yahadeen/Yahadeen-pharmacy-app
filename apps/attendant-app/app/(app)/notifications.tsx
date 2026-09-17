/**
 * Notifications — the staff feed: new paid orders, prescriptions waiting on a
 * pharmacist, and stock that has run out from under the catalogue.
 *
 * The same rows arrive as push messages, so this screen exists for everything a
 * banner lost. Tapping one marks it read and follows its `data` payload to the
 * order or the product it is about; the payload is validated rather than trusted,
 * because it comes off the wire and may name a screen that no longer exists.
 *
 * Marking read is optimistic — the row dims on tap and the request is fired
 * behind it. A failure is reconciled by the next load, which is not worth
 * interrupting a counter over.
 */
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACE, TYPE, type AppNotification } from '@pharmago/shared';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, Entrance, ScreenHeader, Skeleton, type FeatherName } from '@/src/components';
import { useAsync } from '@/src/hooks/useAsync';
import { data } from '@/src/lib/data';
import { useToast } from '@/src/state/ToastProvider';
import { useTheme } from '@/src/theme';

/** Which screen a notification points at, if any. */
type Target = { kind: 'order' | 'product'; id: string } | null;

function targetOf(payload: AppNotification['data']): Target {
  if (!payload) return null;
  const kind = payload.kind;
  const id = payload.id;
  if (typeof id !== 'string' || !id) return null;
  if (kind === 'order' || kind === 'product') return { kind, id };
  return null;
}

const ICONS: Record<string, FeatherName> = {
  order: 'shopping-bag',
  product: 'package',
};

/** `2 min ago` … `3 days ago`, then an absolute date once it stops being useful. */
function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  if (days <= 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

/** Splits the list into Today / Earlier so a long shift stays scannable. */
function group(items: AppNotification[]): { title: string; rows: AppNotification[] }[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today: AppNotification[] = [];
  const earlier: AppNotification[] = [];
  for (const row of items) {
    (new Date(row.created_at) >= startOfToday ? today : earlier).push(row);
  }
  return [
    { title: 'Today', rows: today },
    { title: 'Earlier', rows: earlier },
  ].filter((section) => section.rows.length > 0);
}

export default function Notifications() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();

  const view = useAsync(() => data.notifications(), []);
  const items = view.data ?? [];
  const unread = items.filter((n) => !n.read_at).length;

  const markRead = (row: AppNotification) => {
    if (row.read_at) return;
    const stamp = new Date().toISOString();
    view.setData(items.map((n) => (n.id === row.id ? { ...n, read_at: stamp } : n)));
    void data.markNotificationRead(row.id).catch(() => {
      // Reconciled on the next load.
    });
  };

  const markAllRead = async () => {
    const stamp = new Date().toISOString();
    view.setData(items.map((n) => (n.read_at ? n : { ...n, read_at: stamp })));
    try {
      await data.markAllNotificationsRead();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not mark those as read.');
      await view.reload();
    }
  };

  const open = (row: AppNotification) => {
    markRead(row);
    const target = targetOf(row.data);
    if (!target) return;
    router.push(
      target.kind === 'order' ? `/(app)/order/${target.id}` : `/(app)/stock/${target.id}`,
    );
  };

  const sections = group(items);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.gutter}>
        <ScreenHeader
          title="Notifications"
          subtitle={
            view.loading ? 'Checking for updates…' : unread ? `${unread} unread` : 'All caught up'
          }
          onBack={() => router.back()}
          right={
            unread > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mark all as read"
                hitSlop={8}
                onPress={() => void markAllRead()}
              >
                <Text style={[TYPE.label, { color: colors.primary }]}>Mark all</Text>
              </Pressable>
            ) : undefined
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
          [0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.skelRow, { borderBottomColor: colors.border }]}>
              <Skeleton width={38} height={38} radius={RADIUS.pill} />
              <View style={styles.flex}>
                <Skeleton width="62%" height={13} />
                <Skeleton width="90%" height={11} style={styles.skelLine} />
              </View>
            </View>
          ))
        ) : view.error && !items.length ? (
          <EmptyState
            icon="wifi-off"
            title="Could not load notifications"
            message={view.error}
            actionLabel="Try again"
            onAction={() => void view.reload()}
          />
        ) : !items.length ? (
          <EmptyState
            icon="bell"
            title="Nothing here yet"
            message="New paid orders, prescriptions waiting on a pharmacist and low-stock alerts land on this screen."
          />
        ) : (
          sections.map((section) => (
            <View key={section.title}>
              <Text style={[TYPE.label, styles.sectionTitle, { color: colors.faintText }]}>
                {section.title.toUpperCase()}
              </Text>
              {section.rows.map((row, index) => {
                const target = targetOf(row.data);
                const isUnread = !row.read_at;
                return (
                  <Entrance key={row.id} delay={Math.min(index, 6) * 45} distance={10}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={row.title}
                      onPress={() => open(row)}
                      style={({ pressed }) => [
                        styles.row,
                        {
                          backgroundColor: isUnread ? colors.primarySoft : colors.surface,
                          borderColor: colors.border,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.icon,
                          { backgroundColor: isUnread ? colors.primary : colors.surfaceAlt },
                        ]}
                      >
                        <Feather
                          name={ICONS[target?.kind ?? ''] ?? 'bell'}
                          size={16}
                          color={isUnread ? colors.onPrimary : colors.mutedText}
                        />
                      </View>
                      <View style={styles.flex}>
                        <View style={styles.titleRow}>
                          <Text
                            numberOfLines={1}
                            style={[TYPE.label, styles.flex, { color: colors.text }]}
                          >
                            {row.title}
                          </Text>
                          {isUnread && (
                            <View style={[styles.dot, { backgroundColor: colors.accent }]} />
                          )}
                        </View>
                        <Text style={[TYPE.caption, styles.body, { color: colors.mutedText }]}>
                          {row.message}
                        </Text>
                        <View style={styles.metaRow}>
                          <Text style={[TYPE.caption, { color: colors.faintText }]}>
                            {timeAgo(row.created_at)}
                          </Text>
                          {!!target && (
                            <>
                              <Text style={[TYPE.caption, { color: colors.faintText }]}>·</Text>
                              <Text style={[TYPE.caption, { color: colors.primary }]}>
                                {target.kind === 'order' ? 'Open the order' : 'Fix the count'}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  </Entrance>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gutter: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.md },
  scroll: { paddingHorizontal: SPACE.xl, paddingBottom: SPACE.xxl },

  sectionTitle: { marginTop: SPACE.md, marginBottom: SPACE.sm, letterSpacing: 0.8 },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.md,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACE.sm,
  },
  pressed: { opacity: 0.85 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  dot: { width: 7, height: 7, borderRadius: RADIUS.pill },
  body: { marginTop: 3, lineHeight: 17, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },

  skelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    paddingVertical: SPACE.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  skelLine: { marginTop: 6 },
});
