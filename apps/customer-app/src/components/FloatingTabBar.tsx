/**
 * Telegram-style floating tab bar: a compact, content-sized pill centred at the
 * bottom of the screen. The focused tab expands into a solid brand pill with its
 * icon and label; the others stay icon-only.
 *
 * Ported from `worknow-mobile` and trimmed to three tabs — fewer mounted screens
 * means a lighter app, which is the point.
 */
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACE } from '@pharmago/shared';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';

export type TabItem = {
  /** Must match the route file name in `app/(app)/(tabs)/`. */
  name: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
};

const SPRING = { damping: 20, stiffness: 220, mass: 0.7 } as const;

function TabButton({
  item,
  focused,
  onPress,
  onLongPress,
}: {
  item: TabItem;
  focused: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const { colors } = useTheme();
  // Animating the label's width/opacity is what makes the pill feel like it
  // grows rather than snapping between two layouts.
  const progress = useDerivedValue(() => withSpring(focused ? 1 : 0, SPRING), [focused]);

  const labelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    maxWidth: progress.value * 90,
    marginLeft: progress.value * (SPACE.xs + 2),
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={item.title}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.item, focused && { backgroundColor: colors.primary }]}
    >
      <Feather name={item.icon} size={20} color={focused ? colors.onPrimary : colors.mutedText} />
      <Animated.Text
        numberOfLines={1}
        style={[styles.itemLabel, labelStyle, { color: colors.onPrimary }]}
      >
        {item.title}
      </Animated.Text>
    </Pressable>
  );
}

export function FloatingTabBar({
  state,
  navigation,
  tabs,
}: Pick<BottomTabBarProps, 'state' | 'navigation'> & { tabs: TabItem[] }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.barWrap, { bottom: insets.bottom > 0 ? insets.bottom : SPACE.md }]}
    >
      <BlurView
        intensity={70}
        tint={colors.blurTint}
        style={[styles.bar, { borderColor: colors.glassBorder, shadowColor: colors.shadow }]}
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass }]} />
        {state.routes.map((route, index) => {
          const item = tabs.find((t) => t.name === route.name);
          if (!item) return null;

          const focused = state.index === index;
          const press = () => {
            void Haptics.selectionAsync();
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          return (
            <TabButton key={route.key} item={item} focused={focused} onPress={press} />
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  barWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.sm,
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    minWidth: 44,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.pill,
  },
  itemLabel: { fontSize: 13, fontWeight: '800', overflow: 'hidden' },
});
