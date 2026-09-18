import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SPACE, TYPE } from '@pharmago/shared';
import { useTheme } from '@/src/theme';

const MIN_SCALE = 1;
const MAX_SCALE = 5;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

export function PrescriptionPreviewModal({
  visible,
  url,
  onClose,
}: {
  visible: boolean;
  url: string | null;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedX.value = 0;
    savedY.value = 0;
  }, [savedScale, savedX, savedY, scale, translateX, translateY, visible, url]);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = clamp(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= MIN_SCALE) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value <= MIN_SCALE) return;
      const maxX = (width * (scale.value - 1)) / 2;
      const maxY = (height * (scale.value - 1)) / 2;
      translateX.value = clamp(savedX.value + event.translationX, -maxX, maxX);
      translateY.value = clamp(savedY.value + event.translationY, -maxY, maxY);
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const nextScale = scale.value > 1 ? 1 : 2.4;
      scale.value = withSpring(nextScale);
      savedScale.value = nextScale;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      savedX.value = 0;
      savedY.value = 0;
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);
  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.backdrop}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.title}>Prescription</Text>
              <Text style={styles.subtitle}>Pinch or double tap to zoom</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close prescription preview"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {url ? (
            <GestureDetector gesture={composed}>
              <Animated.View collapsable={false} style={[styles.imageWrap, imageStyle]}>
                <Image source={{ uri: url }} style={styles.image} contentFit="contain" />
              </Animated.View>
            </GestureDetector>
          ) : (
            <View style={styles.empty}>
              <Feather name="file-text" size={32} color={colors.faintText} />
              <Text style={[TYPE.caption, { color: colors.faintText }]}>No prescription file</Text>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#050505',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.xl,
    paddingTop: 54,
    paddingBottom: SPACE.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  title: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  subtitle: { marginTop: 2, color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  imageWrap: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
  },
});
