/**
 * Account creation. Supabase's `handle_new_user` trigger copies `full_name`,
 * `phone` and `role` out of the sign-up metadata into `profiles`, so everything
 * this screen collects has to go through `options.data` — see SessionProvider.
 */
import { SPACE, TYPE } from '@pharmago/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Field, GlassButton, ScreenHeader } from '@/src/components';
import { useSession } from '@/src/state/SessionProvider';
import { useToast } from '@/src/state/ToastProvider';
import { useTheme } from '@/src/theme';

type Errors = Partial<Record<'fullName' | 'email' | 'phone' | 'dateOfBirth' | 'password' | 'confirm', string>>;

/** Nigerian mobile numbers, with or without the +234 country code. */
const PHONE_RE = /^(\+?234|0)[789]\d{9}$/;
const STRENGTH_LABEL = ['', 'Weak', 'Getting there', 'Strong'] as const;

/** Rough 0–3 score. Not security — just a nudge away from "password1". */
function strengthOf(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1;
  return score;
}

export default function Signup() {
  const router = useRouter();
  const { colors } = useTheme();
  const { signUp } = useSession();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const formatDateOfBirth = (date: Date | undefined): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const strength = strengthOf(password);
  const strengthColor = [colors.border, colors.danger, colors.warning, colors.accentDeep][strength];

  const clear = (key: keyof Errors) => {
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async () => {
    const next: Errors = {};
    if (!fullName.trim()) next.fullName = 'Tell us your name.';
    else if (fullName.trim().length < 3) next.fullName = 'That name looks too short.';

    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "That email doesn't look right.";

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!cleanPhone) next.phone = 'We need a number for delivery updates.';
    else if (!PHONE_RE.test(cleanPhone)) next.phone = 'Enter a valid Nigerian mobile number.';

    if (!dateOfBirth) next.dateOfBirth = 'Enter your date of birth.';
    else {
      const today = new Date();
      const age = today.getFullYear() - dateOfBirth.getFullYear();
      const monthDiff = today.getMonth() - dateOfBirth.getMonth();
      const ageInYears = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate()) 
        ? age - 1 
        : age;
      
      if (ageInYears < 14) {
        next.dateOfBirth = 'You must be at least 14 years old to use this app.';
      } else if (ageInYears > 120) {
        next.dateOfBirth = 'Please enter a valid date of birth.';
      }
    }

    if (!password) next.password = 'Choose a password.';
    else if (password.length < 8) next.password = 'Use at least 8 characters.';

    if (confirm !== password) next.confirm = 'Both passwords must match.';

    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      // Use backend API for signup instead of direct Supabase
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/customers/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: cleanPhone,
          date_of_birth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : null,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      if (data.needsConfirmation) {
        toast.success('Check your inbox to confirm your email, then sign in.');
        router.replace('/(auth)/login');
      } else {
        toast.success('Account created successfully! You can now sign in.');
        router.replace('/(auth)/login');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create your account.');
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
            title="Create account"
            subtitle="A few details and you're in"
            onBack={() => router.back()}
          />

          <View style={styles.form}>
            <Field
              label="Full name"
              icon="user"
              placeholder="Ada Okafor"
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                clear('fullName');
              }}
              error={errors.fullName}
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
            />

            <Field
              label="Email address"
              icon="mail"
              placeholder="you@example.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                clear('email');
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
              placeholder="0803 123 4567"
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                clear('phone');
              }}
              error={errors.phone}
              autoComplete="tel"
              keyboardType="phone-pad"
              inputMode="tel"
              returnKeyType="next"
            />

            <Pressable onPress={() => setShowDatePicker(true)}>
              <Field
                label="Date of birth"
                icon="calendar"
                placeholder="YYYY-MM-DD"
                value={formatDateOfBirth(dateOfBirth)}
                error={errors.dateOfBirth}
                autoComplete="birthdate-full"
                keyboardType="numbers-and-punctuation"
                inputMode="text"
                returnKeyType="next"
                editable={false}
              />
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth || new Date(2000, 0, 1)}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  if (event.type === 'set' && selectedDate) {
                    setDateOfBirth(selectedDate);
                    clear('dateOfBirth');
                  }
                  setShowDatePicker(false);
                }}
              />
            )}

            <View>
              <Field
                label="Password"
                icon="lock"
                placeholder="At least 8 characters"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  clear('password');
                  clear('confirm');
                }}
                error={errors.password}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                returnKeyType="next"
              />
              {!!password && !errors.password && (
                <View style={styles.strength}>
                  <View style={styles.bars}>
                    {[1, 2, 3].map((step) => (
                      <View
                        key={step}
                        style={[
                          styles.bar,
                          { backgroundColor: step <= strength ? strengthColor : colors.border },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[TYPE.caption, { color: colors.mutedText }]}>
                    {STRENGTH_LABEL[strength]}
                  </Text>
                </View>
              )}
            </View>

            <Field
              label="Confirm password"
              icon="check-circle"
              placeholder="Type it once more"
              value={confirm}
              onChangeText={(t) => {
                setConfirm(t);
                clear('confirm');
              }}
              error={errors.confirm}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              returnKeyType="go"
              onSubmitEditing={submit}
            />

            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setShowPassword((v) => !v)}
              style={styles.toggle}
            >
              <Text style={[TYPE.caption, { color: colors.mutedText }]}>
                {showPassword ? 'Hide passwords' : 'Show passwords'}
              </Text>
            </Pressable>

            <GlassButton
              title="Create account"
              icon="user-plus"
              loading={busy}
              onPress={submit}
            />

            <Text style={[TYPE.caption, styles.legal, { color: colors.faintText }]}>
              By continuing you agree that a licensed pharmacist may review any prescription you
              upload before your order is dispensed.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={[TYPE.body, { color: colors.mutedText }]}>Already registered? </Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.replace('/(auth)/login')}>
              <Text style={[TYPE.body, { color: colors.primary, fontWeight: '800' }]}>Sign in</Text>
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
  form: { gap: SPACE.lg },
  strength: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginTop: SPACE.sm },
  bars: { flexDirection: 'row', gap: 4, flex: 1 },
  bar: { flex: 1, height: 4, borderRadius: 999 },
  toggle: { alignSelf: 'flex-start' },
  legal: { lineHeight: 17 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: SPACE.xxl },
});

