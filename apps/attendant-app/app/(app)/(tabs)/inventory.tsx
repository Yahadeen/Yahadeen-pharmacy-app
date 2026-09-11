/**
 * Inventory. The shelf, ordered by scarcity — whatever is closest to running out
 * sits at the top, because that is the only thing on this screen that needs a
 * decision.
 *
 * The text query is pushed down to `data.products()` so the real API does the
 * searching; the Low/Out filter is applied to the returned page client-side,
 * since "how close to the threshold" is a derived value and `stockState()` is
 * already the single source of truth for it.
 */
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACE, TYPE, stockState, type ProductWithStock } from '@pharmago/shared';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  EmptyState,
  Entrance,
  Screen,
  ScreenHeader,
  Segmented,
  Skeleton,
  StockRow,
  TAB_BAR_CLEARANCE,
} from '@/src/components';
import { useAsync } from '@/src/hooks/useAsync';
import { data } from '@/src/lib/data';
import { useTheme } from '@/src/theme';

type Shelf = 'all' | 'low' | 'out';

export default function Inventory() {
  const router = useRouter();
  const { colors } = useTheme();

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [shelf, setShelf] = useState<Shelf>('all');

  // Typing should not fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  const shelfList = useAsync(
    async () => (await data.products({ q: debounced || undefined, page_size: 100 })).items,
    [debounced],
  );

  // A stock edit happens on a pushed screen, so the list refreshes on the way back.
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void shelfList.refresh();
    }, [shelfList.refresh]),
  );

  const items = shelfList.data ?? [];

  const counts = useMemo(() => {
    let low = 0;
    let out = 0;
    for (const p of items) {
      const state = stockState(p.quantity, p.low_stock_threshold);
      if (state === 'low_stock') low += 1;
      if (state === 'out_of_stock') out += 1;
    }
    return { low, out };
  }, [items]);

  const visible = useMemo(() => {
    if (shelf === 'all') return items;
    const want = shelf === 'low' ? 'low_stock' : 'out_of_stock';
    return items.filter((p) => stockState(p.quantity, p.low_stock_threshold) === want);
  }, [items, shelf]);

  const filters = useMemo(
    () => [
      { value: 'all' as Shelf, label: 'All' },
      { value: 'low' as Shelf, label: counts.low ? `Low · ${counts.low}` : 'Low' },
      { value: 'out' as Shelf, label: counts.out ? `Out · ${counts.out}` : 'Out' },
    ],
    [counts],
  );

  const openProduct = (product: ProductWithStock) =>
    router.push(`/(app)/stock/${product.id}`);

  return (
    <Screen padded={false}>
      <View style={styles.head}>
        <ScreenHeader
          title="Inventory"
          subtitle={
            shelfList.loading
              ? 'Counting the shelf…'
              : `${items.length} ${items.length === 1 ? 'product' : 'products'} on the shelf`
          }
        />

        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={17} color={colors.faintText} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Medicine, brand or generic name"
            placeholderTextColor={colors.faintText}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            style={[styles.searchInput, { color: colors.text }]}
          />
          {!!query && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={8}
              onPress={() => setQuery('')}
            >
              <Feather name="x-circle" size={17} color={colors.faintText} />
            </Pressable>
          )}
        </View>

        <Segmented options={filters} value={shelf} onChange={setShelf} style={styles.filters} />
      </View>

      {shelfList.loading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={78} radius={RADIUS.md} style={styles.skel} />
          ))}
        </View>
      ) : shelfList.error ? (
        <EmptyState
          icon="wifi-off"
          title="Could not load the shelf"
          message={shelfList.error}
          actionLabel="Try again"
          onAction={shelfList.reload}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={shelf === 'all' ? 'search' : 'check-circle'}
          title={
            shelf === 'all'
              ? 'Nothing matches that'
              : shelf === 'low'
                ? 'Nothing running low'
                : 'Nothing out of stock'
          }
          message={
            shelf === 'all'
              ? 'Try a shorter word, or the generic name instead of the brand.'
              : 'Every product on this shelf is above its reorder level.'
          }
          actionLabel={shelf === 'all' && !!query ? 'Clear search' : undefined}
          onAction={shelf === 'all' && !!query ? () => setQuery('') : undefined}
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshing={shelfList.refreshing}
          onRefresh={shelfList.refresh}
          ItemSeparatorComponent={Gap}
          renderItem={({ item, index }) => (
            <Entrance delay={Math.min(index, 8) * 45}>
              <StockRow product={item} onPress={() => openProduct(item)} />
            </Entrance>
          )}
          ListFooterComponent={
            <Text style={[TYPE.caption, styles.footer, { color: colors.faintText }]}>
              Tap a product to correct its count. Every change is logged against your name.
            </Text>
          }
        />
      )}
    </Screen>
  );
}

const Gap = () => <View style={styles.gap} />;

const styles = StyleSheet.create({
  head: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.md },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    minHeight: 48,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: SPACE.md },
  filters: { marginTop: SPACE.md, marginBottom: SPACE.md },

  list: { paddingHorizontal: SPACE.xl, gap: SPACE.sm },
  listContent: {
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.xs,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  gap: { height: SPACE.sm },
  skel: { marginBottom: SPACE.sm },
  footer: { textAlign: 'center', marginTop: SPACE.xl, lineHeight: 17 },
});
