/**
 * Auth + profile state for the staff app.
 *
 * The Supabase session says whether someone is signed in; the `profiles` row is
 * fetched alongside it because `role` decides whether this person belongs in the
 * staff app at all. A customer account signing in here is turned away
 * client-side and, far more importantly, by RLS on the server — this check is
 * UX, not security.
 *
 * There is deliberately no sign-up: pharmacy accounts are created by an admin in
 * the dashboard, so staff can only sign in or reset a password.
 *
 * One exception to all of it — until `.env.local` has a Supabase project in it
 * there is no session to read and no real data behind the gate, because
 * `src/lib/data.ts` is serving fixtures. Rather than strand the app on the
 * welcome screen, that case stands in the demo staff profile so the whole flow
 * is walkable on a device. Filling in the URL and anon key makes the branch dead
 * code and real auth takes over.
 */
import { STAFF_ROLES, type Profile } from '@pharmago/shared';
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

/** No Supabase project configured → walk the app on fixtures. */
const DEMO_AUTH = !isSupabaseConfigured;

export type AuthStatus = 'loading' | 'signed_out' | 'signed_in';

type SessionValue = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** Set when a sign-in succeeded but the account may not use this app. */
  wrongAppError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

const NOT_STAFF =
  'That account is a customer account. Please use the Yahadeen Pharm Go app to shop and track orders.';

export function SessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wrongAppError, setWrongAppError] = useState<string | null>(null);
  // Guards against a late `getSession()` resolving after onAuthStateChange.
  const mounted = useRef(true);

  // `data:` is renamed throughout this file — the imported `data` facade would
  // otherwise be shadowed by Supabase's own response field.
  const loadProfile = useCallback(async (userId: string) => {
    const { data: row, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle<Profile>();
    if (error) throw error;
    return row;
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
      } catch {
        // Network or RLS hiccup: keep the session, let screens retry. Treating
        // this as a sign-out would log staff out every time the Wi-Fi drops.
        row = null;
      }

      if (!mounted.current) return;

      if (row && !STAFF_ROLES.includes(row.role)) {
        setWrongAppError(NOT_STAFF);
        await supabase.auth.signOut();
        return;
      }
      if (row && !row.is_active) {
        setWrongAppError('This staff account has been disabled. Ask an admin to re-enable it.');
        await supabase.auth.signOut();
        return;
      }

      setSession(next);
      setProfile(row);
      setStatus('signed_in');
    },
    [loadProfile],
  );

  /** Demo mode only: pull the fixture staff profile and open the gate. */
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

/** Turns Supabase's terse auth errors into something worth showing an attendant. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'That email or password is not right.';
  if (m.includes('email not confirmed')) return 'This account still needs to be confirmed.';
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return "Can't reach Yahadeen Pharm Go. Check the pharmacy connection.";
  }
  return message;
}
