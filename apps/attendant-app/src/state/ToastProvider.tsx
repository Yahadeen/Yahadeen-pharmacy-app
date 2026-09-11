/**
 * Lightweight toast host. One toast at a time, auto-dismissed, tapping clears it.
 * Rendered above everything by sitting at the root of the provider tree.
 */
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACE } from '@pharmago/shared';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';

type ToastKind = 'success' | 'error' | 'info';

type Toast = { id: number; kind: ToastKind; message: string };

type ToastValue = {
  show: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastValue | null>(null);

const ICON: Record<ToastKind, keyof typeof Feather.glyphMap> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'info',
};

export function ToastProvider({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    nextId.current += 1;
    setToast({ id: nextId.current, kind, message });
    void Haptics.notificationAsync(
      kind === 'error'
        ? Haptics.NotificationFeedbackType.Error
        : kind === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
    );
    timer.current = setTimeout(() => setToast(null), kind === 'error' ? 4200 : 2800);
  }, []);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const value = useMemo<ToastValue>(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error'),
    }),
    [show],
  );

  const accent =
    toast?.kind === 'success'
      ? colors.success
      : toast?.kind === 'error'
        ? colors.danger
        : colors.primary;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {!!toast && (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.duration(220)}
          exiting={FadeOutUp.duration(180)}
          pointerEvents="box-none"
          style={[styles.host, { top: insets.top + SPACE.sm }]}
        >
          <Pressable onPress={() => setToast(null)} style={styles.press}>
            <BlurView
              intensity={60}
              tint={colors.blurTint}
              style={[styles.toast, { borderColor: colors.glassBorder, shadowColor: colors.shadow }]}
            >
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassStrong }]} />
              <View style={[styles.dot, { backgroundColor: accent }]}>
                <Feather name={ICON[toast.kind]} size={13} color={colors.surface} />
              </View>
              <Text numberOfLines={3} style={[styles.text, { color: colors.text }]}>
                {toast.message}
              </Text>
            </BlurView>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside <ToastProvider>');
  return value;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: SPACE.lg, right: SPACE.lg, zIndex: 100 },
  press: { width: '100%' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, fontSize: 13.5, fontWeight: '600', lineHeight: 19 },
});
