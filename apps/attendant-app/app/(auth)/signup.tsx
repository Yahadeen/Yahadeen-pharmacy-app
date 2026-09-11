/**
 * Staff sign-up with invite code. Attendants can only sign up with a valid
 * invite code created by an admin. The code is verified before registration.
 */
import { SPACE, TYPE } from '@pharmago/shared';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Field, GlassButton, ScreenHeader } from '@/src/components';
import { useSession } from '@/src/state/SessionProvider';
import { useToast } from '@/src/state/ToastProvider';
import { useTheme } from '@/src/theme';

export default function Signup() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();

  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    inviteCode?: string;
    email?: string;
    fullName?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const next: typeof errors = {};
    if (!inviteCode.trim()) next.inviteCode = 'Enter your invite code.';
    if (!email.trim()) next.email = 'Enter your work email address.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "That email doesn't look right.";
    if (!fullName.trim()) next.fullName = 'Enter your full name.';
    if (!phone.trim()) next.phone = 'Enter your phone number.';
    else if (!/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ''))) next.phone = 'Enter a valid phone number.';
    if (!password) next.password = 'Enter your password.';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (!confirmPassword) next.confirmPassword = 'Confirm your password.';
    else if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match.';
    
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      // First verify the invite code
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      const verifyResponse = await fetch(`${apiUrl}/api/invites/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode.trim().toUpperCase() }),
      });

      const verifyData = await verifyResponse.json();
      
      if (!verifyResponse.ok) {
        toast.error(verifyData.error || 'Invalid or expired invite code');
        return;
      }

      // Register with the invite code
      const registerResponse = await fetch(`${apiUrl}/api/invites/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_code: inviteCode.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          phone: phone.trim(),
          password,
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        toast.error(registerData.error || 'Registration failed');
        return;
      }

      toast.success('Account created successfully! You can now sign in.');
      router.replace('/(auth)/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create account. Please try again.');
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
          <ScreenHeader
            title="Staff sign-up"
            subtitle="Create your attendant account"
            onBack={() => router.back()}
          />

          <Animated.View entering={FadeInDown.duration(360)} style={styles.hero}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </Animated.View>

          <View style={styles.form}>
            <Field
              label="Invite code"
              icon="key"
              placeholder="Enter your invite code"
              value={inviteCode}
              onChangeText={(t) => {
                setInviteCode(t.toUpperCase());
                if (errors.inviteCode) setErrors((e) => ({ ...e, inviteCode: undefined }));
              }}
              error={errors.inviteCode}
              autoCapitalize="characters"
              returnKeyType="next"
            />

            <Field
              label="Full name"
              icon="user"
              placeholder="John Doe"
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                if (errors.fullName) setErrors((e) => ({ ...e, fullName: undefined }));
              }}
              error={errors.fullName}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Field
              label="Work email"
              icon="mail"
              placeholder="you@pharmacy.com"
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
              label="Phone number"
              icon="phone"
              placeholder="+234 800 000 0000"
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
              }}
              error={errors.phone}
              keyboardType="phone-pad"
              inputMode="tel"
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
              autoComplete="new-password"
              returnKeyType="next"
            />

            <Field
              label="Confirm password"
              icon="lock"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                if (errors.confirmPassword) setErrors((e) => ({ ...e, confirmPassword: undefined }));
              }}
              error={errors.confirmPassword}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              returnKeyType="go"
              onSubmitEditing={submit}
            />

            <View style={styles.row}>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Text style={[TYPE.caption, { color: colors.mutedText }]}>
                  {showPassword ? 'Hide passwords' : 'Show passwords'}
                </Text>
              </Pressable>
            </View>

            <GlassButton
              title="Create account"
              icon="user-plus"
              loading={busy}
              onPress={submit}
              style={styles.submit}
            />
          </View>

          <Text style={[TYPE.caption, styles.footer, { color: colors.faintText }]}>
            Already have an account?{' '}
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={[TYPE.caption, { color: colors.primary }]}>Sign in</Text>
            </Pressable>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.md,
    paddingBottom: SPACE.xxl,
  },
  hero: { alignItems: 'center', marginBottom: SPACE.xl },
  logo: { width: 92, height: 92 },
  form: { gap: SPACE.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  submit: { marginTop: SPACE.xs },
  footer: { marginTop: SPACE.xxl, textAlign: 'center', lineHeight: 17 },
});
