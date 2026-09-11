/**
 * Guard for every signed-in route. Anyone without a session is bounced to the
 * welcome screen; while the stored session is still being read we render nothing
 * so the splash stays up (see `app/_layout.tsx`).
 */
import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/src/state/SessionProvider';

export default function AppLayout() {
  const { status } = useSession();

  if (status === 'loading') return null;
  if (status === 'signed_out') return <Redirect href="/(auth)/welcome" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="product/[id]" />
      <Stack.Screen name="category/[slug]" />
      <Stack.Screen name="order/[id]" />
      <Stack.Screen name="search" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="profile-edit" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
