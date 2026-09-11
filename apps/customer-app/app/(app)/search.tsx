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
      <View style={[styles.bar, { borderBottomColor: colors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.back}
        >
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <View
          style={[
            styles.inputBox,
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
            style={[styles.input, { color: colors.text }]}
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

      <View style={styles.toolbar}>
        <Text style={[TYPE.caption, { color: colors.mutedText }]}>
          {results.loading
            ? 'Searching…'
            : `${results.data?.total ?? 0} ${results.data?.total === 1 ? 'result' : 'results'}`}
        </Text>
        <View style={styles.toolbarRight}>
          <Toggle
            label="In stock"
            active={inStockOnly}
            onPress={() => setInStockOnly((v) => !v)}
          />
          <Toggle
            label={SORTS.find((s) => s.key === sort)!.label}
            icon="sliders"
            active={sort !== 'relevance'}
            onPress={() => {
              const next = SORTS[(SORTS.findIndex((s) => s.key === sort) + 1) % SORTS.length];
              setSort(next.key);
            }}
          />
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
                <Chip key={s} label={s} active={false} onPress={() => setQuery(s)} />
              ))}
            </View>
          </View>
        ) : (
          <EmptyState
            icon="search"
            title="Nothing matched"
            message={`We could not find anything for “${debounced || 'those filters'}”. Try a different spelling or a broader term.`}
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
          renderItem={({ item, index }) => {
            const state = stockState(item.quantity, item.low_stock_threshold);
            return (
              <Entrance delay={Math.min(index, 6) * 45} distance={10} style={styles.rowGap}>
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

function Toggle({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const fg = active ? colors.primary : colors.mutedText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      hitSlop={6}
      onPress={onPress}
      style={[
        styles.toggle,
        { backgroundColor: active ? colors.primarySoft : colors.surfaceAlt },
      ]}
    >
      {!!icon && <Feather name={icon} size={12} color={fg} />}
      <Text style={[styles.toggleText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingLeft: SPACE.sm,
    paddingRight: SPACE.xl,
    paddingBottom: SPACE.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { padding: SPACE.xs },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    minHeight: 46,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: SPACE.sm },

  chipRail: { gap: SPACE.sm, paddingHorizontal: SPACE.xl, paddingVertical: SPACE.md },
  chip: {
    paddingHorizontal: SPACE.md,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.xl,
    paddingBottom: SPACE.md,
  },
  toolbarRight: { flexDirection: 'row', gap: SPACE.sm },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACE.md,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  toggleText: { fontSize: 11.5, fontWeight: '800' },

  list: { paddingHorizontal: SPACE.xl, paddingBottom: TAB_BAR_CLEARANCE },
  rowGap: { marginBottom: SPACE.sm },
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
});
