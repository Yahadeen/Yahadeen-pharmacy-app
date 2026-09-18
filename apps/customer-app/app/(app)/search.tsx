/**
 * Search. A debounced text query plus three refinements — category, stock and
 * sort — all pushed down to `data.products()` so the same code path serves the
 * demo fixtures and the real API.
 */
import { Feather } from '@expo/vector-icons';
import {
  RADIUS,
  SPACE,
  STOCK_STATE_META,
  TYPE,
  stockState,
  type ProductQuery,
  type ProductWithStock,
} from '@pharmago/shared';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  EmptyState,
  Entrance,
  ProductRow,
  Screen,
  ScreenHeader,
  Skeleton,
  TAB_BAR_CLEARANCE,
} from '@/src/components';
import { useAsync } from '@/src/hooks/useAsync';
import { data } from '@/src/lib/data';
import { useCart } from '@/src/state/CartProvider';
import { useToast } from '@/src/state/ToastProvider';
import { useTheme } from '@/src/theme';

type Sort = NonNullable<ProductQuery['sort']>;

const SORTS: { key: Sort; label: string }[] = [
  { key: 'relevance', label: 'Best match' },
  { key: 'price_asc', label: 'Cheapest' },
  { key: 'price_desc', label: 'Priciest' },
  { key: 'name', label: 'A–Z' },
];

/** Common asks, shown before anything has been typed. */
const SUGGESTIONS = ['Paracetamol', 'Malaria', 'Vitamin C', 'Blood sugar', 'Antibiotics'];

export default function Search() {
  const router = useRouter();
  const { colors } = useTheme();
  const cart = useCart();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('relevance');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Typing should not fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  const cats = useAsync(() => data.categories(), []);
  const results = useAsync(
    () =>
      data.products({
        q: debounced || undefined,
        category: category ?? undefined,
        in_stock_only: inStockOnly,
        sort,
      }),
    [debounced, category, sort, inStockOnly],
  );

  const items = results.data?.items ?? [];
  const idle = !debounced && !category && !inStockOnly;

  const addToCart = (product: ProductWithStock) => {
    cart.add(product);
    toast.success(`${product.name} added to your cart`);
  };

  return (
    <Screen padded={false}>
      <View style={styles.head}>
        <ScreenHeader
          title="Search"
          subtitle={
            results.loading
              ? 'Searching…'
              : `${results.data?.total ?? 0} ${results.data?.total === 1 ? 'result' : 'results'}`
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
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Medicine, brand or symptom"
            placeholderTextColor={colors.faintText}
            returnKeyType="search"
            autoCorrect={false}
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

        <FlatList
          horizontal
          data={cats.data ?? []}
          keyExtractor={(c) => c.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRail}
          ListHeaderComponent={
            <Chip label="All" active={!category} onPress={() => setCategory(null)} />
          }
          renderItem={({ item }) => (
            <Chip
              label={item.name}
              active={category === item.slug}
              onPress={() => setCategory(category === item.slug ? null : item.slug)}
            />
          )}
        />

        <View style={styles.filtersRow}>
          <Pressable
            style={[
              styles.filterChip,
              { backgroundColor: inStockOnly ? colors.primarySoft : colors.surfaceAlt, borderColor: colors.border },
            ]}
            onPress={() => setInStockOnly((v) => !v)}
          >
            <Feather
              name={inStockOnly ? 'check-circle' : 'circle'}
              size={14}
              color={inStockOnly ? colors.primary : colors.mutedText}
            />
            <Text style={[styles.filterChipText, { color: inStockOnly ? colors.primary : colors.mutedText }]}>
              In stock
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.filterChip,
              { backgroundColor: sort !== 'relevance' ? colors.primarySoft : colors.surfaceAlt, borderColor: colors.border },
            ]}
            onPress={() => {
              const next = SORTS[(SORTS.findIndex((s) => s.key === sort) + 1) % SORTS.length];
              setSort(next.key);
            }}
          >
            <Feather name="sliders" size={14} color={sort !== 'relevance' ? colors.primary : colors.mutedText} />
            <Text style={[styles.filterChipText, { color: sort !== 'relevance' ? colors.primary : colors.mutedText }]}>
              {SORTS.find((s) => s.key === sort)!.label}
            </Text>
          </Pressable>
        </View>
      </View>

      {results.loading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={82} radius={RADIUS.md} style={styles.skel} />
          ))}
        </View>
      ) : results.error ? (
        <EmptyState
          icon="wifi-off"
          title="Search is unavailable"
          message={results.error}
          actionLabel="Try again"
          onAction={results.reload}
        />
      ) : items.length === 0 ? (
        idle ? (
          <View style={styles.suggestBox}>
            <Text style={[TYPE.label, { color: colors.mutedText }]}>Try one of these</Text>
            <View style={styles.suggestWrap}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  style={[styles.suggestionChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                  onPress={() => setQuery(s)}
                >
                  <Text style={[TYPE.caption, { color: colors.mutedText }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <EmptyState
            icon="search"
            title="Nothing matched"
            message={`We could not find anything for "${debounced || 'those filters'}". Try a different spelling or a broader term.`}
            actionLabel="Clear filters"
            onAction={() => {
              setQuery('');
              setCategory(null);
              setInStockOnly(false);
              setSort('relevance');
            }}
          />
        )
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={Gap}
          renderItem={({ item, index }) => {
            const state = stockState(item.quantity, item.low_stock_threshold);
            return (
              <Entrance delay={Math.min(index, 6) * 45} distance={10}>
                <ProductRow
                  name={item.name}
                  packSize={item.pack_size}
                  imageUrl={item.image_url}
                  priceKobo={item.price_kobo}
                  requiresPrescription={item.requires_prescription}
                  note={state === 'in_stock' ? undefined : STOCK_STATE_META[state].label}
                  onPress={() => router.push(`/(app)/product/${item.id}`)}
                  right={
                    state === 'out_of_stock' ? (
                      <Feather name="slash" size={18} color={colors.faintText} />
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${item.name} to cart`}
                        hitSlop={6}
                        onPress={() => addToCart(item)}
                        style={[styles.add, { backgroundColor: colors.primary }]}
                      >
                        <Feather name="plus" size={17} color={colors.onPrimary} />
                      </Pressable>
                    )
                  }
                />
              </Entrance>
            );
          }}
        />
      )}
    </Screen>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={[TYPE.caption, { color: active ? colors.onPrimary : colors.mutedText }]}>
        {label}
      </Text>
    </Pressable>
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
  chipRail: { gap: SPACE.sm, paddingHorizontal: SPACE.xl, paddingVertical: SPACE.md },
  chip: {
    paddingHorizontal: SPACE.md,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
    marginBottom: SPACE.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACE.md,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },

  list: {
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.xs,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  gap: { height: SPACE.sm },
  skel: { marginBottom: SPACE.sm },
  add: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  suggestBox: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.xl, gap: SPACE.md },
  suggestWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  suggestionChip: {
    paddingHorizontal: SPACE.md,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
});
