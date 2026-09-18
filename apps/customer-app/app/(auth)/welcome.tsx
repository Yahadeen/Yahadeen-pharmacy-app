import { Feather } from '@expo/vector-icons';
import { BRAND, RADIUS, SPACE } from '@pharmago/shared';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const BENEFITS = [
  { icon: 'search', title: 'Search', body: 'Verified medicines and wellness items.' },
  { icon: 'file-text', title: 'Upload', body: 'Prescription review before release.' },
  { icon: 'truck', title: 'Track', body: 'Live updates from counter to delivery.' },
] as const;

const STEPS = ['Paid', 'Review', 'Packed', 'Delivery'];

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#F7FAFF', '#EAF2FF', '#ECFBF2']}
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
            <Text style={styles.appLabel}>Customer app</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(520)} style={styles.hero}>
            <Text style={styles.kicker}>Pharmacy delivery</Text>
            <Text style={styles.title}>Get your medicines without the queue.</Text>
            <Text style={styles.subtitle}>
              Upload prescriptions, confirm payment, and follow every order update in one calm,
              simple flow.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(190).duration(560)} style={styles.previewShell}>
            <View style={styles.preview}>
              <View style={styles.previewHeader}>
                <View>
                  <Text style={styles.previewLabel}>Today&apos;s order</Text>
                  <Text style={styles.previewCode}>YD-482915</Text>
                </View>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Preparing</Text>
                </View>
              </View>

              <View style={styles.timeline}>
                {STEPS.map((step, index) => (
                  <View key={step} style={styles.timelineStep}>
                    <View style={[styles.stepDot, index < 3 && styles.stepDotDone]}>
                      {index < 3 ? <Feather name="check" size={12} color="#FFFFFF" /> : null}
                    </View>
                    <Text style={[styles.stepText, index < 3 && styles.stepTextDone]}>{step}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.prescriptionRow}>
                <View style={styles.prescriptionIcon}>
                  <Feather name="file-text" size={18} color={BRAND.blue} />
                </View>
                <View style={styles.prescriptionText}>
                  <Text style={styles.prescriptionTitle}>Prescription attached</Text>
                  <Text style={styles.prescriptionBody}>Pharmacist review in progress</Text>
                </View>
                <Feather name="shield" size={18} color={BRAND.green} />
              </View>
            </View>
          </Animated.View>

          <View style={styles.benefitGrid}>
            {BENEFITS.map((benefit, index) => (
              <Animated.View
                key={benefit.title}
                entering={FadeInDown.delay(270 + index * 70).duration(440)}
                style={styles.benefit}
              >
                <View style={styles.benefitIcon}>
                  <Feather name={benefit.icon} size={18} color={BRAND.blue} />
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitBody}>{benefit.body}</Text>
              </Animated.View>
            ))}
          </View>

          <Animated.View entering={FadeInUp.delay(490).duration(520)} style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/signup')}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryText}>Create customer account</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/login')}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryText}>Sign in</Text>
            </Pressable>
          </Animated.View>

          <Text style={styles.footer}>Prescription-only items are released after pharmacist review.</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7FAFF' },
  safe: { flex: 1 },
  topBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 210,
    backgroundColor: 'rgba(255,255,255,0.46)',
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
    borderColor: '#DDE8FA',
    shadowColor: '#0A2B68',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  logo: { width: 58, height: 58 },
  wordmark: { marginTop: SPACE.md, fontSize: 20, fontWeight: '900', color: BRAND.blueDeep },
  appLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '900',
    color: '#6B7890',
    textTransform: 'uppercase',
  },
  hero: { marginTop: SPACE.xl, alignItems: 'center' },
  kicker: {
    fontSize: 12,
    fontWeight: '900',
    color: BRAND.green,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: SPACE.sm,
    maxWidth: 330,
    textAlign: 'center',
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    color: BRAND.blueDeep,
    letterSpacing: 0,
  },
  subtitle: {
    marginTop: SPACE.md,
    maxWidth: 330,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#536176',
  },
  previewShell: { marginTop: SPACE.xxl, alignItems: 'center' },
  preview: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: SPACE.lg,
    borderWidth: 1,
    borderColor: '#DCE8FA',
    shadowColor: '#18356D',
    shadowOpacity: 0.12,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 7,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.md,
  },
  previewLabel: { fontSize: 12, fontWeight: '800', color: '#718096' },
  previewCode: { marginTop: 2, fontSize: 22, fontWeight: '900', color: BRAND.blueDeep },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACE.md,
    paddingVertical: 8,
    backgroundColor: '#EAF7F0',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: BRAND.green },
  statusText: { fontSize: 12, fontWeight: '900', color: '#0F8A4B' },
  timeline: {
    marginTop: SPACE.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACE.xs,
  },
  timelineStep: { flex: 1, alignItems: 'center', gap: 8 },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EFF3F8',
    borderWidth: 1,
    borderColor: '#D7E0EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: BRAND.green, borderColor: BRAND.green },
  stepText: { fontSize: 11, fontWeight: '800', color: '#8A97A8', textAlign: 'center' },
  stepTextDone: { color: BRAND.blueDeep },
  prescriptionRow: {
    marginTop: SPACE.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    padding: SPACE.md,
    borderRadius: RADIUS.lg,
    backgroundColor: '#F4F8FF',
  },
  prescriptionIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prescriptionText: { flex: 1 },
  prescriptionTitle: { fontSize: 14, fontWeight: '900', color: BRAND.blueDeep },
  prescriptionBody: { marginTop: 2, fontSize: 12, fontWeight: '700', color: '#6A7788' },
  benefitGrid: { marginTop: SPACE.xl, flexDirection: 'row', gap: SPACE.sm },
  benefit: {
    flex: 1,
    minHeight: 122,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: '#E1EAF7',
    padding: SPACE.md,
    alignItems: 'center',
  },
  benefitIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: { marginTop: SPACE.sm, fontSize: 13, fontWeight: '900', color: '#1F2937' },
  benefitBody: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: '#657284',
  },
  actions: { marginTop: SPACE.xl, gap: SPACE.md },
  primaryButton: {
    minHeight: 58,
    borderRadius: RADIUS.lg,
    backgroundColor: BRAND.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    shadowColor: BRAND.blue,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  primaryText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  secondaryButton: {
    minHeight: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDE8FA',
  },
  secondaryText: { fontSize: 15, fontWeight: '900', color: BRAND.blueDeep },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  footer: {
    marginTop: SPACE.lg,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: '#687789',
  },
});
