import { SPACE, TYPE } from '@pharmago/shared';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Field, GlassButton, ScreenHeader } from '@/src/components';
import { useSession } from '@/src/state/SessionProvider';
import { useToast } from '@/src/state/ToastProvider';
import { useTheme } from '@/src/theme';

export default function Login() {
  const router = useRouter();
  const { colors } = useTheme();
  const { signIn, wrongAppError } = useSession();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "That email doesn't look right.";
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await signIn(email, password);
      // The root layout redirects once the session lands; nothing to do here.
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not sign you in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title="Welcome back" subtitle="Sign in to continue" onBack={() => router.back()} />

          <Animated.View entering={FadeInDown.duration(360)} style={styles.hero}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </Animated.View>

          {!!wrongAppError && (
            <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
              <Text style={[TYPE.label, { color: colors.warning }]}>{wrongAppError}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Field
              label="Email address"
              icon="mail"
              placeholder="you@example.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
              }}
              error={errors.email}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
              returnKeyType="next"
            />

            <Field
              label="Password"
              icon="lock"
              placeholder="••••••••"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
              }}
              error={errors.password}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              returnKeyType="go"
              onSubmitEditing={submit}
            />

            <View style={styles.row}>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setShowPassword((v) => !v)}>
                <Text style={[TYPE.caption, { color: colors.mutedText }]}>
                  {showPassword ? 'Hide password' : 'Show password'}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={[TYPE.caption, { color: colors.primary }]}>Forgot password?</Text>
              </Pressable>
            </View>

            <GlassButton
              title="Sign in"
              icon="log-in"
              loading={busy}
              onPress={submit}
              style={styles.submit}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[TYPE.body, { color: colors.mutedText }]}>New to Yahadeen Pharm Go? </Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.replace('/(auth)/signup')}>
              <Text style={[TYPE.body, { color: colors.primary, fontWeight: '800' }]}>Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: SPACE.xl, paddingTop: SPACE.md, paddingBottom: SPACE.xxl },
  hero: { alignItems: 'center', marginBottom: SPACE.xl },
  logo: { width: 92, height: 92 },
  notice: { padding: SPACE.md, borderRadius: 14, marginBottom: SPACE.lg },
  form: { gap: SPACE.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  submit: { marginTop: SPACE.xs },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: SPACE.xxl },
});
