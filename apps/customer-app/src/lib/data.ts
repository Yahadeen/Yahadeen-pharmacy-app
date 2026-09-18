/**
 * Single data entry point for every screen.
 *
 * When `EXPO_PUBLIC_API_URL` is set this is a thin pass-through to `api`. When it
 * is not — which is the case until the Next.js routes are deployed — it serves
 * the fixtures in `demo.ts` so the app is fully navigable and screenshot-ready
 * on a real device. Screens never branch on this themselves.
 *
 * To go live: fill in `EXPO_PUBLIC_API_URL`, restart Metro. Nothing else changes.
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
  ProductQuery,
  ProductWithStock,
  Profile,
  SupportTicket,
} from '@pharmago/shared';
import { api } from './api';
import {
  demoAddresses,
  demoCategories,
  demoNotifications,
  demoOrderSummaries,
  demoOrders,
  demoProducts,
  demoProfile,
  demoQuote,
} from './demo';

/** True while the app is running on fixtures instead of the real API. */
export const DEMO_MODE = !process.env.EXPO_PUBLIC_API_URL;

if (__DEV__ && DEMO_MODE) {
  console.warn(
    '[Yahadeen] EXPO_PUBLIC_API_URL is not set — running on demo data. ' +
      'Set it in apps/customer-app/.env.local to talk to the real API.',
  );
}

/** Fake latency so skeletons and spinners are visible while demoing. */
const settle = <T,>(value: T, ms = 320): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const PAGE_SIZE = 20;

function filterProducts(query: ProductQuery): Paginated<ProductWithStock> {
  const q = query.q?.trim().toLowerCase();
  let items = demoProducts.filter((p) => {
    if (query.category) {
      const cat = demoCategories.find((c) => c.slug === query.category || c.id === query.category);
      if (!cat || p.category_id !== cat.id) return false;
    }
    if (query.in_stock_only && p.quantity <= 0) return false;
    if (!q) return true;
    return [p.name, p.generic_name, p.brand, p.category_name]
      .filter(Boolean)
      .some((field) => (field as string).toLowerCase().includes(q));
  });

  switch (query.sort) {
    case 'price_asc':
      items = [...items].sort((a, b) => a.price_kobo - b.price_kobo);
      break;
    case 'price_desc':
      items = [...items].sort((a, b) => b.price_kobo - a.price_kobo);
      break;
    case 'name':
      items = [...items].sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      break;
  }

  const page = query.page ?? 1;
  const size = query.page_size ?? PAGE_SIZE;
  return {
    items: items.slice((page - 1) * size, page * size),
    total: items.length,
    page,
    page_size: size,
  };
}

