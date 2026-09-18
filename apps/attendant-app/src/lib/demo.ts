/**
 * Sample data used only while `EXPO_PUBLIC_API_URL` is unset.
 *
 * The point is that the whole staff app — queue, order detail, inventory, stock
 * edit — renders on a real device before the Next.js API exists, which is what
 * the preliminary screenshots need. `src/lib/data.ts` stops consulting this the
 * moment the env var is filled in, so deleting the file later is a one-line
 * change.
 *
 * Unlike the customer fixtures, these are *other people's* orders: six
 * customers sitting at different stages, so the queue has something to group.
 */
import {
  DELIVERY_BASE_FEE_KOBO,
  FREE_DELIVERY_THRESHOLD_KOBO,
  type Address,
  type AddressSnapshot,
  type AppNotification,
  type Category,
  type OrderDetail,
  type OrderItem,
  type OrderStatus,
  type OrderSummary,
  type ProductWithStock,
  type Profile,
  type StockMovement,
} from '@pharmago/shared';

const now = Date.now();
const minsAgo = (m: number) => new Date(now - m * 60_000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();

export const demoStaff: Profile = {
  id: 'demo-attendant',
  role: 'attendant',
  full_name: 'Tunde Bakare',
  email: 'tunde.bakare@yahadeen.ng',
  phone: '08055512340',
  avatar_url: null,
  date_of_birth: null,
  preferred_payment_method: null,
  is_active: true,
  created_at: daysAgo(210),
};

export const demoCategories: Category[] = [
  { id: 'c1', name: 'Pain & Fever', slug: 'pain-fever', icon: 'thermometer', sort_order: 1, is_active: true },
  { id: 'c2', name: 'Malaria', slug: 'malaria', icon: 'shield', sort_order: 2, is_active: true },
  { id: 'c3', name: 'Antibiotics', slug: 'antibiotics', icon: 'crosshair', sort_order: 3, is_active: true },
  { id: 'c4', name: 'Vitamins', slug: 'vitamins', icon: 'sun', sort_order: 4, is_active: true },
  { id: 'c5', name: 'First Aid', slug: 'first-aid', icon: 'plus-square', sort_order: 5, is_active: true },
  { id: 'c6', name: 'Skin Care', slug: 'skin-care', icon: 'droplet', sort_order: 6, is_active: true },
  { id: 'c7', name: 'Baby & Mother', slug: 'baby-mother', icon: 'heart', sort_order: 7, is_active: true },
  { id: 'c8', name: 'Diabetes Care', slug: 'diabetes-care', icon: 'activity', sort_order: 8, is_active: true },
];

/* ------------------------------------------------------------- catalogue -- */

/** Tuple form keeps the shelf readable: `[id, cat, name, generic, brand, pack, kobo, qty, rx?]` */
type Seed = [string, string, string, string | null, string, string, number, number, boolean?];

const SEEDS: Seed[] = [
  ['p1', 'c1', 'Paracetamol 500mg', 'Paracetamol', 'Emzor', '500mg × 20 tablets', 85_000, 240],
  ['p2', 'c2', 'Coartem 20/120mg', 'Artemether / Lumefantrine', 'Novartis', '20/120mg × 24 tablets', 450_000, 62],
  ['p3', 'c3', 'Amoxicillin 500mg', 'Amoxicillin trihydrate', 'Fidson', '500mg × 15 capsules', 230_000, 8, true],
  ['p4', 'c4', 'Vitamin C 1000mg', 'Ascorbic acid', 'Nature’s Field', '1000mg × 30 tablets', 320_000, 150],
  ['p5', 'c1', 'Panadol Extra', 'Paracetamol + Caffeine', 'GSK', '500mg/65mg × 24 tablets', 145_000, 96],
  ['p6', 'c8', 'Blood Glucose Test Strips', null, 'Accu-Chek', 'Box of 50 strips', 1_250_000, 21],
  ['p7', 'c6', 'Hydrocortisone Cream 1%', 'Hydrocortisone acetate', 'Dermal', '1% × 15g tube', 190_000, 4],
  ['p8', 'c5', 'ORS Rehydration Sachets', 'Oral rehydration salts', 'Emzor', 'Pack of 10 sachets', 120_000, 310],
  ['p9', 'c3', 'Ventolin Inhaler 100mcg', 'Salbutamol', 'GSK', '100mcg × 200 doses', 680_000, 0, true],
  ['p10', 'c8', 'Metformin 500mg', 'Metformin hydrochloride', 'Swiss Pharma', '500mg × 30 tablets', 185_000, 76, true],
  ['p11', 'c7', 'Zinc + Vitamin C Syrup', 'Zinc sulphate + Ascorbic acid', 'Ecomed', '100ml bottle', 265_000, 58],
  ['p12', 'c5', 'Digital Thermometer', null, 'Omron', 'Single unit, 10-second read', 420_000, 6],
];

export const demoProducts: ProductWithStock[] = SEEDS.map(
  ([id, category_id, name, generic_name, brand, pack_size, price_kobo, quantity, rx]) => ({
    id,
    category_id,
    name,
    generic_name,
    brand,
    description: null,
    pack_size,
    image_url: null,
    price_kobo,
    requires_prescription: !!rx,
    is_active: true,
    created_at: daysAgo(90),
    updated_at: daysAgo(2),
    quantity,
    low_stock_threshold: 10,
    category_name: demoCategories.find((c) => c.id === category_id)?.name ?? null,
  }),
);

const productById = (id: string) => demoProducts.find((p) => p.id === id)!;

/* ---------------------------------------------------------------- orders -- */

const CUSTOMERS = [
  { id: 'cu1', full_name: 'Ada Okafor', phone: '08031234567' },
  { id: 'cu2', full_name: 'Emeka Nwosu', phone: '08067788990' },
  { id: 'cu3', full_name: 'Fatima Bello', phone: '07012223344' },
  { id: 'cu4', full_name: 'Grace Adeyemi', phone: '08123456780' },
  { id: 'cu5', full_name: 'Ibrahim Sani', phone: '09098765432' },
  { id: 'cu6', full_name: 'Chioma Eze', phone: '08144556677' },
];

const ADDRESSES: Address[] = [
  {
    id: 'a1',
    user_id: 'cu1',
    full_name: 'Ada Okafor',
    phone: '08031234567',
    address_line1: '14B Admiralty Way',
    address_line2: 'Flat 3',
    city: 'Lekki Phase 1',
    state: 'Lagos',
    postal_code: null,
    country: 'Nigeria',
    is_default: true,
    created_at: daysAgo(210),
    updated_at: daysAgo(210),
  },
  {
    id: 'a2',
    user_id: 'cu2',
    full_name: 'Emeka Nwosu',
    phone: '08067788990',
    address_line1: '5 Ligali Ayorinde Street',
    address_line2: null,
    city: 'Victoria Island',
    state: 'Lagos',
    postal_code: null,
    country: 'Nigeria',
    is_default: true,
    created_at: daysAgo(210),
    updated_at: daysAgo(210),
  },
  {
    id: 'a3',
    user_id: 'cu3',
    full_name: 'Fatima Bello',
    phone: '07012223344',
    address_line1: '22 Cameron Road',
    address_line2: 'Block C',
    city: 'Ikoyi',
    state: 'Lagos',
    postal_code: null,
    country: 'Nigeria',
    is_default: true,
    created_at: daysAgo(210),
    updated_at: daysAgo(210),
  },
];

/** How far down the happy path a status sits — drives which stamps are set. */
const RANK: Record<OrderStatus, number> = {
  pending_payment: 0,
  payment_failed: 0,
  paid: 1,
  confirmed: 2,
  preparing: 3,
  packed: 4,
  ready_for_pickup: 5,
  picked_up: 6,
  out_for_delivery: 7,
  delivered: 8,
  cancelled: 1,
};

type OrderSeed = {
  id: string;
  code: string;
  /** Index into `CUSTOMERS` / `ADDRESSES`. */
  ci: number;
  ai: number;
  status: OrderStatus;
  /** Minutes since the order was placed. */
  ago: number;
  lines: [product: string, qty: number][];
  note?: string;
  rx?: boolean;
  rider?: { name: string; phone: string; etaMins: number };
};

function build(seed: OrderSeed): OrderDetail {
  const customer = CUSTOMERS[seed.ci];
  const rank = RANK[seed.status];
  /** Later than `created_at` by `step` minutes, clamped so nothing lands ahead of now. */
  const stamp = (step: number) => minsAgo(Math.max(0, seed.ago - step));

  const items: OrderItem[] = seed.lines.map(([pid, qty], i) => {
    const p = productById(pid);
    return {
      id: `oi-${seed.id}-${i}`,
      order_id: seed.id,
      product_id: p.id,
      name_snapshot: p.name,
      pack_size_snapshot: p.pack_size,
      image_url_snapshot: p.image_url,
      unit_price_kobo: p.price_kobo,
      quantity: qty,
      total_kobo: p.price_kobo * qty,
      created_at: minsAgo(seed.ago),
    };
  });

  const subtotal_kobo = items.reduce((n, i) => n + i.unit_price_kobo * i.quantity, 0);
  const delivery_fee_kobo =
    subtotal_kobo >= FREE_DELIVERY_THRESHOLD_KOBO ? 0 : DELIVERY_BASE_FEE_KOBO;

  const addressSnapshot = {
    id: ADDRESSES[seed.ai].id,
    full_name: ADDRESSES[seed.ai].full_name,
    phone: ADDRESSES[seed.ai].phone,
    address_line1: ADDRESSES[seed.ai].address_line1,
    address_line2: ADDRESSES[seed.ai].address_line2,
    city: ADDRESSES[seed.ai].city,
    state: ADDRESSES[seed.ai].state,
    postal_code: ADDRESSES[seed.ai].postal_code,
    country: ADDRESSES[seed.ai].country,
    updated_at: ADDRESSES[seed.ai].updated_at,
  };

  return {
    id: seed.id,
    code: seed.code,
    customer_id: customer.id,
    status: seed.status,
    subtotal_kobo,
    delivery_fee_kobo,
    total_kobo: subtotal_kobo + delivery_fee_kobo,
    address_id: ADDRESSES[seed.ai].id,
    address: ADDRESSES[seed.ai],
    address_snapshot: addressSnapshot,
    note: seed.note ?? null,
    prescription_url: seed.rx ? 'https://example.com/prescription.jpg' : null,
    attendant_id: rank >= 2 ? demoStaff.id : null,
    created_at: minsAgo(seed.ago),
    paid_at: rank >= 1 ? stamp(1) : null,
    confirmed_at: rank >= 2 ? stamp(4) : null,
    packed_at: rank >= 4 ? stamp(12) : null,
    dispatched_at: rank >= 6 ? stamp(18) : null,
    delivered_at: rank >= 8 ? stamp(40) : null,
    cancelled_at: null,
    cancellation_reason: null,
    items,
    payment:
      rank >= 1
        ? {
            id: `pay-${seed.id}`,
            order_id: seed.id,
            provider: 'paystack',
            provider_ref: `PSK_${seed.code.slice(3)}`,
            status: 'success',
            amount_kobo: subtotal_kobo + delivery_fee_kobo,
            channel: seed.ci % 2 === 0 ? 'card' : 'bank_transfer',
            paid_at: stamp(1),
            created_at: minsAgo(seed.ago),
          }
        : null,
    delivery: seed.rider
      ? {
          id: `del-${seed.id}`,
          order_id: seed.id,
          provider: 'manual',
          tracking_ref: `RIDE-${seed.code.slice(-4)}`,
          status: rank >= 8 ? 'delivered' : 'in_transit',
          rider_name: seed.rider.name,
          rider_phone: seed.rider.phone,
          distance_km: 4.2,
          eta: rank >= 8 ? null : new Date(now + seed.rider.etaMins * 60_000).toISOString(),
          updated_at: stamp(18),
        }
      : null,
    customer: { ...customer, avatar_url: null },
    unread_messages: 0,
  };
}

const ORDER_SEEDS: OrderSeed[] = [
  { id: 'o1', code: 'PG-7A31C8', ci: 0, ai: 0, status: 'paid', ago: 4, lines: [['p1', 2], ['p8', 1]], note: 'Please call when you reach the gate.' },
  { id: 'o2', code: 'PG-6B2D07', ci: 1, ai: 1, status: 'paid', ago: 13, lines: [['p3', 1]], rx: true },
  { id: 'o3', code: 'PG-5C99E1', ci: 2, ai: 2, status: 'confirmed', ago: 26, lines: [['p2', 1], ['p4', 1]] },
  { id: 'o4', code: 'PG-4D18B5', ci: 3, ai: 0, status: 'preparing', ago: 41, lines: [['p5', 2], ['p12', 1]] },
  { id: 'o5', code: 'PG-3E77A9', ci: 4, ai: 1, status: 'packed', ago: 68, lines: [['p6', 1]] },
  { id: 'o6', code: 'PG-2F45D3', ci: 5, ai: 2, status: 'ready_for_pickup', ago: 95, lines: [['p10', 2], ['p11', 1]], rx: true },
  {
    id: 'o7',
    code: 'PG-1A08F6',
    ci: 0,
    ai: 0,
    status: 'out_for_delivery',
    ago: 150,
    lines: [['p7', 1], ['p1', 1]],
    rider: { name: 'Chidi N.', phone: '08090001122', etaMins: 22 },
  },
  {
    id: 'o8',
    code: 'PG-0B93C2',
    ci: 1,
    ai: 1,
    status: 'delivered',
    ago: 1_500,
    lines: [['p4', 2]],
    rider: { name: 'Musa B.', phone: '08090003344', etaMins: 0 },
  },
];

export const demoOrders: OrderDetail[] = ORDER_SEEDS.map(build);

export const demoOrderSummaries: OrderSummary[] = demoOrders.map((o) => ({
  id: o.id,
  code: o.code,
  status: o.status,
  total_kobo: o.total_kobo,
  created_at: o.created_at,
  customer_id: o.customer_id,
  item_count: o.items.reduce((n, i) => n + i.quantity, 0),
  preview: o.items.map((i) => i.name_snapshot || i.product?.name || 'Item').join(', '),
  customer_name: o.customer?.full_name ?? null,
}));

/* --------------------------------------------------- staff notifications -- */

export const demoNotifications: AppNotification[] = [
  {
    id: 'n1',
    user_id: demoStaff.id,
    title: 'New order to confirm',
    message: 'PG-7A31C8 from Ada Okafor - 3 items, paid.',
    data: { kind: 'order', id: 'o1' },
    read_at: null,
    created_at: minsAgo(4),
  },
  {
    id: 'n2',
    user_id: demoStaff.id,
    title: 'Prescription awaiting review',
    message: 'PG-6B2D07 includes Amoxicillin 500mg. A pharmacist must approve the upload.',
    data: { kind: 'order', id: 'o2' },
    read_at: null,
    created_at: minsAgo(13),
  },
  {
    id: 'n3',
    user_id: demoStaff.id,
    title: 'Out of stock',
    message: 'Ventolin Inhaler 100mcg hit zero. 3 customers are waiting on a restock alert.',
    data: { kind: 'product', id: 'p9' },
    read_at: null,
    created_at: minsAgo(180),
  },
  {
    id: 'n4',
    user_id: demoStaff.id,
    title: 'Rider assigned',
    message: 'Chidi N. collected PG-1A08F6 and is on the way to Lekki Phase 1.',
    data: { kind: 'order', id: 'o7' },
    read_at: minsAgo(130),
    created_at: minsAgo(132),
  },
];

/* --------------------------------------------------------- stock history -- */

export const demoStockMovements: StockMovement[] = [
  { id: 'm1', product_id: 'p9', delta: -1, quantity_after: 0, reason: 'sale', note: null, actor_id: demoStaff.id, created_at: minsAgo(180) },
  { id: 'm2', product_id: 'p7', delta: -6, quantity_after: 4, reason: 'sale', note: null, actor_id: demoStaff.id, created_at: minsAgo(320) },
  { id: 'm3', product_id: 'p3', delta: +20, quantity_after: 28, reason: 'restock', note: 'Fidson delivery, batch AM-2291', actor_id: demoStaff.id, created_at: daysAgo(2) },
  { id: 'm4', product_id: 'p3', delta: -20, quantity_after: 8, reason: 'sale', note: null, actor_id: demoStaff.id, created_at: daysAgo(1) },
  { id: 'm5', product_id: 'p12', delta: -2, quantity_after: 6, reason: 'expiry', note: 'Two units past use-by', actor_id: demoStaff.id, created_at: daysAgo(3) },
];
