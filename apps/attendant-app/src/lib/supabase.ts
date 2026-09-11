/**
 * Supabase client for the attendant (staff) app.
 *
 * Auth tokens live in `expo-secure-store` (Keychain / Keystore) rather than
 * AsyncStorage. SecureStore rejects values over 2048 bytes and a Supabase
 * session can exceed that once the JWT carries custom claims, so the adapter
 * below transparently splits large values across numbered chunks.
 */
import 'react-native-url-polyfill/auto';

import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHUNK_SIZE = 1800;
/** Written alongside a chunked value so `getItem` knows how many parts to read. */
const countKey = (key: string) => `${key}.chunks`;
const chunkKey = (key: string, i: number) => `${key}.${i}`;

async function clearChunks(key: string) {
  const raw = await SecureStore.getItemAsync(countKey(key));
  const count = raw ? Number(raw) : 0;
  if (!count) return;
  await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(chunkKey(key, i))),
  );
  await SecureStore.deleteItemAsync(countKey(key));
}

const secureStorage: SupportedStorage = {
  async getItem(key) {
    const raw = await SecureStore.getItemAsync(countKey(key));
    if (raw) {
      const count = Number(raw);
      const parts = await Promise.all(
        Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i))),
      );
      // A missing part means a partial write; treat the whole value as absent.
      return parts.some((p) => p === null) ? null : parts.join('');
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key, value) {
    await clearChunks(key);
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    await SecureStore.deleteItemAsync(key);
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(chunkKey(key, i), c)));
    await SecureStore.setItemAsync(countKey(key), String(chunks.length));
  },

  async removeItem(key) {
    await clearChunks(key);
    await SecureStore.deleteItemAsync(key);
  },
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True once `.env.local` is filled in — screens use this to explain a blank state. */
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && __DEV__) {
  console.warn(
    '[PharmaGo] EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY are empty. ' +
      'Fill in apps/attendant-app/.env.local and restart Metro.',
  );
}

export const supabase = createClient(
  url || 'http://localhost:54321',
  anonKey || 'public-anon-key-placeholder',
  {
    auth: {
      // SecureStore has no web implementation; fall back to the default there.
      storage: Platform.OS === 'web' ? undefined : secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      // No URL to parse in a native app — this avoids a startup warning.
      detectSessionInUrl: false,
    },
  },
);
