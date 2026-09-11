import { SPACE, TYPE } from '@pharmago/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { GlassButton } from '@/src/components';
import { useTheme } from '@/src/theme';

export default function NotFound() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Text style={[TYPE.title, styles.center, { color: colors.text }]}>
        That page has moved
      </Text>
      <Text style={[TYPE.body, styles.body, { color: colors.mutedText }]}>
        The link you followed does not point anywhere in Yahadeen Pharm Go. Head back home and try again.
      </Text>
      <GlassButton
        title="Go home"
        icon="home"
        onPress={() => router.replace('/')}
        style={styles.btn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACE.xl },
  center: { textAlign: 'center' },
  body: { textAlign: 'center', marginTop: SPACE.sm, lineHeight: 21 },
  btn: { marginTop: SPACE.xl, alignSelf: 'stretch' },
});