export const data = {
  /* -------------------------------------------------------------- profile -- */
  me: (): Promise<Profile> => (DEMO_MODE ? settle(demoProfile) : api.me.get()),

  updateMe: (patch: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url' | 'date_of_birth' | 'preferred_payment_method'>>): Promise<Profile> =>
    DEMO_MODE ? settle({ ...demoProfile, ...patch }) : api.me.update(patch),

  uploadAvatar: (fileUri: string): Promise<{ url: string; id: string }> =>
    DEMO_MODE ? settle({ url: fileUri, id: 'demo' }) : api.me.uploadAvatar(fileUri),

  /* ------------------------------------------------------------ catalogue -- */
  categories: (): Promise<Category[]> =>
    DEMO_MODE ? settle(demoCategories) : api.categories.list(),

  products: (query: ProductQuery = {}): Promise<Paginated<ProductWithStock>> =>
    DEMO_MODE ? settle(filterProducts(query)) : api.products.list(query),

  product: (id: string): Promise<ProductWithStock> => {
    if (!DEMO_MODE) return api.products.get(id);
    const found = demoProducts.find((p) => p.id === id);
    if (!found) return Promise.reject(new Error('That product is no longer available.'));
    return settle(found);
  },

  featured: (): Promise<ProductWithStock[]> =>
    DEMO_MODE
      ? settle(demoProducts.filter((p) => p.quantity > 0).slice(0, 6))
      : api.products.featured(),

  watchRestock: (id: string): Promise<void> =>
    DEMO_MODE ? settle(undefined) : api.products.watchRestock(id),

  /* ------------------------------------------------------------ addresses -- */
  addresses: (): Promise<Address[]> => (DEMO_MODE ? settle(demoAddresses) : api.addresses.list()),

  createAddress: (payload: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Address> =>
    DEMO_MODE
      ? settle({
          ...payload,
          id: `a${Date.now()}`,
          user_id: demoProfile.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      : api.addresses.create(payload),

  updateAddress: (id: string, patch: Partial<Address>): Promise<Address> => {
    if (!DEMO_MODE) return api.addresses.update(id, patch);
    const found = demoAddresses.find((a) => a.id === id) ?? demoAddresses[0];
    return settle({ ...found, ...patch });
  },

  removeAddress: (id: string): Promise<void> =>
    DEMO_MODE ? settle(undefined) : api.addresses.remove(id),

  /* --------------------------------------------------------------- orders -- */
  orders: (params: { status?: string; page?: number } = {}): Promise<Paginated<OrderSummary>> => {
    if (!DEMO_MODE) return api.orders.list(params);
    const items = params.status
      ? demoOrderSummaries.filter((o) => o.status === params.status)
      : demoOrderSummaries;
    return settle({ items, total: items.length, page: 1, page_size: PAGE_SIZE });
  },

  order: (id: string): Promise<OrderDetail> => {
    if (!DEMO_MODE) return api.orders.get(id);
    const found = demoOrders.find((o) => o.id === id);
    if (!found) return Promise.reject(new Error('We could not find that order.'));
    return settle(found);
  },

  createOrder: (
    payload: CreateOrderPayload,
  ): Promise<{ order: OrderDetail; payment_url: string | null }> => {
    if (!DEMO_MODE) return api.orders.create(payload);
    // Demo mode has no payment provider, so hand back the sample pending order.
    return settle({ order: demoOrders[1], payment_url: null }, 700);
  },

  cancelOrder: (id: string, reason: string): Promise<OrderDetail> => {
    if (!DEMO_MODE) return api.orders.cancel(id, reason);
    const found = demoOrders.find((o) => o.id === id) ?? demoOrders[0];
    return settle({
      ...found,
      status: 'cancelled' as const,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    });
  },

  retryPayment: (id: string): Promise<{ payment_url: string }> =>
    DEMO_MODE
      ? Promise.reject(new Error('Payments are not wired up in demo mode yet.'))
      : api.orders.retryPayment(id),

  /* ------------------------------------------------------------- delivery -- */
  deliveryQuote: (addressId: string, subtotal: number): Promise<DeliveryQuote> =>
    DEMO_MODE ? settle(demoQuote(subtotal)) : api.delivery.quote(addressId, subtotal),

  /* -------------------------------------------------------- notifications -- */
  notifications: (): Promise<AppNotification[]> =>
    DEMO_MODE ? settle(demoNotifications) : api.notifications.list(),

  markNotificationRead: (id: string): Promise<void> =>
    DEMO_MODE ? settle(undefined) : api.notifications.markRead(id),

  markAllNotificationsRead: (): Promise<void> =>
    DEMO_MODE ? settle(undefined) : api.notifications.markAllRead(),

  /* -------------------------------------------------- prescription upload -- */
  prescriptionUploadUrl: (fileName: string, contentType: string) =>
    DEMO_MODE
      ? settle({ upload_info: null, public_url: `demo://prescriptions/${fileName}` })
      : api.uploads.prescriptionUrl(fileName, contentType),

  /* ---------------------------------------------------- push tokens -- */
  registerPushToken: (
    token: string,
    platform: 'ios' | 'android' | 'web',
    deviceInfo?: Record<string, unknown>,
  ): Promise<void> =>
    DEMO_MODE ? settle(undefined) : api.me.registerPushToken(token, platform, deviceInfo),

  pushTokenStatus: () =>
    DEMO_MODE ? settle({ tokens: [], has_active_token: false }) : api.me.pushTokenStatus(),

  removePushToken: (token?: string): Promise<void> =>
    DEMO_MODE ? settle(undefined) : api.me.removePushToken(token),

  /* -------------------------------------------------- support tickets -- */
  supportTickets: async (): Promise<SupportTicket[]> => {
    const result = DEMO_MODE ? settle({ tickets: [] }) : api.support.list();
    const data = await result;
    return data.tickets || [];
  },
};
