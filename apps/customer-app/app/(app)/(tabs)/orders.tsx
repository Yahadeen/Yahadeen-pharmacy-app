/**
 * Orders tab. Three filters — everything, the ones still moving, and history —
 * because "where is my order" and "what did I buy last month" are different jobs.
 */
import { OPEN_ORDER_STATUSES, RADIUS, SPACE, TYPE } from '@pharmago/shared';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  EmptyState,
  Entrance,
  OrderCard,
  Screen,
  ScreenHeader,
  Skeleton,
} from '@/src/components';
import { useAsync } from '@/src/hooks/useAsync';
import { data } from '@/src/lib/data';
import { useTheme } from '@/src/theme';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'past', label: 'Completed' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

export default function Orders() {
  const router = useRouter();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<FilterKey>('all');

  const orders = useAsync(async () => (await data.orders()).items, []);

  const visible = useMemo(() => {
    const items = orders.data ?? [];
    if (filter === 'active') return items.filter((o) => OPEN_ORDER_STATUSES.includes(o.status));
    if (filter === 'past') {
      return items.filter((o) => o.status === 'delivered' || o.status === 'cancelled');
    }
    return items;
  }, [orders.data, filter]);

  return (
    <Screen scroll tabBarPadding refreshing={orders.refreshing} onRefresh={orders.refresh}>
      <ScreenHeader title="Your orders" subtitle="Track deliveries and reorder" />

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(f.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  TYPE.label,
                  { color: active ? colors.onPrimary : colors.mutedText },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {orders.loading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.skelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Skeleton height={15} width="40%" />
              <Skeleton height={12} width="65%" style={styles.skelGap} />
              <Skeleton height={12} width="80%" style={styles.skelGap} />
              <Skeleton height={18} width="30%" style={styles.skelGapLg} />
            </View>
          ))}
        </View>
      ) : orders.error ? (
        <EmptyState
          icon="wifi-off"
          title="Could not load your orders"
          message={orders.error}
          actionLabel="Try again"
          onAction={orders.reload}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={filter === 'past' ? 'clock' : 'package'}
          title={filter === 'all' ? 'No orders yet' : `No ${filter === 'active' ? 'active' : 'completed'} orders`}
          message={
            filter === 'all'
              ? 'Once you place an order it shows up here with live delivery status.'
              : 'Switch filters to see the rest of your orders.'
          }
          actionLabel={filter === 'all' ? 'Start shopping' : undefined}
          onAction={filter === 'all' ? () => router.push('/(app)/search') : undefined}
        />
      ) : (
        <View style={styles.list}>
          {visible.map((order, index) => (
            <Entrance key={order.id} delay={index * 60}>
              <OrderCard order={order} onPress={() => router.push(`/(app)/order/${order.id}`)} />
            </Entrance>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', gap: SPACE.sm, marginBottom: SPACE.lg },
  chip: {
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  list: { gap: SPACE.md },
  skelCard: { padding: SPACE.lg, borderRadius: RADIUS.lg, borderWidth: 1 },
  skelGap: { marginTop: SPACE.sm },
  skelGapLg: { marginTop: SPACE.lg },
});
