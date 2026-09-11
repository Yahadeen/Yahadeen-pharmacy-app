/**
 * Edit profile. Presented as a modal from Account because it is a two-field
 * correction, not a destination.
 *
 * Email is shown but not editable: it is the sign-in identity, and changing it
 * means a Supabase re-verification round trip rather than a `profiles` update.
 * Doing that properly is its own flow, so this screen is honest about it instead
 * of offering a field that would silently fail.
 */
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACE, TYPE, isNigerianPhone, normalizeNigerianPhone } from '@pharmago/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Entrance, Field, GlassButton, ScreenHeader, StickyBar } from '@/src/components';
import { data } from '@/src/lib/data';
import { useSession } from '@/src/state/SessionProvider';
import { useToast } from '@/src/state/ToastProvider';
import { useTheme } from '@/src/theme';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'PG';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function formatDateOfBirth(date: Date | undefined): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ProfileEdit() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, user, refreshProfile } = useSession();
  const toast = useToast();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
    profile?.date_of_birth ? new Date(profile.date_of_birth) : undefined
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState(
    profile?.preferred_payment_method ?? 'card'
  );
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string; dateOfBirth?: string }>({});
  const [saving, setSaving] = useState(false);

  const email = profile?.email ?? user?.email ?? null;
  const dirty =
    fullName.trim() !== (profile?.full_name ?? '').trim() ||
    normalizeNigerianPhone(phone) !== normalizeNigerianPhone(profile?.phone ?? '') ||
    formatDateOfBirth(dateOfBirth) !== (profile?.date_of_birth ?? '') ||
    preferredPaymentMethod !== (profile?.preferred_payment_method ?? 'card') ||
    avatarUrl !== (profile?.avatar_url ?? null);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        try {
          const uploadResult = await data.uploadAvatar(result.assets[0].uri);
          setAvatarUrl(uploadResult.url);
          toast.success('Avatar uploaded successfully!');
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to upload avatar');
        } finally {
          setUploading(false);
        }
      }
    } catch (err) {
      toast.error('Failed to pick image');
    }
  };

  const close = () => {
    if (!dirty) {
      router.back();
      return;
    }
    Alert.alert('Discard changes?', 'Your edits will not be saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const save = async () => {
    const next: { fullName?: string; phone?: string; dateOfBirth?: string } = {};
    if (fullName.trim().length < 2) next.fullName = 'Tell us what to call you.';
    if (!phone.trim()) next.phone = 'We need a number for delivery updates.';
    else if (!isNigerianPhone(phone)) next.phone = 'That does not look like a Nigerian number.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await data.updateMe({
        full_name: fullName.trim(),
        phone: normalizeNigerianPhone(phone),
        date_of_birth: formatDateOfBirth(dateOfBirth) || null,
        preferred_payment_method: preferredPaymentMethod,
        avatar_url: avatarUrl,
      });
      await refreshProfile();
      toast.success('Profile updated.');
      router.back();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Those changes did not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.gutter}>
        <ScreenHeader
          title="Edit profile"
          subtitle="How the pharmacy and your rider reach you"
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={10}
              onPress={close}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}
            >
              <Feather name="x" size={18} color={colors.text} />
            </Pressable>
          }
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Entrance>
            <View style={styles.avatarBlock}>
              <Pressable onPress={pickImage} disabled={uploading} style={styles.avatarPressable}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                      {initials(fullName || profile?.full_name || '')}
                    </Text>
                  </View>
                )}
                {uploading && (
                  <View style={[styles.avatarOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <Text style={[styles.uploadingText, { color: '#fff' }]}>Uploading...</Text>
                  </View>
                )}
              </Pressable>
              <Pressable onPress={pickImage} disabled={uploading}>
                <Text style={[TYPE.label, styles.avatarNote, { color: colors.primary }]}>
                  {uploading ? 'Uploading...' : 'Tap to change photo'}
                </Text>
              </Pressable>
              <Text style={[TYPE.caption, styles.avatarHint, { color: colors.faintText }]}>
                JPEG, PNG, WebP, or GIF (max 5MB)
              </Text>
            </View>

            <Field
              label="Full name"
              icon="user"
              placeholder="Ada Okafor"
              autoCapitalize="words"
              autoComplete="name"
              value={fullName}
              error={errors.fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              style={styles.field}
            />

            <Field
              label="Phone"
              icon="phone"
              placeholder="08031234567"
              keyboardType="phone-pad"
              autoComplete="tel"
              value={phone}
              error={errors.phone}
              onChangeText={(text) => {
                setPhone(text);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              style={styles.field}
            />

            <Pressable onPress={() => setShowDatePicker(true)}>
              <Field
                label="Date of birth"
                icon="calendar"
                placeholder="YYYY-MM-DD"
                value={formatDateOfBirth(dateOfBirth)}
                error={errors.dateOfBirth}
                style={styles.field}
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
                  setShowDatePicker(false);
                  if (event.type === 'set' && selectedDate) {
                    setDateOfBirth(selectedDate);
                    if (errors.dateOfBirth) setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
                  }
                }}
              />
            )}

            <Text style={[TYPE.label, styles.fieldLabel, { color: colors.mutedText }]}>
              Preferred payment method
            </Text>
            <View style={styles.paymentRow}>
              {[
                { value: 'card', label: 'Card', icon: 'credit-card' },
                { value: 'bank_transfer', label: 'Bank Transfer', icon: 'arrow-right-circle' },
                { value: 'opay', label: 'OPay', icon: 'smartphone' },
              ].map((method) => (
                <Pressable
                  key={method.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: preferredPaymentMethod === method.value }}
                  onPress={() => setPreferredPaymentMethod(method.value)}
                  style={[
                    styles.paymentOption,
                    {
                      backgroundColor:
                        preferredPaymentMethod === method.value ? colors.primarySoft : colors.surface,
                      borderColor:
                        preferredPaymentMethod === method.value ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={method.icon as any}
                    size={16}
                    color={preferredPaymentMethod === method.value ? colors.primary : colors.mutedText}
                  />
                  <Text
                    style={[
                      TYPE.caption,
                      {
                        color:
                          preferredPaymentMethod === method.value ? colors.primary : colors.mutedText,
                      },
                    ]}
                  >
                    {method.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[TYPE.label, styles.readonlyLabel, { color: colors.mutedText }]}>
              Email
            </Text>
            <View
              style={[
                styles.readonly,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
              ]}
            >
              <Feather name="mail" size={17} color={colors.faintText} />
              <Text numberOfLines={1} style={[TYPE.body, styles.flex, { color: colors.mutedText }]}>
                {email ?? 'Not set'}
              </Text>
              <Feather name="lock" size={14} color={colors.faintText} />
            </View>
            <Text style={[TYPE.caption, styles.hint, { color: colors.faintText }]}>
              This is how you sign in. Contact support if it needs to change.
            </Text>

            <View
              style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Feather name="shield" size={16} color={colors.primary} />
              <Text style={[TYPE.caption, styles.noticeText, { color: colors.mutedText }]}>
                Your phone number is shared with the rider handling your delivery, and with the
                pharmacist if they need to ask about a prescription. Nothing else is shared.
              </Text>
            </View>
          </Entrance>
        </ScrollView>
      </KeyboardAvoidingView>

      <StickyBar>
        <GlassButton
          title="Save changes"
          icon="check"
          loading={saving}
          disabled={!dirty}
          onPress={save}
        />
      </StickyBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gutter: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.md },
  scroll: { paddingHorizontal: SPACE.xl, paddingBottom: SPACE.xl },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarBlock: { alignItems: 'center', marginBottom: SPACE.xxl },
  avatarPressable: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.pill,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: { fontSize: 12, fontWeight: '600' },
  avatarText: { fontSize: 26, fontWeight: '900', letterSpacing: 0.5 },
  avatarNote: { marginTop: SPACE.md },
  avatarHint: { marginTop: 4 },

  field: { marginBottom: SPACE.lg },
  fieldLabel: { marginBottom: 6 },

  paymentRow: { flexDirection: 'row', gap: SPACE.sm, marginBottom: SPACE.lg },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },

  readonlyLabel: { marginBottom: 6 },
  readonly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    minHeight: 50,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  hint: { marginTop: 6, lineHeight: 16 },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.md,
    marginTop: SPACE.xxl,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  noticeText: { flex: 1, lineHeight: 17, fontWeight: '500' },
});
