/**
 * Typed client for the Next.js API (`apps/admin-app/src/app/api/*`).
 *
 * Every request carries the current Supabase access token as a bearer header;
 * the route handlers verify it and derive the caller's role from `profiles`, so
 * the app never has to be trusted about who it is.
 */
import type {
  Address,
  AppNotification,
  Category,
  CreateOrderPayload,
  DeliveryQuote,
  OrderDetail,
  OrderSummary,
  Paginated,
  Product,
  ProductQuery,
  ProductWithStock,
  Profile,
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

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
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
      aborted ? 'The request timed out. Check your connection.' : "Can't reach Yahadeen Pharm Go right now.",
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

export const api = {
  /* -------------------------------------------------------------- profile -- */
  me: {
    get: () => request<Profile>('/api/me'),
    update: (patch: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url' | 'date_of_birth' | 'preferred_payment_method'>>) =>
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

      // Read file as base64 for React Native
      const FileSystem = await import('expo-file-system');
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Get file type from URI
      const fileType = fileUri.endsWith('.png') ? 'image/png' : 
                       fileUri.endsWith('.webp') ? 'image/webp' :
                       fileUri.endsWith('.gif') ? 'image/gif' : 'image/jpeg';

      const res = await fetch(`${BASE_URL}/api/upload/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          file: base64,
          type: fileType,
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

  /* ------------------------------------------------------------ catalogue -- */
  categories: {
    list: () => request<Category[]>('/api/categories', { auth: false }),
  },

  products: {
    list: (query: ProductQuery = {}) =>
      request<Paginated<ProductWithStock>>(
        `/api/products${qs({
          q: query.q,
          category: query.category,
          in_stock_only: query.in_stock_only,
          sort: query.sort,
          page: query.page,
          page_size: query.page_size,
        })}`,
        { auth: false },
      ),
    get: (id: string) => request<ProductWithStock>(`/api/products/${id}`, { auth: false }),
    /** Featured / "popular this week" rail on the home screen. */
    featured: () => request<ProductWithStock[]>('/api/products/featured', { auth: false }),
    watchRestock: (id: string) => request<void>(`/api/products/${id}/watch`, { method: 'POST' }),
  },

  /* ------------------------------------------------------------ addresses -- */
  addresses: {
    list: () => request<Address[]>('/api/addresses'),
    create: (payload: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
      request<Address>('/api/addresses', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string, patch: Partial<Address>) =>
      request<Address>(`/api/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    remove: (id: string) => request<void>(`/api/addresses/${id}`, { method: 'DELETE' }),
  },

  /* --------------------------------------------------------------- orders -- */
  delivery: {
    quote: (addressId: string, subtotalKobo: number) =>
      request<DeliveryQuote>(
        `/api/delivery/quote${qs({ address_id: addressId, subtotal_kobo: subtotalKobo })}`,
      ),
  },

  orders: {
    list: (params: { status?: string; page?: number } = {}) =>
      request<Paginated<OrderSummary>>(`/api/orders${qs(params)}`),
    get: (id: string) => request<OrderDetail>(`/api/orders/${id}`),
    create: (payload: CreateOrderPayload) =>
      request<{ order: OrderDetail; payment_url: string | null }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    cancel: (id: string, reason: string) =>
      request<OrderDetail>(`/api/orders/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    /** Re-opens the payment sheet for an order left at `pending_payment`. */
    retryPayment: (id: string) =>
      request<{ payment_url: string }>(`/api/orders/${id}/pay`, { method: 'POST' }),
  },

  /* -------------------------------------------------- prescription upload -- */
  uploads: {
    /** Returns a short-lived signed URL the client PUTs the file to. */
    prescriptionUrl: (fileName: string, contentType: string) =>
      request<{ upload_url: string; public_url: string }>('/api/uploads/prescription', {
        method: 'POST',
        body: JSON.stringify({ file_name: fileName, content_type: contentType }),
      }),
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
    create: (payload: { order_id: string; subject: string; category?: string; description?: string }) =>
      request<{ ticket: SupportTicket }>('/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify(payload),
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

export type { Product, ProductWithStock };
