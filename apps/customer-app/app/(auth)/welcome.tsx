import { Feather } from '@expo/vector-icons';
import { BRAND, RADIUS, SPACE } from '@pharmago/shared';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const PERKS = [
  { icon: 'search', title: 'Find what you need', body: 'Search 2,000+ verified medicines by name or brand.' },
  { icon: 'camera', title: 'Upload a prescription', body: 'Snap it once — our pharmacist reviews before dispatch.' },
  { icon: 'map-pin', title: 'Track to your door', body: 'Live status from the counter to your doorstep.' },
] as const;

export default function Welcome() {
  const router = useRouter();

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
          <Text style={styles.wordmark}>Yahadeen Pharm Go</Text>
          <Text style={styles.tagline}>Medicine, delivered</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(500)}>
          <BlurView intensity={26} tint="dark" style={styles.card}>
            <View style={styles.cardOverlay} />
            <Text style={styles.headline}>Skip the queue.{'\n'}Get it delivered.</Text>

            <View style={styles.perks}>
              {PERKS.map((perk) => (
                <View key={perk.title} style={styles.perk}>
                  <View style={styles.perkIcon}>
                    <Feather name={perk.icon} size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.perkText}>
                    <Text style={styles.perkTitle}>{perk.title}</Text>
                    <Text style={styles.perkBody}>{perk.body}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/signup')}
              style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
            >
              <Text style={styles.ctaText}>Create an account</Text>
              <Feather name="arrow-right" size={18} color={BRAND.blueDeep} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/login')}
              style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
            >
              <Text style={styles.ghostText}>I already have an account</Text>
            </Pressable>
          </BlurView>
        </Animated.View>

        <Text style={styles.legal}>
          Prescription items are dispensed only after a licensed pharmacist reviews your upload.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.blueDeep },
  safe: { flex: 1, justifyContent: 'space-between', paddingHorizontal: SPACE.xl, paddingBottom: SPACE.lg },

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
  tagline: {
    marginTop: 4,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.72)',
  },

  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
    padding: SPACE.xl,
  },
  cardOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(4,18,60,0.34)' },
  headline: { fontSize: 25, fontWeight: '800', color: '#FFFFFF', lineHeight: 32, letterSpacing: -0.4 },

  perks: { marginTop: SPACE.xl, gap: SPACE.lg },
  perk: { flexDirection: 'row', gap: SPACE.md, alignItems: 'flex-start' },
  perkIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkText: { flex: 1 },
  perkTitle: { fontSize: 14.5, fontWeight: '800', color: '#FFFFFF' },
  perkBody: { marginTop: 2, fontSize: 12.5, fontWeight: '500', lineHeight: 18, color: 'rgba(255,255,255,0.72)' },

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
  ghost: { marginTop: SPACE.md, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.88)' },
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
