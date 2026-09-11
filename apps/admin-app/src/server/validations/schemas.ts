import { z } from 'zod';

// Profile validation
export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/).optional(),
  avatar_url: z.string().url().optional(),
});

// Category validation
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  icon: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Product validation
export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  generic_name: z.string().max(255).optional(),
  brand: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  image_url: z.string().url().optional(),
  category_id: z.string().uuid(),
  price_kobo: z.number().int().min(0),
  requires_prescription: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

// Inventory validation
export const updateStockSchema = z.object({
  quantity: z.number().int().min(0),
  reason: z.string().min(1).max(255),
});

// Order validation
export const createOrderSchema = z.object({
  customer_id: z.string().uuid(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    qty: z.number().int().min(1).max(100),
  })).min(1).max(50),
  address_id: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending_payment',
    'paid',
    'confirmed',
    'preparing',
    'packed',
    'ready_for_pickup',
    'picked_up',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ]),
  attendant_id: z.string().uuid().optional(),
  cancellation_reason: z.string().max(500).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(1).max(500),
});

// Payment validation
export const initPaymentSchema = z.object({
  order_id: z.string().uuid(),
  amount_kobo: z.number().int().min(100),
  email: z.string().email(),
});

// Address validation
export const createAddressSchema = z.object({
  user_id: z.string().uuid(),
  label: z.string().max(50).optional(),
  address_line1: z.string().min(1).max(255),
  address_line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postal_code: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  is_default: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();

// Attendant validation
export const createAttendantSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1).max(255),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/).optional(),
  password: z.string().min(8).max(100),
});

// Notification validation
export const createNotificationSchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  body: z.string().max(1000).optional(),
  data: z.record(z.any()).optional(),
});

// Report query validation
export const reportQuerySchema = z.object({
  type: z.enum(['sales', 'best_sellers', 'delivery', 'low_stock']),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});
