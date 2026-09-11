/**
 * Category listing. Reached from the Home rail; shows one category's products in
 * the same two-column grid Home uses so the transition feels continuous.
 */
import { RADIUS, SPACE, TYPE, type ProductQuery } from '@pharmago/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  EmptyState,
  Entrance,
  ProductCard,
  ProductCardSkeleton,
  Screen,
  ScreenHeader,
  TAB_BAR_CLEARANCE,
} from '@/src/components';
import { useAsync } from '@/src/hooks/useAsync';
import { data } from '@/src/lib/data';
import { useCart } from '@/src/state/CartProvider';
import { useToast } from '@/src/state/ToastProvider';
import { useTheme } from '@/src/theme';

type Sort = NonNullable<ProductQuery['sort']>;

const SORTS: { key: Sort; label: string }[] = [
  { key: 'price_asc', label: 'Cheapest first' },
  { key: 'price_desc', label: 'Priciest first' },
  { key: 'name', label: 'A–Z' },
];

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const cart = useCart();
  const toast = useToast();
  const [sort, setSort] = useState<Sort>('relevance');

  const view = useAsync(async () => {
    const [categories, products] = await Promise.all([
      data.categories(),
      data.products({ category: slug ? slug : undefined, sort }),
    ]);
    const category = categories.find((c) => c.slug === slug) ?? null;
    return {
      category,
      products: products.items,
      total: products.total,
    };
  }, [slug, sort]);

  const products = view.data?.products ?? [];

  return (
    <Screen padded={false}>
      <View style={styles.gutter}>
        <ScreenHeader
          title={view.data?.category?.name ?? 'Category'}
          subtitle={
            view.loading
              ? 'Loading…'
              : `${view.data?.total ?? 0} ${view.data?.total === 1 ? 'product' : 'products'}`
          }
          onBack={() => router.back()}
        />
      </View>

      <FlatList
        data={view.loading ? [] : products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={view.refreshing}
        onRefresh={view.refresh}
        ListHeaderComponent={
          <View style={styles.sortRail}>
            {SORTS.map((s) => {
              const active = s.key === sort;
              return (
                <Pressable
                  key={s.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setSort(s.key)}
                  style={[
                    styles.sortChip,
                    {
                      backgroundColor: active ? colors.primarySoft : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[TYPE.caption, { color: active ? colors.primary : colors.mutedText }]}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        }
        ListEmptyComponent={
          view.loading ? (
            <View style={styles.skelGrid}>
              {[0, 1, 2, 3].map((i) => (
                <ProductCardSkeleton key={i} style={styles.gridItem} />
              ))}
            </View>
          ) : view.error ? (
            <EmptyState
              icon="wifi-off"
              title="Could not load this category"
              message={view.error}
              actionLabel="Try again"
              onAction={view.reload}
            />
          ) : (
            <EmptyState
              icon="package"
              title="Nothing here yet"
              message="We are still stocking this shelf. Check another category in the meantime."
              actionLabel="Browse everything"
              onAction={() => router.replace('/(app)/search')}
            />
          )
        }
        renderItem={({ item, index }) => (
          <Entrance delay={Math.min(index, 6) * 50} distance={12} style={styles.gridItem}>
            <ProductCard
              product={item}
              inCart={cart.qtyOf(item.id)}
              onPress={() => router.push(`/(app)/product/${item.id}`)}
              onAdd={() => {
                cart.add(item);
                toast.success(`${item.name} added to your cart`);
              }}
            />
          </Entrance>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  gutter: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.md },
  list: { paddingHorizontal: SPACE.xl, paddingBottom: TAB_BAR_CLEARANCE },
  column: { gap: SPACE.md },
  gridItem: { width: '47.6%', flexGrow: 1, marginBottom: SPACE.md },

  sortRail: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm, marginBottom: SPACE.lg },
  sortChip: {
    paddingHorizontal: SPACE.md,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },

  skelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.md },
});
