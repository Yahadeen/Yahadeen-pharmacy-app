/**
 * Password reset request, presented as a modal from the sign-in screen.
 * Supabase emails the recovery link and the reset itself finishes in the
 * browser, so this screen's job ends at "we sent it".
 */
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACE, TYPE } from '@pharmago/shared';
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
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Field, GlassButton, ScreenHeader } from '@/src/components';
import { useSession } from '@/src/state/SessionProvider';
import { useToast } from '@/src/state/ToastProvider';
import { useTheme } from '@/src/theme';

export default function ForgotPassword() {
  const router = useRouter();
  const { colors } = useTheme();
  const { sendPasswordReset } = useSession();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const value = email.trim();
    if (!value) return setError('Enter your work email address.');
    if (!/^\S+@\S+\.\S+$/.test(value)) return setError("That email doesn't look right.");
    setError(null);

    setBusy(true);
    try {
      await sendPasswordReset(value);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send the reset link.');
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
            title={sent ? 'Check your inbox' : 'Reset password'}
            subtitle={sent ? undefined : 'We will email you a secure link'}
            onBack={() => router.back()}
          />

          {sent ? (
            <Animated.View entering={FadeIn.duration(320)} style={styles.done}>
              <View style={[styles.doneIcon, { backgroundColor: colors.accentSoft }]}>
                <Feather name="mail" size={30} color={colors.accentDeep} />
              </View>
              <Text style={[TYPE.heading, styles.center, { color: colors.text }]}>Link sent</Text>
              <Text style={[TYPE.body, styles.doneBody, { color: colors.mutedText }]}>
                We emailed a reset link to{' '}
                <Text style={{ color: colors.text, fontWeight: '800' }}>{email.trim()}</Text>. Open
                it on this device to choose a new password. It expires in one hour.
              </Text>
              <GlassButton
                title="Back to sign in"
                icon="arrow-left"
                onPress={() => router.back()}
                style={styles.doneBtn}
              />
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setSent(false)}
                style={styles.retry}
              >
                <Text style={[TYPE.caption, { color: colors.primary }]}>
                  Use a different email address
                </Text>
              </Pressable>
            </Animated.View>
          ) : (
            <View style={styles.form}>
              <Text style={[TYPE.body, { color: colors.mutedText }]}>
                Enter the email address on your staff account and we will send you a link to set a
                new password. If nothing arrives, your pharmacy admin can reset it for you from the
                dashboard.
              </Text>

              <Field
                label="Work email"
                icon="mail"
                placeholder="you@pharmacy.com"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) setError(null);
                }}
                error={error}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                inputMode="email"
                returnKeyType="send"
                onSubmitEditing={submit}
              />

              <GlassButton title="Send reset link" icon="send" loading={busy} onPress={submit} />
            </View>
          )}
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
  form: { gap: SPACE.lg },
  center: { textAlign: 'center' },
  done: { alignItems: 'center', paddingTop: SPACE.xl },
  doneIcon: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.lg,
  },
  doneBody: { textAlign: 'center', marginTop: SPACE.sm, lineHeight: 21 },
  doneBtn: { alignSelf: 'stretch', marginTop: SPACE.xxl },
  retry: { marginTop: SPACE.lg },
});
