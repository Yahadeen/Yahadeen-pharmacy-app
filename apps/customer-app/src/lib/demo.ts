/**
 * Sample data used only while `EXPO_PUBLIC_API_URL` is unset.
 *
 * The point is that every screen renders fully on a device before the Next.js
 * API exists — which is what the preliminary screenshots need. Nothing here is
 * written to, and `src/lib/data.ts` stops consulting it the moment the env var
 * is filled in, so deleting this file later is a one-line change.
 */
import { deliveryFeeKobo } from '@pharmago/shared';
import type {
  Address,
  AppNotification,
  Category,
  DeliveryQuote,
  OrderDetail,
  OrderSummary,
  ProductWithStock,
  Profile,
} from '@pharmago/shared';

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();

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

type Seed = {
  id: string;
  category_id: string;
  name: string;
  generic_name: string | null;
  brand: string | null;
  pack_size: string;
  price_kobo: number;
  quantity: number;
  rx?: boolean;
  description: string;
};

const SEEDS: Seed[] = [
  {
    id: 'p1',
    category_id: 'c1',
    name: 'Paracetamol 500mg',
    generic_name: 'Paracetamol',
    brand: 'Emzor',
    pack_size: '500mg × 20 tablets',
    price_kobo: 85_000,
    quantity: 240,
    description:
      'Relieves mild to moderate pain and reduces fever. Adults: 1–2 tablets every 4–6 hours, no more than 8 tablets in 24 hours.',
  },
  {
    id: 'p2',
    category_id: 'c2',
    name: 'Coartem 20/120mg',
    generic_name: 'Artemether / Lumefantrine',
    brand: 'Novartis',
    pack_size: '20/120mg × 24 tablets',
    price_kobo: 450_000,
    quantity: 62,
    description:
      'Full adult treatment course for uncomplicated malaria. Take with food or a milky drink to aid absorption.',
  },
  {
    id: 'p3',
    category_id: 'c3',
    name: 'Amoxicillin 500mg',
    generic_name: 'Amoxicillin trihydrate',
    brand: 'Fidson',
    pack_size: '500mg × 15 capsules',
    price_kobo: 230_000,
    quantity: 8,
    rx: true,
    description:
      'Broad-spectrum antibiotic for bacterial infections. Complete the full course even if you feel better.',
  },
  {
    id: 'p4',
    category_id: 'c4',
    name: 'Vitamin C 1000mg',
    generic_name: 'Ascorbic acid',
    brand: 'Nature’s Field',
    pack_size: '1000mg × 30 tablets',
    price_kobo: 320_000,
    quantity: 150,
    description: 'Daily immune support with a sustained-release coating. One tablet after breakfast.',
  },
  {
    id: 'p5',
    category_id: 'c1',
    name: 'Panadol Extra',
    generic_name: 'Paracetamol + Caffeine',
    brand: 'GSK',
    pack_size: '500mg/65mg × 24 tablets',
    price_kobo: 145_000,
    quantity: 96,
    description: 'Faster relief for headache and period pain. Contains caffeine — avoid close to bedtime.',
  },
  {
    id: 'p6',
    category_id: 'c8',
    name: 'Blood Glucose Test Strips',
    generic_name: null,
    brand: 'Accu-Chek',
    pack_size: 'Box of 50 strips',
    price_kobo: 1_250_000,
    quantity: 21,
    description: 'Compatible with Accu-Chek Active meters. Store below 30°C with the vial tightly closed.',
  },
  {
    id: 'p7',
    category_id: 'c6',
    name: 'Hydrocortisone Cream 1%',
    generic_name: 'Hydrocortisone acetate',
    brand: 'Dermal',
    pack_size: '1% × 15g tube',
    price_kobo: 190_000,
    quantity: 44,
    description: 'Calms itching, eczema and insect bites. Thin layer twice daily for up to seven days.',
  },
  {
    id: 'p8',
    category_id: 'c5',
    name: 'ORS Rehydration Sachets',
    generic_name: 'Oral rehydration salts',
    brand: 'Emzor',
    pack_size: 'Pack of 10 sachets',
    price_kobo: 120_000,
    quantity: 310,
    description: 'Replaces fluid and electrolytes lost to diarrhoea. Dissolve one sachet in 500ml clean water.',
  },
  {
    id: 'p9',
    category_id: 'c3',
    name: 'Ventolin Inhaler 100mcg',
    generic_name: 'Salbutamol',
    brand: 'GSK',
    pack_size: '100mcg × 200 doses',
    price_kobo: 680_000,
    quantity: 0,
    rx: true,
    description: 'Reliever inhaler for asthma and wheeze. Two puffs when symptoms start.',
  },
  {
    id: 'p10',
    category_id: 'c8',
    name: 'Metformin 500mg',
    generic_name: 'Metformin hydrochloride',
    brand: 'Swiss Pharma',
    pack_size: '500mg × 30 tablets',
    price_kobo: 185_000,
    quantity: 76,
    rx: true,
    description: 'First-line type 2 diabetes therapy. Take with meals to reduce stomach upset.',
  },
  {
    id: 'p11',
    category_id: 'c7',
    name: 'Zinc + Vitamin C Syrup',
    generic_name: 'Zinc sulphate + Ascorbic acid',
    brand: 'Ecomed',
    pack_size: '100ml bottle',
    price_kobo: 265_000,
    quantity: 58,
    description: 'Paediatric immune and recovery support. 5ml once daily for children over two years.',
  },
  {
    id: 'p12',
    category_id: 'c5',
    name: 'Digital Thermometer',
    generic_name: null,
    brand: 'Omron',
    pack_size: 'Single unit, 10-second read',
    price_kobo: 420_000,
    quantity: 17,
    description: 'Flexible-tip digital thermometer with fever alarm and last-reading memory.',
  },
];

