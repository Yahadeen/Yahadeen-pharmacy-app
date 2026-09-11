/**
 * Custom modal components for confirmations and alerts.
 * Replaces native Alert.alert with themed, animated modals.
 */
import { Feather } from '@expo/vector-icons';
import { RADIUS, SPACE, TYPE } from '@pharmago/shared';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { GlassButton } from './Glass';
import { useTheme } from '@/src/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Confirmation modal with themed design.
 * Used for destructive actions like logout, delete, etc.
 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onCancel}>
          <View style={styles.modalContainer}>
            <Pressable
              style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.iconContainer, { backgroundColor: destructive ? colors.dangerSoft : colors.primarySoft }]}>
                <Feather
                  name={destructive ? 'alert-triangle' : 'help-circle'}
                  size={24}
                  color={destructive ? colors.danger : colors.primary}
                />
              </View>

              <Text style={[TYPE.heading, styles.title, { color: colors.text }]}>{title}</Text>
              <Text style={[TYPE.body, styles.message, { color: colors.mutedText }]}>{message}</Text>

              <View style={styles.buttonContainer}>
                <GlassButton
                  title={cancelText}
                  variant="ghost"
                  onPress={onCancel}
                  disabled={loading}
                  style={styles.button}
                />
                <GlassButton
                  title={confirmText}
                  variant={destructive ? 'danger' : 'primary'}
                  onPress={onConfirm}
                  loading={loading}
                  style={styles.button}
                />
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    paddingHorizontal: SPACE.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: RADIUS.xl,
    padding: SPACE.xl,
    gap: SPACE.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACE.md,
    marginTop: SPACE.sm,
  },
  button: {
    flex: 1,
  },
});
