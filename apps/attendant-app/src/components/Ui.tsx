/**
 * Layout and feedback primitives. Everything here is theme-driven — no literal
 * colours — so light/dark switches with no per-screen work.
 */
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACE, TYPE, toneColors, type StatusTone } from '@pharmago/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, type PropsWithChildren, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassButton, type FeatherName } from './Glass';
import { useTheme } from '@/src/theme';

/** Height of the floating tab bar plus its bottom gap, so content can clear it. */
export const TAB_BAR_CLEARANCE = 96;

export type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  /** Adds bottom padding so the last row is not hidden by the floating tab bar. */
  tabBarPadding?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Turn off the default 20px gutter for full-bleed screens. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function Screen({
  children,
  scroll = false,
  tabBarPadding = false,
  refreshing,
  onRefresh,
  padded = true,
  style,
}: ScreenProps) {
  const { colors } = useTheme();
  const pad = [
    padded && styles.gutter,
    tabBarPadding && { paddingBottom: TAB_BAR_CLEARANCE },
  ];

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.flex, { backgroundColor: colors.background }, style]}
    >
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.grow, ...pad]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, ...pad]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

/** Screen title row. `right` takes action buttons; `onBack` renders a chevron. */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  style,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.header, style]}>
      {!!onBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={onBack}
          style={[styles.backBtn, { backgroundColor: colors.surfaceAlt }]}
        >
          <Feather name="chevron-left" size={22} color={colors.text} />
        </Pressable>
      )}
      <View style={styles.flex}>
        <Text numberOfLines={1} style={[TYPE.title, { color: colors.text }]}>
          {title}
        </Text>
        {!!subtitle && (
          <Text numberOfLines={1} style={[TYPE.label, styles.headerSub, { color: colors.mutedText }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}

/** Section divider with an optional right-hand action, e.g. "See all". */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[TYPE.heading, { color: colors.text }]}>{title}</Text>
      {!!actionLabel && !!onAction && (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onAction}>
          <Text style={[TYPE.label, { color: colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Tone-coloured status chip. Feed it `ORDER_STATUS_META[status]`. */
export function StatusPill({
  label,
  tone = 'neutral',
  icon,
  style,
}: {
  label: string;
  tone?: StatusTone;
  icon?: FeatherName;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const { fg, bg } = toneColors(colors, tone);
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      {!!icon && <Feather name={icon} size={11} color={fg} />}
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

/** The brand blue→green sweep. Used for the hero card and price banners. */
export function BrandGradient({
  children,
  style,
  radius = RADIUS.lg,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; radius?: number }>) {
  const { colors } = useTheme();
  return (
    <LinearGradient
      colors={[colors.gradientFrom, colors.gradientTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: radius, overflow: 'hidden' }, style]}
    >
      {children}
    </LinearGradient>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }, style]} />;
}

/** Label + value row, as used on receipts and order summaries. */
export function DetailRow({
  label,
  value,
  strong = false,
  valueColor,
}: {
  label: string;
  value: string;
  strong?: boolean;
  valueColor?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text style={[TYPE.body, { color: colors.mutedText }]}>{label}</Text>
      <Text
        style={[
          strong ? TYPE.heading : TYPE.body,
          { color: valueColor ?? colors.text, fontWeight: strong ? '800' : '700' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: FeatherName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
        <Feather name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={[TYPE.heading, styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[TYPE.body, styles.emptyMsg, { color: colors.mutedText }]}>{message}</Text>
      {!!actionLabel && !!onAction && (
        <GlassButton title={actionLabel} onPress={onAction} style={styles.emptyBtn} />
      )}
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
      {!!label && (
        <Text style={[TYPE.label, styles.loadingLabel, { color: colors.mutedText }]}>{label}</Text>
      )}
    </View>
  );
}

/** Pulsing placeholder block. Match its size to the content it stands in for. */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = RADIUS.sm,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const anim = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.skeleton },
        anim,
        style,
      ]}
    />
  );
}

/** Text field with a floating label and inline error text. */
export function Field({
  label,
  error,
  icon,
  style,
  ...inputProps
}: TextInputProps & { label: string; error?: string | null; icon?: FeatherName; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={style}>
      <Text style={[TYPE.label, styles.fieldLabel, { color: colors.mutedText }]}>{label}</Text>
      <View
        style={[
          styles.fieldBox,
          {
            backgroundColor: colors.surfaceAlt,
            borderColor: error ? colors.danger : colors.border,
          },
        ]}
      >
        {!!icon && <Feather name={icon} size={17} color={colors.faintText} />}
        <TextInput
          placeholderTextColor={colors.faintText}
          style={[styles.fieldInput, { color: colors.text }]}
          {...inputProps}
        />
      </View>
      {!!error && (
        <Text style={[TYPE.caption, styles.fieldError, { color: colors.danger }]}>{error}</Text>
      )}
    </View>
  );
}

/** −/+ quantity control. `max` caps at available stock. */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  compact = false,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const size = compact ? 28 : 34;

  const step = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) onChange(next);
  };

  return (
    <View style={[styles.stepper, { backgroundColor: colors.surfaceAlt }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        disabled={value <= min}
        onPress={() => step(-1)}
        style={[styles.stepperBtn, { width: size, height: size, opacity: value <= min ? 0.35 : 1 }]}
      >
        <Feather name="minus" size={compact ? 14 : 16} color={colors.text} />
      </Pressable>
      <Text style={[styles.stepperValue, { color: colors.text }]}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        disabled={value >= max}
        onPress={() => step(1)}
        style={[styles.stepperBtn, { width: size, height: size, opacity: value >= max ? 0.35 : 1 }]}
      >
        <Feather name="plus" size={compact ? 14 : 16} color={colors.text} />
      </Pressable>
    </View>
  );
}

/** Bottom action bar that floats above the safe-area inset — checkout, cart, etc. */
export function StickyBar({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.stickyBar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, SPACE.md),
        },
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Compact segmented control — the queue's Active / Handed off / Done switch.
 * Generic over the option value so callers keep their own union type.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.surfaceAlt }, style]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, active && { backgroundColor: colors.surface }]}
          >
            <Text
              numberOfLines={1}
              style={[styles.segmentText, { color: active ? colors.primary : colors.mutedText }]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
  gutter: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.md },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    marginBottom: SPACE.lg,
  },
  headerSub: { marginTop: 2 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.md,
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACE.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  pillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  divider: { height: StyleSheet.hairlineWidth, marginVertical: SPACE.md },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },

  empty: { alignItems: 'center', paddingVertical: SPACE.xxxl, paddingHorizontal: SPACE.xl },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.lg,
  },
  emptyTitle: { textAlign: 'center' },
  emptyMsg: { textAlign: 'center', marginTop: SPACE.xs, lineHeight: 21 },
  emptyBtn: { marginTop: SPACE.xl, alignSelf: 'stretch' },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACE.md },
  loadingLabel: { marginTop: SPACE.xs },

  fieldLabel: { marginBottom: 6 },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    minHeight: 52,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  fieldInput: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: SPACE.md },
  fieldError: { marginTop: 5 },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    padding: 3,
  },
  stepperBtn: { alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.pill },
  stepperValue: { minWidth: 26, textAlign: 'center', fontSize: 14, fontWeight: '800' },

  segmented: { flexDirection: 'row', borderRadius: RADIUS.pill, padding: 3, gap: 2 },
  segment: {
    flex: 1,
    minHeight: 34,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.sm,
  },
  segmentText: { fontSize: 12.5, fontWeight: '800' },

  stickyBar: {
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: SPACE.md,
  },
});
