/**
 * Glass primitives — the visual signature of both Yahadeen apps.
 *
 * Anatomy of a panel, and why it is three views deep:
 *
 *   outer View    carries the shadow/glow — must NOT be clipped or the halo dies
 *     inner View  the only `overflow: 'hidden'`, so the blur fill reaches the
 *                 rounded corner instead of leaving a light inner ring
 *       BlurView  absoluteFill
 *       View      absoluteFill translucent overlay (`glass` / `glassStrong`)
 *       content
 *     View        absolute border overlay, painted over the fill
 *
 * On Android `BlurView` falls back to a plain translucent fill unless the tree
 * sits inside a `BlurTargetView`; that overlay is what keeps text legible there.
 */
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACE } from '@pharmago/shared';
import { BlurView } from 'expo-blur';
import { forwardRef, useEffect, type ComponentRef, type PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/src/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type FeatherName = keyof typeof Feather.glyphMap;

/** Fade + slide-up on mount. `delay` staggers list items. */
export function useEntrance(delay = 0, distance = 16) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress, delay]);
  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));
}

export function Entrance({
  children,
  delay = 0,
  distance = 16,
  style,
}: PropsWithChildren<{ delay?: number; distance?: number; style?: StyleProp<ViewStyle> }>) {
  const anim = useEntrance(delay, distance);
  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
}

export type GlassCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  /** Inner padding. Pass `false` for edge-to-edge content such as an image. */
  padded?: boolean;
  intensity?: number;
  /** Softer fill — use when cards are stacked on a busy background. */
  subtle?: boolean;
  /** Blue halo instead of a neutral drop shadow. Reads well in dark mode. */
  glow?: boolean;
  onPress?: () => void;
}>;

export function GlassCard({
  children,
  style,
  padded = true,
  intensity = 40,
  subtle = false,
  glow = false,
  onPress,
}: GlassCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const shadowStyle: ViewStyle = glow
    ? {
        shadowColor: colors.primary,
        shadowOpacity: 0.32,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
      }
    : {
        shadowColor: colors.shadow,
        shadowOpacity: 0.09,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
      };

  const inner = (
    // Opaque backing so the shadow renders on both platforms. Fully covered by
    // the clip below, so it never shows through.
    <View style={[styles.cardWrap, { backgroundColor: colors.surface }, shadowStyle, style]}>
      <View style={styles.cardClip}>
        <BlurView intensity={intensity} tint={colors.blurTint} style={StyleSheet.absoluteFill} />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: subtle ? colors.glass : colors.glassStrong },
          ]}
        />
        <View style={padded ? styles.cardContent : undefined}>{children}</View>
      </View>
      <View pointerEvents="none" style={[styles.cardBorder, { borderColor: colors.glassBorder }]} />
    </View>
  );

  if (!onPress) return inner;
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 18 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18 });
      }}
      style={animStyle}
    >
      {inner}
    </AnimatedPressable>
  );
}

export type GlassButtonVariant = 'primary' | 'accent' | 'glass' | 'ghost' | 'danger';

export type GlassButtonProps = {
  title: string;
  variant?: GlassButtonVariant;
  icon?: FeatherName;
  /** Render the icon after the label — for "Continue →" style buttons. */
  iconRight?: boolean;
  size?: 'md' | 'sm';
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * `primary` solid brand blue · `accent` solid brand green (confirm/complete)
 * `glass` frosted with a blue hairline · `ghost` bare · `danger` destructive.
 */
export const GlassButton = forwardRef<ComponentRef<typeof Pressable>, GlassButtonProps>(
  function GlassButton(
    {
      title,
      variant = 'primary',
      icon,
      iconRight = false,
      size = 'md',
      onPress,
      loading = false,
      disabled = false,
      style,
    },
    ref,
  ) {
    const { colors } = useTheme();
    const scale = useSharedValue(1);
    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const blocked = disabled || loading;
    const fg =
      variant === 'primary'
        ? colors.onPrimary
        : variant === 'accent'
          ? colors.onAccent
          : variant === 'danger'
            ? colors.onStatus
            : variant === 'glass'
              ? colors.primary
              : colors.text;

    const iconNode = icon ? <Feather name={icon} size={size === 'sm' ? 15 : 18} color={fg} /> : null;
    const body = (
      <View style={styles.btnContent}>
        {loading ? (
          <ActivityIndicator color={fg} size="small" />
        ) : (
          <>
            {!iconRight && iconNode}
            <Text style={[styles.btnText, size === 'sm' && styles.btnTextSm, { color: fg }]}>
              {title}
            </Text>
            {iconRight && iconNode}
          </>
        )}
      </View>
    );

    const shape = [styles.btn, size === 'sm' && styles.btnSm];

    return (
      <AnimatedPressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: blocked, busy: loading }}
        onPress={blocked ? undefined : onPress}
        disabled={blocked}
        onPressIn={() => {
          if (!blocked) scale.value = withSpring(0.96, { damping: 18 });
        }}
        onPressOut={() => {
          if (!blocked) scale.value = withSpring(1, { damping: 18 });
        }}
        style={[animStyle, { opacity: blocked ? 0.55 : 1 }, style]}
      >
        {variant === 'glass' ? (
          <BlurView
            intensity={40}
            tint={colors.blurTint}
            style={[...shape, styles.btnGlass, { borderColor: colors.primary }]}
          >
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassTint }]} />
            {body}
          </BlurView>
        ) : (
          <View
            style={[
              ...shape,
              {
                backgroundColor:
                  variant === 'primary'
                    ? colors.primary
                    : variant === 'accent'
                      ? colors.accent
                      : variant === 'danger'
                        ? colors.danger
                        : 'transparent',
              },
            ]}
          >
            {body}
          </View>
        )}
      </AnimatedPressable>
    );
  },
);

/** Small frosted pill used for icon-only actions in headers. */
export function GlassIconButton({
  icon,
  onPress,
  badge,
  accessibilityLabel,
  style,
}: {
  icon: FeatherName;
  onPress?: () => void;
  /** Rendered as a dot when 0, as a count when higher. Omit to hide. */
  badge?: number;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.92, { damping: 18 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18 });
      }}
      style={[animStyle, style]}
    >
      <View style={[styles.iconBtn, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
        <BlurView intensity={30} tint={colors.blurTint} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassStrong }]} />
        <View
          pointerEvents="none"
          style={[styles.iconBtnBorder, { borderColor: colors.glassBorder }]}
        />
        <Feather name={icon} size={19} color={colors.text} />
        {badge !== undefined && badge > 0 && (
          <View style={[styles.iconBtnBadge, { backgroundColor: colors.accent }]}>
            <Text style={[styles.iconBtnBadgeText, { color: colors.onAccent }]}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cardWrap: { borderRadius: RADIUS.lg },
  cardClip: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  cardBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  cardContent: { padding: SPACE.lg },

  btn: {
    minHeight: 54,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.lg,
  },
  btnSm: { minHeight: 40, borderRadius: RADIUS.sm, paddingHorizontal: SPACE.md },
  btnGlass: { borderWidth: 1.5, overflow: 'hidden' },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  btnText: { fontSize: 15, fontWeight: '800' },
  btnTextSm: { fontSize: 13.5 },

  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconBtnBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  iconBtnBadge: {
    position: 'absolute',
    top: 4,
    right: 3,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnBadgeText: { fontSize: 10, fontWeight: '900' },
});
