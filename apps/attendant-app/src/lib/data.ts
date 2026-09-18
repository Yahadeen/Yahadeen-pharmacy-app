/**
 * Single data entry point for every screen.
 *
 * When `EXPO_PUBLIC_API_URL` is set this is a thin pass-through to `api`. When
 * it is not — the case until the Next.js routes are deployed — it serves the
 * fixtures in `demo.ts`, and it serves them *mutably*: confirming an order or
 * setting stock really does move the card, so the queue can be demonstrated end
 * to end on a device. Screens never branch on this themselves.
 *
 * To go live: fill in `EXPO_PUBLIC_API_URL`, restart Metro. Nothing else changes.
 */
import {
  canTransition,
  type AppNotification,
  type OrderDetail,
  type OrderStatus,
  type OrderSummary,
  type Paginated,
  type ProductQuery,
  type ProductWithStock,
  type Profile,
  type StockMovement,
  type SupportTicket,
} from '@pharmago/shared';
import { api, type StockUpdate } from './api';
import {
  demoNotifications,
  demoOrders,
  demoProducts,
  demoStaff,
  demoStockMovements,
} from './demo';

/** True while the app is running on fixtures instead of the real API. */
export const DEMO_MODE = !process.env.EXPO_PUBLIC_API_URL;

if (__DEV__ && DEMO_MODE) {
  console.warn(
    '[yahadeen Staff] EXPO_PUBLIC_API_URL is not set — running on demo data. ' +
      'Set it in apps/attendant-app/.env.local to talk to the real API.',
  );
}

/** Fake latency so skeletons and spinners are visible while demoing. */
const settle = <T,>(value: T, ms = 320): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const PAGE_SIZE = 30;

/* Session-local copies so demo edits persist until the app is reloaded. */
const orders: OrderDetail[] = demoOrders.map((o) => ({ ...o }));
const products: ProductWithStock[] = demoProducts.map((p) => ({ ...p }));
const movements: StockMovement[] = [...demoStockMovements];
const notices: AppNotification[] = demoNotifications.map((n) => ({ ...n }));

const summarize = (o: OrderDetail): OrderSummary => ({
  id: o.id,
  code: o.code,
  status: o.status,
  total_kobo: o.total_kobo,
  created_at: o.created_at,
  customer_id: o.customer_id,
  item_count: o.items.reduce((n, i) => n + i.quantity, 0),
  preview: o.items.map((i) => i.product?.name || i.name_snapshot || 'Item').join(', '),
  customer_name: o.customer?.full_name ?? null,
});

/** Which timestamp column a status entry writes. */
function stampFor(status: OrderStatus, iso: string): Partial<OrderDetail> {
  switch (status) {
    case 'paid':
      return { paid_at: iso };
    case 'confirmed':
      return { confirmed_at: iso };
    case 'packed':
      return { packed_at: iso };
    case 'picked_up':
      return { dispatched_at: iso };
    case 'delivered':
      return { delivered_at: iso };
    default:
      return {};
  }
}

