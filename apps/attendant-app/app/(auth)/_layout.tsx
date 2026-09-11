import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/src/state/SessionProvider';

export default function AuthLayout() {
  const { status } = useSession();

  // Someone already signed in has no business on the sign-in screens — this also
  // covers arriving here from a deep link.
  if (status === 'signed_in') return <Redirect href="/(app)/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
