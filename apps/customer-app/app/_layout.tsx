import { ThemeProvider as NavThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CartProvider } from '@/src/state/CartProvider';
import { SessionProvider, useSession } from '@/src/state/SessionProvider';
import { ToastProvider } from '@/src/state/ToastProvider';
import { ThemeProvider, useTheme } from '@/src/theme';

// Hold the native splash until the stored session has been read, so the app never
// flashes the welcome screen at someone who is already signed in.
void SplashScreen.preventAutoHideAsync();
// SplashScreen.setOptions not supported in Expo Go, skip for development
if (Constants.appOwnership !== 'expo') {
  SplashScreen.setOptions({ duration: 320, fade: true });
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SessionProvider>
            <CartProvider>
              <ToastProvider>
                <RootNavigator />
              </ToastProvider>
            </CartProvider>
          </SessionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { colors, isDark } = useTheme();
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hide();
  }, [status]);

  // Feed our palette to React Navigation so screen transitions don't flash white
  // in dark mode.
  const navTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium: { fontFamily: 'System', fontWeight: '600' as const },
      bold: { fontFamily: 'System', fontWeight: '700' as const },
      heavy: { fontFamily: 'System', fontWeight: '800' as const },
    },
  };

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </NavThemeProvider>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