function filterProducts(query: ProductQuery): Paginated<ProductWithStock> {
  const q = query.q?.trim().toLowerCase();
  let items = products.filter((p) => {
    if (query.in_stock_only && p.quantity <= 0) return false;
    if (!q) return true;
    return [p.name, p.generic_name, p.brand, p.category_name]
      .filter(Boolean)
      .some((field) => (field as string).toLowerCase().includes(q));
  });

  // Staff care about what needs attention, so the shelf is ordered by scarcity.
  items = [...items].sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name));

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
  me: (): Promise<Profile> => (DEMO_MODE ? settle(demoStaff) : api.me.get()),

  updateMe: (
    patch: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url'>>,
  ): Promise<Profile> => (DEMO_MODE ? settle({ ...demoStaff, ...patch }) : api.me.update(patch)),

  uploadAvatar: (fileUri: string): Promise<{ url: string; id: string }> =>
    DEMO_MODE ? settle({ url: fileUri, id: 'demo' }) : api.me.uploadAvatar(fileUri),

  registerPushToken: (token: string, platform: 'ios' | 'android' | 'web'): Promise<void> =>
    DEMO_MODE ? settle(undefined) : api.me.registerPushToken(token, platform),

  /* ---------------------------------------------------------------- queue -- */
  orders: (
    params: { status?: string; page?: number } = {},
  ): Promise<Paginated<OrderSummary>> => {
    if (!DEMO_MODE) return api.orders.list(params);
    const items = orders
      .filter((o) => !params.status || o.status === params.status)
      .map(summarize)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    return settle({ items, total: items.length, page: 1, page_size: PAGE_SIZE });
  },

  order: (id: string): Promise<OrderDetail> => {
    if (!DEMO_MODE) return api.orders.get(id);
    const found = orders.find((o) => o.id === id);
    if (!found) return Promise.reject(new Error('That order is no longer in the queue.'));
    return settle(found);
  },

  advanceStatus: (id: string, status: OrderStatus): Promise<OrderDetail> => {
    if (!DEMO_MODE) return api.orders.setStatus(id, status);
    const index = orders.findIndex((o) => o.id === id);
    if (index < 0) return Promise.reject(new Error('That order is no longer in the queue.'));
    const current = orders[index];
    if (!canTransition(current.status, status)) {
      return Promise.reject(
        new Error(`An order that is ${current.status.replace(/_/g, ' ')} cannot move to that step.`),
      );
    }
    const next: OrderDetail = {
      ...current,
      status,
      attendant_id: current.attendant_id ?? demoStaff.id,
      ...stampFor(status, new Date().toISOString()),
    };
    orders[index] = next;
    return settle(next, 420);
  },

  cancelOrder: (id: string, reason: string): Promise<OrderDetail> => {
    if (!DEMO_MODE) return api.orders.cancel(id, reason);
    const index = orders.findIndex((o) => o.id === id);
    if (index < 0) return Promise.reject(new Error('That order is no longer in the queue.'));
    const next: OrderDetail = {
      ...orders[index],
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    };
    orders[index] = next;
    return settle(next, 420);
  },

  /* ------------------------------------------------------------ inventory -- */
  products: (query: ProductQuery = {}): Promise<Paginated<ProductWithStock>> =>
    DEMO_MODE ? settle(filterProducts(query)) : api.products.list(query),

  product: (id: string): Promise<ProductWithStock> => {
    if (!DEMO_MODE) return api.products.get(id);
    const found = products.find((p) => p.id === id);
    if (!found) return Promise.reject(new Error('That product is not on the shelf.'));
    return settle(found);
  },

  setStock: (productId: string, body: StockUpdate): Promise<ProductWithStock> => {
    if (!DEMO_MODE) return api.inventory.set(productId, body);
    const index = products.findIndex((p) => p.id === productId);
    if (index < 0) return Promise.reject(new Error('That product is not on the shelf.'));
    const before = products[index];
    const next: ProductWithStock = {
      ...before,
      quantity: body.quantity,
      updated_at: new Date().toISOString(),
    };
    products[index] = next;
    movements.unshift({
      id: `m-${Date.now()}`,
      product_id: productId,
      delta: body.quantity - before.quantity,
      quantity_after: body.quantity,
      reason: body.reason,
      note: body.note?.trim() || null,
      actor_id: demoStaff.id,
      created_at: new Date().toISOString(),
    });
    return settle(next, 420);
  },

  stockMovements: (productId: string): Promise<StockMovement[]> =>
    DEMO_MODE
      ? settle(movements.filter((m) => m.product_id === productId))
      : api.inventory.movements(productId),

  /* -------------------------------------------------------- notifications -- */
  notifications: (): Promise<AppNotification[]> =>
    DEMO_MODE ? settle([...notices]) : api.notifications.list(),

  markNotificationRead: (id: string): Promise<void> => {
    if (!DEMO_MODE) return api.notifications.markRead(id);
    const index = notices.findIndex((n) => n.id === id);
    if (index >= 0) notices[index] = { ...notices[index], read_at: new Date().toISOString() };
    return settle(undefined);
  },

  markAllNotificationsRead: (): Promise<void> => {
    if (!DEMO_MODE) return api.notifications.markAllRead();
    const iso = new Date().toISOString();
    notices.forEach((n, i) => {
      if (!n.read_at) notices[i] = { ...n, read_at: iso };
    });
    return settle(undefined);
  },

  /* -------------------------------------------------- support tickets -- */
  supportTickets: async (): Promise<SupportTicket[]> => {
    const result = DEMO_MODE ? settle({ tickets: [] }) : api.support.list();
    const data = await result;
    return data.tickets || [];
  },
};
