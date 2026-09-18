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

export interface ActionModalProps {
  visible: boolean;
  title: string;
  message?: string;
  actions: Array<{
    label: string;
    icon?: keyof typeof Feather.glyphMap;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  }>;
  onCancel: () => void;
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

/**
 * Action modal with multiple choices.
 * Used for selecting between multiple options like camera vs library, etc.
 */
export function ActionModal({
  visible,
  title,
  message,
  actions,
  onCancel,
}: ActionModalProps) {
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
              <Text style={[TYPE.heading, styles.title, { color: colors.text }]}>{title}</Text>
              {message && <Text style={[TYPE.body, styles.message, { color: colors.mutedText }]}>{message}</Text>}

              <View style={styles.actionList}>
                {actions.map((action, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.actionButton,
                      { backgroundColor: action.variant === 'danger' ? colors.dangerSoft : colors.surfaceAlt, borderColor: colors.border },
                    ]}
                    onPress={() => {
                      onCancel();
                      action.onPress();
                    }}
                  >
                    {action.icon && (
                      <Feather
                        name={action.icon}
                        size={20}
                        color={action.variant === 'danger' ? colors.danger : colors.primary}
                      />
                    )}
                    <Text
                      style={[
                        styles.actionLabel,
                        { color: action.variant === 'danger' ? colors.danger : colors.text },
                      ]}
                    >
                      {action.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <GlassButton
                title="Cancel"
                variant="ghost"
                onPress={onCancel}
                style={styles.cancelButton}
              />
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
  actionList: {
    gap: SPACE.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: SPACE.sm,
  },
});
