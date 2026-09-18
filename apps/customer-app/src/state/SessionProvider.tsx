/**
 * Auth + profile state for the customer app.
 *
 * The Supabase session is the source of truth for "is someone signed in"; the
 * `profiles` row is fetched alongside it because the app needs `role` to decide
 * whether this person belongs here at all. A pharmacy attendant signing into the
 * customer app is rejected client-side and, more importantly, by RLS on the
 * server — this check is UX, not security.
 *
 * One exception: until `.env.local` has a Supabase project in it there is no
 * session to read and no real data behind the gate — `src/lib/data.ts` is
 * serving fixtures. Rather than strand the app on the welcome screen, that case
 * stands in the demo profile so the whole flow is walkable on a device. Filling
 * in the URL and anon key makes the branch dead code and real auth takes over.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { Profile } from '@pharmago/shared';
import type { Session, User } from '@supabase/supabase-js';
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
import { data } from '@/src/lib/data';
import { isSupabaseConfigured, supabase } from '@/src/lib/supabase';

// Check if running in Expo Go (push notifications not supported in Expo Go on Android)
const isExpoGo = Constants.appOwnership === 'expo';

/** No Supabase project configured → walk the app on fixtures. */
const DEMO_AUTH = !isSupabaseConfigured;

export type AuthStatus = 'loading' | 'signed_out' | 'signed_in';

type SessionValue = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** Set when a sign-in succeeded but the account is not a customer account. */
  wrongAppError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { fullName: string; email: string; phone: string; password: string }) => Promise<{
    needsConfirmation: boolean;
  }>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

const WRONG_APP =
  'That account belongs to pharmacy staff. Please use the Yahadeen Pharm Go Staff app to sign in.';

type ExpoConstantsWithProjectId = typeof Constants & {
  expoConfig?: { extra?: { eas?: { projectId?: string } } };
  easConfig?: { projectId?: string };
};

export function SessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wrongAppError, setWrongAppError] = useState<string | null>(null);
  // Guards against a late `getSession()` resolving after onAuthStateChange.
  const mounted = useRef(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle<Profile>();
    if (error) throw error;
    return data;
  }, []);

  const registerPushToken = useCallback(async () => {
    // Push notifications disabled for Expo Go development
    // Re-enable when using development builds
    if (DEMO_AUTH || isExpoGo) return;

    try {
      // Dynamic import to avoid Expo Go errors
      const Notifications = await import('expo-notifications');
      const ConstantsModule = await import('expo-constants');
      const expoConstants = ConstantsModule.default as ExpoConstantsWithProjectId;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Order updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0036B6',
        });
      }

      const permission = await Notifications.getPermissionsAsync();
      let finalStatus = permission.status;
      if (finalStatus !== 'granted') {
        const requested = await Notifications.requestPermissionsAsync();
        finalStatus = requested.status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      // Get projectId from Constants
      const projectId =
        expoConstants.expoConfig?.extra?.eas?.projectId ??
        expoConstants.easConfig?.projectId ??
        process.env.EXPO_PUBLIC_EXPO_PROJECT_ID;

      if (!projectId) {
        console.log('Project ID not found - skipping push token registration');
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
      await data.registerPushToken(token.data, platform);
    } catch (error) {
      console.warn('Failed to register push token:', error);
      // Non-fatal: the app works without push notifications
    }
  }, []);

  const apply = useCallback(
    async (next: Session | null) => {
      if (!next) {
        if (!mounted.current) return;
        setSession(null);
        setProfile(null);
        setStatus('signed_out');
        return;
      }

      let row: Profile | null = null;
      try {
        row = await loadProfile(next.user.id);
      } catch (error) {
        // Network or RLS hiccup: keep the session, let screens retry. Treating
        // this as a sign-out would log people out every time Wi-Fi drops.
        console.warn('Failed to load profile:', error);
        row = null;
      }

      if (!mounted.current) return;

      if (row && row.role !== 'customer') {
        setWrongAppError(WRONG_APP);
        await supabase.auth.signOut();
        return;
      }
      if (row && !row.is_active) {
        setWrongAppError('This account has been disabled. Contact the pharmacy for help.');
        await supabase.auth.signOut();
        return;
      }

      setSession(next);
      setProfile(row);
      setStatus('signed_in');

      // Register push token when user signs in
      if (next && row) {
        void registerPushToken();
      }
    },
    [loadProfile, registerPushToken],
  );

  /** Demo mode only: pull the fixture profile and open the gate. */
  const enterDemo = useCallback(async () => {
    try {
      const row = await data.me();
      if (mounted.current) setProfile(row);
    } catch {
      // Screens all tolerate a null profile.
    }
    if (mounted.current) setStatus('signed_in');
  }, []);

  useEffect(() => {
    mounted.current = true;

    if (DEMO_AUTH) {
      void enterDemo();
      return () => {
        mounted.current = false;
      };
    }

    // Configure notification handler only if not in Expo Go
    if (!isExpoGo) {
      import('expo-notifications').then((Notifications) => {
        try {
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });
        } catch (error) {
          console.warn('Failed to set notification handler:', error);
        }
      }).catch((error) => {
        console.warn('Failed to import expo-notifications:', error);
      });
    }

    supabase.auth
      .getSession()
      .then(({ data: result }) => apply(result.session))
      .catch(() => mounted.current && setStatus('signed_out'));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      void apply(next);
    });

    return () => {
      mounted.current = false;
      sub.subscription.unsubscribe();
    };
  }, [apply, enterDemo]);

  const value = useMemo<SessionValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      profile,
      wrongAppError,

      signIn: async (email, password) => {
        setWrongAppError(null);
        if (DEMO_AUTH) {
          await enterDemo();
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw new Error(friendlyAuthError(error.message));
      },

      signUp: async ({ fullName, email, phone, password }) => {
        setWrongAppError(null);
        if (DEMO_AUTH) {
          await enterDemo();
          return { needsConfirmation: false };
        }
        const { data: created, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          // Consumed by the `handle_new_user` trigger to seed `profiles`.
          options: { data: { full_name: fullName.trim(), phone: phone.trim(), role: 'customer' } },
        });
        if (error) throw new Error(friendlyAuthError(error.message));
        return { needsConfirmation: !created.session };
      },

      sendPasswordReset: async (email) => {
        if (DEMO_AUTH) return;
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
        if (error) throw new Error(friendlyAuthError(error.message));
      },

      signOut: async () => {
        if (DEMO_AUTH) {
          setProfile(null);
          setStatus('signed_out');
          return;
        }
        await supabase.auth.signOut();
      },

      refreshProfile: async () => {
        if (DEMO_AUTH) {
          try {
            const row = await data.me();
            if (mounted.current) setProfile(row);
          } catch {
            // Non-fatal; the cached profile stays on screen.
          }
          return;
        }
        if (!session?.user) return;
        try {
          const row = await loadProfile(session.user.id);
          if (mounted.current) setProfile(row);
        } catch {
          // Non-fatal; the cached profile stays on screen.
        }
      },
    }),
    [status, session, profile, wrongAppError, loadProfile, enterDemo],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>');
  return value;
}

/** Turns Supabase's terse auth errors into something worth showing a customer. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'That email or password is not right.';
  if (m.includes('email not confirmed')) return 'Please confirm your email address first.';
  if (m.includes('already registered')) return 'An account with that email already exists.';
  if (m.includes('password should be')) return 'Use at least 8 characters for your password.';
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return "Can't reach Yahadeen Pharm Go. Check your connection.";
  }
  return message;
}
