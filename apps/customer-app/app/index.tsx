/**
 * Boot gate. Shows the brand mark while the stored Supabase session is read,
 * then hands off to the auth flow or the tab shell. Deep links still land on
 * their target route — the group layouts do their own guarding.
 */
import { BRAND } from '@pharmago/shared';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSession } from '@/src/state/SessionProvider';

export default function Boot() {
  const { status } = useSession();

  if (status === 'signed_in') return <Redirect href="/(app)/(tabs)" />;
  if (status === 'signed_out') return <Redirect href="/(auth)/welcome" />;

  return (
    <LinearGradient
      colors={['#FFFFFF', '#EEF3FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      <Animated.View entering={FadeIn.duration(400)} style={styles.center}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
          transition={200}
        />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(260).duration(420)} style={styles.footer}>
        <ActivityIndicator color={BRAND.blue} />
        <Text style={styles.tagline}>Medicine, delivered</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center' },
  logo: { width: 190, height: 190 },
  footer: { position: 'absolute', bottom: 72, alignItems: 'center', gap: 14 },
  tagline: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: BRAND.blue,
  },
});
