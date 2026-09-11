/**
 * Staff entry screen. Deliberately has no "Create an account" path — pharmacy
 * accounts are provisioned by an admin in the dashboard, so the only way in is
 * sign-in. If someone arrived here because their customer account was turned
 * away, `wrongAppError` explains why before they try again.
 */
import { Feather } from '@expo/vector-icons';
import { BRAND, RADIUS, SPACE } from '@pharmago/shared';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/src/state/SessionProvider';

const DUTIES = [
  {
    icon: 'list',
    title: 'Work one queue',
    body: 'Every paid order lands in front of you, oldest first.',
  },
  {
    icon: 'package',
    title: 'Keep the shelf honest',
    body: 'Adjust counts as you dispense — customers see it instantly.',
  },
  {
    icon: 'check-circle',
    title: 'Hand off cleanly',
    body: 'Mark it ready and the rider or the customer is notified.',
  },
] as const;

export default function Welcome() {
  const router = useRouter();
  const { wrongAppError } = useSession();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[BRAND.blueDeep, BRAND.blue, '#0047D6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Soft colour orbs give the glass something to refract. */}
      <View style={[styles.orb, styles.orbGreen]} />
      <View style={[styles.orb, styles.orbCyan]} />

      <SafeAreaView style={styles.safe}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.brand}>
          <View style={styles.logoTile}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
          <Text style={styles.wordmark}>yahadeen Pharm Go</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Staff</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(500)}>
          <BlurView intensity={26} tint="dark" style={styles.card}>
            <View style={styles.cardOverlay} />
            <Text style={styles.headline}>The counter,{'\n'}without the crowd.</Text>

            {!!wrongAppError && (
              <View style={styles.notice}>
                <Feather name="alert-circle" size={15} color="#FFFFFF" />
                <Text style={styles.noticeText}>{wrongAppError}</Text>
              </View>
            )}

            <View style={styles.duties}>
              {DUTIES.map((duty) => (
                <View key={duty.title} style={styles.duty}>
                  <View style={styles.dutyIcon}>
                    <Feather name={duty.icon} size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.dutyText}>
                    <Text style={styles.dutyTitle}>{duty.title}</Text>
                    <Text style={styles.dutyBody}>{duty.body}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/login')}
              style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
            >
              <Text style={styles.ctaText}>Sign in to your counter</Text>
              <Feather name="arrow-right" size={18} color={BRAND.blueDeep} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/signup' as any)}
              style={({ pressed }) => [styles.secondaryCta, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryCtaText}>Have an invite code? Create account</Text>
            </Pressable>
          </BlurView>
        </Animated.View>

        <Text style={styles.legal}>
          Staff accounts are issued by your pharmacy admin. Shopping for yourself? Use the yahadeen Pharm Go
          customer app instead.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.blueDeep },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.xl,
    paddingBottom: SPACE.lg,
  },

  orb: { position: 'absolute', borderRadius: 999, opacity: 0.28 },
  orbGreen: { width: 320, height: 320, top: -90, right: -110, backgroundColor: BRAND.green },
  orbCyan: { width: 260, height: 260, bottom: 120, left: -120, backgroundColor: BRAND.blueGlint },

  brand: { alignItems: 'center', marginTop: SPACE.xxl },
  logoTile: {
    width: 84,
    height: 84,
    borderRadius: RADIUS.xl,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  logo: { width: 66, height: 66 },
  wordmark: {
    marginTop: SPACE.md,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 1.6,
    color: '#FFFFFF',
  },
  badge: {
    marginTop: SPACE.sm,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },

  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
    padding: SPACE.xl,
  },
  cardOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(4,18,60,0.34)' },
  headline: {
    fontSize: 25,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 32,
    letterSpacing: -0.4,
  },

  notice: {
    marginTop: SPACE.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.sm,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  noticeText: { flex: 1, fontSize: 12.5, fontWeight: '700', lineHeight: 18, color: '#FFFFFF' },

  duties: { marginTop: SPACE.xl, gap: SPACE.lg },
  duty: { flexDirection: 'row', gap: SPACE.md, alignItems: 'flex-start' },
  dutyIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dutyText: { flex: 1 },
  dutyTitle: { fontSize: 14.5, fontWeight: '800', color: '#FFFFFF' },
  dutyBody: {
    marginTop: 2,
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 18,
    color: 'rgba(255,255,255,0.72)',
  },

  cta: {
    marginTop: SPACE.xxl,
    minHeight: 54,
    borderRadius: RADIUS.md,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
  },
  ctaText: { fontSize: 15.5, fontWeight: '800', color: BRAND.blueDeep },
  secondaryCta: {
    marginTop: SPACE.md,
    minHeight: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: { fontSize: 13.5, fontWeight: '700', color: '#FFFFFF' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },

  legal: {
    marginTop: SPACE.lg,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
  },
});
