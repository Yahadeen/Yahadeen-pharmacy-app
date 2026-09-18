/**
 * Typed client for the Next.js API (`apps/admin-app/src/app/api/*`).
 *
 * Staff surface only — this app never reaches for cart, checkout or payment
 * routes. Every request carries the current Supabase access token as a bearer
 * header; the route handlers verify it and derive the caller's role from
 * `profiles`, so a client claiming to be an attendant proves nothing.
 */
import * as FileSystem from 'expo-file-system/legacy';
import type {
  AppNotification,
  OrderDetail,
  OrderStatus,
  OrderSummary,
  Paginated,
  ProductQuery,
  ProductWithStock,
  Profile,
  StockMovement,
  SupportTicket,
} from '@pharmago/shared';
import { supabase } from './supabase';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** True when retrying might work — offline, timeout, or a 5xx. */
  get isRetryable() {
    return this.status === 0 || this.status >= 500;
  }
}

const TIMEOUT_MS = 20_000;

async function request<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError(
      0,
      'no_api_url',
      'EXPO_PUBLIC_API_URL is not set. Add it to .env.local and restart Metro.',
    );
  }

  const { auth = true, headers, ...rest } = init;
  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
    ...((headers as Record<string, string>) ?? {}),
  };

  if (auth) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    throw new ApiError(
      0,
      aborted ? 'timeout' : 'network',
      aborted
        ? 'The request timed out. Check the pharmacy connection.'
        : "Can't reach Yahadeen Pharm Go right now.",
    );
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const body = text ? safeParse(text) : null;

  if (!res.ok) {
    const err = (body ?? {}) as { error?: string; message?: string; details?: unknown };
    throw new ApiError(
      res.status,
      err.error ?? 'http_error',
      err.message ?? `Request failed (${res.status})`,
      err.details,
    );
  }

  return body as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
};

/** Body of a stock write. `quantity` is the new absolute count, not a delta. */
export type StockUpdate = {
  quantity: number;
  reason: StockMovement['reason'];
  note?: string;
};

export const api = {
  /* -------------------------------------------------------------- profile -- */
  me: {
    get: () => request<Profile>('/api/me'),
    update: (patch: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url'>>) =>
      request<Profile>('/api/me', { method: 'PATCH', body: JSON.stringify(patch) }),
    registerPushToken: (token: string, platform: 'ios' | 'android' | 'web') =>
      request<void>('/api/me/push-token', {
        method: 'POST',
        body: JSON.stringify({ token, platform }),
      }),
    uploadAvatar: async (fileUri: string): Promise<{ url: string; id: string }> => {
      if (!BASE_URL) {
        throw new ApiError(
          0,
          'no_api_url',
          'EXPO_PUBLIC_API_URL is not set. Add it to .env.local and restart Metro.',
        );
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      // Read file as base64 using FileSystem
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Get file type from URI or default to jpeg
      const fileType = fileUri.endsWith('.png') ? 'image/png' :
                       fileUri.endsWith('.webp') ? 'image/webp' :
                       fileUri.endsWith('.gif') ? 'image/gif' :
                       'image/jpeg';

      const res = await fetch(`${BASE_URL}/api/upload/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: base64,
          type: fileType,
          name: 'avatar.jpg',
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        const body = text ? safeParse(text) : null;
        const err = (body ?? {}) as { error?: string; message?: string };
        throw new ApiError(
          res.status,
          err.error ?? 'upload_failed',
          err.message ?? 'Failed to upload avatar',
        );
      }

      const text = await res.text();
      const result = text ? safeParse(text) : null;
      return result as { url: string; id: string };
    },
  },

  /* ---------------------------------------------------------------- queue -- */
  orders: {
    /** Omit `status` for the whole board; the queue screen groups client-side. */
    list: (params: { status?: string; page?: number; page_size?: number } = {}) =>
      request<Paginated<OrderSummary>>(`/api/orders${qs(params)}`),
    get: (id: string) => request<OrderDetail>(`/api/orders/${id}`),
    /** Server re-checks the transition against `ORDER_STATUS_FLOW`. */
    setStatus: (id: string, status: OrderStatus) =>
      request<OrderDetail>(`/api/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    cancel: (id: string, reason: string) =>
      request<OrderDetail>(`/api/orders/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  /* ------------------------------------------------------------ inventory -- */
  products: {
    list: (query: ProductQuery = {}) =>
      request<Paginated<ProductWithStock>>(
        `/api/inventory/products${qs({
          q: query.q,
          category: query.category,
          in_stock_only: query.in_stock_only,
          page: query.page,
          page_size: query.page_size,
        })}`,
      ),
    get: (id: string) => request<ProductWithStock>(`/api/products/${id}`),
  },

  inventory: {
    /** Writes a `stock_movements` row and fires restock alerts server-side. */
    set: (productId: string, body: StockUpdate) =>
      request<ProductWithStock>(`/api/inventory/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    movements: (productId: string) =>
      request<StockMovement[]>(`/api/inventory/${productId}/movements`),
  },

  /* -------------------------------------------------------- notifications -- */
  notifications: {
    list: () => request<AppNotification[]>('/api/notifications'),
    markRead: (id: string) => request<void>(`/api/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => request<void>('/api/notifications/read-all', { method: 'POST' }),
  },

  /* ---------------------------------------------------- support tickets -- */
  support: {
    list: () => request<{ tickets: SupportTicket[] }>('/api/support/tickets'),
    get: (id: string) => request<{ ticket: SupportTicket }>(`/api/support/tickets/${id}`),
    updateStatus: (id: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') =>
      request<{ ticket: SupportTicket }>(`/api/support/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    messages: {
      list: (ticketId: string) => request<{ messages: any[] }>(`/api/support/tickets/${ticketId}/messages`),
      send: (ticketId: string, message: string) =>
        request<{ message: any }>(`/api/support/tickets/${ticketId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ message }),
        }),
    },
  },
};