export const demoProducts: ProductWithStock[] = SEEDS.map((s) => ({
  id: s.id,
  category_id: s.category_id,
  name: s.name,
  generic_name: s.generic_name,
  brand: s.brand,
  description: s.description,
  pack_size: s.pack_size,
  image_url: null,
  price_kobo: s.price_kobo,
  requires_prescription: !!s.rx,
  is_active: true,
  created_at: daysAgo(90),
  updated_at: daysAgo(2),
  quantity: s.quantity,
  low_stock_threshold: 10,
  category_name: demoCategories.find((c) => c.id === s.category_id)?.name ?? null,
}));

export const demoProfile: Profile = {
  id: 'demo-user',
  role: 'customer',
  full_name: 'Ada Okafor',
  email: 'ada.okafor@example.com',
  phone: '08031234567',
  avatar_url: null,
  date_of_birth: null,
  preferred_payment_method: null,
  is_active: true,
  created_at: daysAgo(120),
};

export const demoAddresses: Address[] = [
  {
    id: 'a1',
    user_id: 'demo-user',
    full_name: 'Ada Okafor',
    phone: '08031234567',
    address_line1: '14B Admiralty Way',
    address_line2: 'Flat 3',
    city: 'Lekki Phase 1',
    state: 'Lagos',
    postal_code: '101233',
    country: 'Nigeria',
    is_default: true,
    created_at: daysAgo(100),
    updated_at: daysAgo(100),
  },
  {
    id: 'a2',
    user_id: 'demo-user',
    full_name: 'Ada Okafor',
    phone: '08031234567',
    address_line1: '5 Ligali Ayorinde Street',
    address_line2: null,
    city: 'Victoria Island',
    state: 'Lagos',
    postal_code: null,
    country: 'Nigeria',
    is_default: false,
    created_at: daysAgo(40),
    updated_at: daysAgo(40),
  },
];

const snapshot = (id: string, qty: number) => {
  const p = demoProducts.find((x) => x.id === id)!;
  return {
    id: `oi-${id}`,
    order_id: '',
    product_id: p.id,
    unit_price_kobo: p.price_kobo,
    quantity: qty,
    total_kobo: p.price_kobo * qty,
    created_at: new Date().toISOString(),
    product: {
      id: p.id,
      name: p.name,
      image_url: p.image_url,
    },
  };
};

