import { Feather } from '@expo/vector-icons';
import { BRAND, RADIUS, SPACE } from '@pharmago/shared';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/src/state/SessionProvider';

const DUTIES = [
  { icon: 'clipboard', title: 'Orders', body: 'Review paid orders and prescriptions.' },
  { icon: 'archive', title: 'Stock', body: 'Keep item availability accurate.' },
  { icon: 'message-circle', title: 'Support', body: 'Reply while the queue keeps moving.' },
] as const;

export default function Welcome() {
  const router = useRouter();
  const { wrongAppError } = useSession();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#071126', '#0A2565', '#075A74']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topBand} />

      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Animated.View entering={FadeIn.duration(420)} style={styles.brand}>
            <View style={styles.logoTile}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
            <Text style={styles.wordmark}>Yahadeen Pharm Go</Text>
            <Text style={styles.appLabel}>Staff workspace</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(520)} style={styles.hero}>
            <View style={styles.roleBadge}>
              <Feather name="shield" size={14} color="#DDF6E8" />
              <Text style={styles.roleBadgeText}>Attendant console</Text>
            </View>
            <Text style={styles.title}>Keep the pharmacy queue moving.</Text>
            <Text style={styles.subtitle}>
              Confirm orders, review prescriptions, manage stock checks, and keep every customer
              updated from one focused screen.
            </Text>
          </Animated.View>

          {!!wrongAppError && (
            <Animated.View entering={FadeInDown.delay(165).duration(440)} style={styles.notice}>
              <Feather name="alert-circle" size={17} color="#FFD3D8" />
              <Text style={styles.noticeText}>{wrongAppError}</Text>
            </Animated.View>
          )}

          <Animated.View entering={FadeInUp.delay(210).duration(560)} style={styles.consoleShell}>
            <View style={styles.console}>
              <View style={styles.consoleHeader}>
                <View>
                  <Text style={styles.panelLabel}>Queue now</Text>
                  <Text style={styles.panelValue}>7 active orders</Text>
                </View>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>Live</Text>
                </View>
              </View>

              <View style={styles.featuredOrder}>
                <View style={styles.orderIcon}>
                  <Feather name="package" size={20} color={BRAND.blue} />
                </View>
                <View style={styles.orderCopy}>
                  <Text style={styles.orderCode}>YD-410084</Text>
                  <Text style={styles.orderMeta}>Ready for pickup - prescription attached</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#95A2B5" />
              </View>

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>3</Text>
                  <Text style={styles.statLabel}>Paid</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>2</Text>
                  <Text style={styles.statLabel}>Packed</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>4</Text>
                  <Text style={styles.statLabel}>Support</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <View style={styles.dutyGrid}>
            {DUTIES.map((duty, index) => (
              <Animated.View
                key={duty.title}
                entering={FadeInDown.delay(300 + index * 70).duration(440)}
                style={styles.duty}
              >
                <View style={styles.dutyIcon}>
                  <Feather name={duty.icon} size={18} color="#BEE9D2" />
                </View>
                <Text style={styles.dutyTitle}>{duty.title}</Text>
                <Text style={styles.dutyBody}>{duty.body}</Text>
              </Animated.View>
            ))}
          </View>

          <Animated.View entering={FadeInUp.delay(520).duration(520)} style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/login')}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryText}>Sign in to workspace</Text>
              <Feather name="arrow-right" size={18} color={BRAND.blueDeep} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/signup' as any)}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryText}>Create account with invite code</Text>
            </Pressable>
          </Animated.View>

          <Text style={styles.footer}>
            Use the customer app for shopping. Staff access is managed by pharmacy admins.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#071126' },
  safe: { flex: 1 },
  topBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 230,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.lg,
    paddingBottom: SPACE.xl,
    justifyContent: 'center',
  },
  brand: { alignItems: 'center' },
  logoTile: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  logo: { width: 58, height: 58 },
  wordmark: { marginTop: SPACE.md, fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  appLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '900',
    color: '#AAB8D2',
    textTransform: 'uppercase',
  },
  hero: { marginTop: SPACE.xl, alignItems: 'center' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: SPACE.md,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(34,197,94,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(190,233,210,0.24)',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#DDF6E8',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: SPACE.lg,
    maxWidth: 330,
    textAlign: 'center',
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  subtitle: {
    marginTop: SPACE.md,
    maxWidth: 338,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#B7C4D9',
  },
  notice: {
    marginTop: SPACE.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.sm,
    padding: SPACE.md,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '800', color: '#FFFFFF' },
  consoleShell: { marginTop: SPACE.xxl, alignItems: 'center' },
  console: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: SPACE.lg,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.md,
  },
  panelLabel: { fontSize: 12, fontWeight: '800', color: '#748096' },
  panelValue: { marginTop: 2, fontSize: 22, fontWeight: '900', color: BRAND.blueDeep },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: SPACE.md,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: '#EEF8F2',
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: BRAND.green },
  liveText: { fontSize: 12, fontWeight: '900', color: '#158449' },
  featuredOrder: {
    marginTop: SPACE.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    padding: SPACE.md,
    borderRadius: RADIUS.lg,
    backgroundColor: '#F4F7FC',
  },
  orderIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderCopy: { flex: 1 },
  orderCode: { fontSize: 15, fontWeight: '900', color: BRAND.blueDeep },
  orderMeta: { marginTop: 2, fontSize: 12, lineHeight: 17, fontWeight: '700', color: '#657284' },
  stats: { marginTop: SPACE.lg, flexDirection: 'row', gap: SPACE.sm },
  stat: {
    flex: 1,
    borderRadius: RADIUS.lg,
    backgroundColor: '#F8FAFD',
    paddingVertical: SPACE.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5ECF6',
  },
  statValue: { fontSize: 22, fontWeight: '900', color: BRAND.blueDeep },
  statLabel: { marginTop: 2, fontSize: 11, fontWeight: '900', color: '#748096' },
  dutyGrid: { marginTop: SPACE.xl, flexDirection: 'row', gap: SPACE.sm },
  duty: {
    flex: 1,
    minHeight: 122,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: SPACE.md,
    alignItems: 'center',
  },
  dutyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dutyTitle: { marginTop: SPACE.sm, fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
  dutyBody: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: '#B7C4D9',
  },
  actions: { marginTop: SPACE.xl, gap: SPACE.md },
  primaryButton: {
    minHeight: 58,
    borderRadius: RADIUS.lg,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  primaryText: { fontSize: 16, fontWeight: '900', color: BRAND.blueDeep },
  secondaryButton: {
    minHeight: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  secondaryText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  footer: {
    marginTop: SPACE.lg,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: '#AAB8D2',
  },
});
