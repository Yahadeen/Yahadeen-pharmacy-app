/**
 * Home. Search entry, live order tracking, categories and a featured rail —
 * everything a returning customer needs before they start typing.
 */
import { Feather } from '@expo/vector-icons';
import {
  OPEN_ORDER_STATUSES,
  ORDER_STATUS_META,
  RADIUS,
  SPACE,
  TYPE,
  formatNaira,
} from '@pharmago/shared';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  BrandGradient,
  CategoryTile,
  Entrance,
  GlassIconButton,
  ProductCard,
  ProductCardSkeleton,
  Screen,
  SectionHeader,
} from '@/src/components';
import { useAsync } from '@/src/hooks/useAsync';
import { data } from '@/src/lib/data';
import { useCart } from '@/src/state/CartProvider';
import { useSession } from '@/src/state/SessionProvider';
import { useToast } from '@/src/state/ToastProvider';
import { useTheme } from '@/src/theme';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useSession();
  const cart = useCart();
  const toast = useToast();

  const home = useAsync(async () => {
    const [categories, featured, orders, notifications] = await Promise.all([
      data.categories(),
      data.featured(),
      data.orders(),
      data.notifications(),
    ]);
    return {
      categories,
      featured,
      activeOrder: orders?.items?.find((o) => OPEN_ORDER_STATUSES.includes(o.status)) ?? null,
      unread: notifications?.filter((n) => !n.read_at).length ?? 0,
    };
  }, []);

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? 'there';

  const add = (productId: string) => {
    const product = home.data?.featured.find((p) => p.id === productId);
    if (!product) return;
    cart.add(product, 1);
    toast.success(`${product.name} added to your cart.`);
  };

  return (
    <Screen scroll tabBarPadding refreshing={home.refreshing} onRefresh={home.refresh}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={[TYPE.label, { color: colors.mutedText }]}>{greeting()},</Text>
          <Text numberOfLines={1} style={[TYPE.title, { color: colors.text }]}>
            {firstName}
          </Text>
        </View>
        <GlassIconButton
          icon="bell"
          accessibilityLabel="Notifications"
          badge={home.data?.unread}
          onPress={() => router.push('/(app)/notifications')}
        />
        <GlassIconButton
          icon="shopping-bag"
          accessibilityLabel="Cart"
          badge={cart.count}
          onPress={() => router.push('/(app)/cart')}
        />
      </View>

      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search medicines"
        onPress={() => router.push('/(app)/search')}
        style={({ pressed }) => [
          styles.search,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && styles.pressed,
        ]}
      >
        <Feather name="search" size={18} color={colors.faintText} />
        <Text style={[TYPE.body, styles.flex, { color: colors.faintText }]}>
          Search medicines, brands, vitamins…
        </Text>
        <View style={[styles.searchKbd, { backgroundColor: colors.primarySoft }]}>
          <Feather name="mic" size={14} color={colors.primary} />
        </View>
      </Pressable>

      {home.data?.activeOrder ? (
        <Entrance>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Track order ${home.data.activeOrder.code}`}
            onPress={() => router.push(`/(app)/order/${home.data!.activeOrder!.id}`)}
          >
            <BrandGradient style={styles.hero}>
              <View style={styles.heroTop}>
                <View style={styles.heroBadge}>
                  <Feather name="truck" size={13} color="#FFFFFF" />
                  <Text style={styles.heroBadgeText}>
                    {ORDER_STATUS_META[home.data.activeOrder.status].label}
                  </Text>
                </View>
                <Text style={styles.heroCode}>{home.data.activeOrder.code}</Text>
              </View>
              <Text style={styles.heroTitle}>
                {ORDER_STATUS_META[home.data.activeOrder.status].detail}
              </Text>
              <View style={styles.heroFoot}>
                <Text style={styles.heroMeta}>
                  {home.data.activeOrder.item_count}{' '}
                  {home.data.activeOrder.item_count === 1 ? 'item' : 'items'} ·{' '}
                  {formatNaira(home.data.activeOrder.total_kobo)}
                </Text>
                <View style={styles.heroCta}>
                  <Text style={styles.heroCtaText}>Track order</Text>
                  <Feather name="arrow-right" size={15} color="#FFFFFF" />
                </View>
              </View>
            </BrandGradient>
          </Pressable>
        </Entrance>
      ) : (
        <Entrance>
          <BrandGradient style={styles.hero}>
            <Text style={styles.heroTitle}>Free delivery on orders over ₦50,000</Text>
            <Text style={styles.heroBody}>
              Order before 6pm and a rider brings it the same day, anywhere in Lagos.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(app)/search')}
              style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
            >
              <Text style={[styles.heroButtonText, { color: colors.primaryDeep }]}>
                Browse medicines
              </Text>
            </Pressable>
          </BrandGradient>
        </Entrance>
      )}

      <View style={styles.section}>
        <SectionHeader title="Shop by category" />
        {home.loading ? (
          <View style={styles.catRow}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.catSkel, { backgroundColor: colors.skeleton }]} />
            ))}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
          >
            {(home.data?.categories ?? []).map((category) => (
              <CategoryTile
                key={category.id}
                category={category}
                onPress={() => router.push(`/(app)/category/${category.slug}`)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Popular this week"
          actionLabel="See all"
          onAction={() => router.push('/(app)/search')}
        />
        <View style={styles.grid}>
          {home.loading
            ? [0, 1, 2, 3].map((i) => <ProductCardSkeleton key={i} style={styles.gridItem} />)
            : (home.data?.featured ?? []).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  style={styles.gridItem}
                  inCart={cart.qtyOf(product.id)}
                  onPress={() => router.push(`/(app)/product/${product.id}`)}
                  onAdd={() => add(product.id)}
                />
              ))}
        </View>
      </View>

      {!!home.error && !home.loading && (
        <Pressable
          accessibilityRole="button"
          onPress={home.reload}
          style={[styles.errorBox, { backgroundColor: colors.dangerSoft }]}
        >
          <Feather name="refresh-cw" size={15} color={colors.danger} />
          <Text style={[TYPE.label, styles.flex, { color: colors.danger }]}>
            {home.error} Tap to retry.
          </Text>
        </Pressable>
      )}

      <View style={[styles.rxStrip, { backgroundColor: colors.primarySoft }]}>
        <View style={[styles.rxIcon, { backgroundColor: colors.primary }]}>
          <Feather name="file-text" size={17} color={colors.onPrimary} />
        </View>
        <View style={styles.flex}>
          <Text style={[TYPE.label, { color: colors.text }]}>Have a prescription?</Text>
          <Text style={[TYPE.caption, styles.rxBody, { color: colors.mutedText }]}>
            Attach a photo at checkout. A licensed pharmacist reviews it before your order is
            dispensed.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.8 },

  header: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.lg },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    minHeight: 52,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACE.xl,
  },
  searchKbd: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: { padding: SPACE.xl },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACE.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  heroBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  heroCode: { fontSize: 12, fontWeight: '900', letterSpacing: 0.6, color: 'rgba(255,255,255,0.8)' },
  heroTitle: { fontSize: 18, fontWeight: '800', lineHeight: 24, color: '#FFFFFF' },
  heroBody: {
    marginTop: SPACE.sm,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    color: 'rgba(255,255,255,0.85)',
  },
  heroFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACE.lg,
  },
  heroMeta: { fontSize: 12.5, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  heroCta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroCtaText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  heroButton: {
    alignSelf: 'flex-start',
    marginTop: SPACE.lg,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm + 2,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FFFFFF',
  },
  heroButtonText: { fontSize: 13.5, fontWeight: '800' },

  section: { marginTop: SPACE.xxl },
  catRow: { flexDirection: 'row', gap: SPACE.sm, paddingRight: SPACE.xl },
  catSkel: { width: 86, height: 96, borderRadius: RADIUS.md },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.md },
  gridItem: { width: '47.6%', flexGrow: 1 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    marginTop: SPACE.xl,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
  },

  rxStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.md,
    marginTop: SPACE.xxl,
    padding: SPACE.lg,
    borderRadius: RADIUS.md,
  },
  rxIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxBody: { marginTop: 3, lineHeight: 17 },
});