export const demoOrders: OrderDetail[] = [
  {
    id: 'o1',
    code: 'PG-4F2A19',
    customer_id: 'demo-user',
    status: 'out_for_delivery',
    subtotal_kobo: 85_000 * 2 + 450_000,
    delivery_fee_kobo: 50_000,
    total_kobo: 85_000 * 2 + 450_000 + 50_000,
    address_id: 'a1',
    note: 'Please call when you reach the gate.',
    prescription_url: null,
    attendant_id: 'att-1',
    created_at: hoursAgo(5),
    paid_at: hoursAgo(5),
    confirmed_at: hoursAgo(4),
    packed_at: hoursAgo(3),
    dispatched_at: hoursAgo(1),
    delivered_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    items: [snapshot('p1', 2), snapshot('p2', 1)],
    payment: {
      id: 'pay1',
      order_id: 'o1',
      provider: 'paystack',
      provider_ref: 'PSK_9K2LMX',
      status: 'success',
      amount_kobo: 85_000 * 2 + 450_000 + 50_000,
      channel: 'card',
      paid_at: hoursAgo(5),
      created_at: hoursAgo(5),
    },
    delivery: {
      id: 'd1',
      order_id: 'o1',
      provider: 'manual',
      tracking_ref: 'RIDE-2214',
      status: 'in_transit',
      rider_name: 'Chidi N.',
      rider_phone: '08090001122',
      distance_km: 4.2,
      eta: new Date(now + 22 * 60_000).toISOString(),
      updated_at: hoursAgo(1),
    },
    customer: { id: 'demo-user', full_name: 'Ada Okafor', phone: '08031234567', avatar_url: null },
    address: demoAddresses[0],
    unread_messages: 0,
  },
  {
    id: 'o2',
    code: 'PG-91C7B4',
    customer_id: 'demo-user',
    status: 'pending_payment',
    subtotal_kobo: 230_000,
    delivery_fee_kobo: 50_000,
    total_kobo: 280_000,
    address_id: 'a2',
    note: null,
    prescription_url: 'https://example.com/prescription.jpg',
    attendant_id: null,
    created_at: hoursAgo(20),
    paid_at: null,
    confirmed_at: null,
    packed_at: null,
    dispatched_at: null,
    delivered_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    items: [snapshot('p3', 1)],
    payment: null,
    delivery: null,
    customer: { id: 'demo-user', full_name: 'Ada Okafor', phone: '08031234567', avatar_url: null },
    address: demoAddresses[1],
    unread_messages: 0,
  },
  {
    id: 'o3',
    code: 'PG-2D8E05',
    customer_id: 'demo-user',
    status: 'delivered',
    subtotal_kobo: 320_000 + 120_000,
    delivery_fee_kobo: 0,
    total_kobo: 440_000,
    address_id: 'a1',
    note: null,
    prescription_url: null,
    attendant_id: 'att-1',
    created_at: daysAgo(6),
    paid_at: daysAgo(6),
    confirmed_at: daysAgo(6),
    packed_at: daysAgo(6),
    dispatched_at: daysAgo(6),
    delivered_at: daysAgo(5),
    cancelled_at: null,
    cancellation_reason: null,
    items: [snapshot('p4', 1), snapshot('p8', 1)],
    payment: {
      id: 'pay3',
      order_id: 'o3',
      provider: 'paystack',
      provider_ref: 'PSK_44QAZ1',
      status: 'success',
      amount_kobo: 440_000,
      channel: 'bank_transfer',
      paid_at: daysAgo(6),
      created_at: daysAgo(6),
    },
    delivery: {
      id: 'd3',
      order_id: 'o3',
      provider: 'manual',
      tracking_ref: 'RIDE-2011',
      status: 'delivered',
      rider_name: 'Musa B.',
      rider_phone: '08090003344',
      distance_km: 3.8,
      eta: null,
      updated_at: daysAgo(5),
    },
    customer: { id: 'demo-user', full_name: 'Ada Okafor', phone: '08031234567', avatar_url: null },
    address: demoAddresses[0],
    unread_messages: 0,
  },
];

export const demoOrderSummaries: OrderSummary[] = demoOrders.map((o) => ({
  id: o.id,
  code: o.code,
  status: o.status,
  total_kobo: o.total_kobo,
  created_at: o.created_at,
  customer_id: o.customer_id,
  item_count: o.items.reduce((n, i) => n + i.quantity, 0),
  preview: o.items.map((i) => i.product_id).join(', '),
  customer_name: 'Ada Okafor',
}));

export const demoNotifications: AppNotification[] = [
  {
    id: 'n1',
    user_id: 'demo-user',
    title: 'Your order is on the way',
    message: 'PG-4F2A19 left the pharmacy. Chidi is about 22 minutes away.',
    data: { kind: 'order', id: 'o1' },
    read_at: null,
    created_at: hoursAgo(1),
  },
  {
    id: 'n2',
    user_id: 'demo-user',
    title: 'Prescription approved',
    message: 'Our pharmacist reviewed your upload for PG-91C7B4. Complete payment to continue.',
    data: { kind: 'order', id: 'o2' },
    read_at: null,
    created_at: hoursAgo(18),
  },
  {
    id: 'n3',
    user_id: 'demo-user',
    title: 'Back in stock',
    message: 'Ventolin Inhaler 100mcg is available again.',
    data: { kind: 'product', id: 'p9' },
    read_at: daysAgo(3),
    created_at: daysAgo(3),
  },
];

export function demoQuote(subtotalKobo: number): DeliveryQuote {
  const distance_km = 4.2;
  const fee_kobo = deliveryFeeKobo(distance_km, subtotalKobo);
  return {
    distance_km,
    fee_kobo,
    free_reason: fee_kobo === 0 ? 'Free over ₦20,000' : null,
    eta_minutes: 45,
  };
}
