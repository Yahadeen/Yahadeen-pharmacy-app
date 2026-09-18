import { supabaseAdmin } from '../supabase';
import { AuthContext } from '../auth';
import { PushService } from './push.service';

export interface Order {
  id: string;
  code: string;
  customer_id: string;
  status: string;
  subtotal_kobo: number;
  delivery_fee_kobo: number;
  total_kobo: number;
  address_snapshot: any;
  attendant_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  cancellation_reason?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price_kobo: number;
  total_kobo: number;
  created_at: string;
  product?: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  address?: {
    id: string;
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    postal_code: string | null;
    country: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface CreateOrderInput {
  customer_id: string;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  address_id: string;
  notes?: string;
  prescription_url?: string;
}

export interface UpdateOrderStatusInput {
  status: string;
  attendant_id?: string;
  cancellation_reason?: string;
}

export class OrderService {
  /**
   * Get orders with optional filters
   */
  static async getOrders(filters?: {
    customer_id?: string;
    attendant_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Order[]; total: number; page: number; page_size: number }> {
    let query = supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }

    if (filters?.attendant_id) {
      query = query.eq('attendant_id', filters.attendant_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;
    const page = Math.floor(offset / limit) + 1;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return {
      items: data || [],
      total: count || 0,
      page,
      page_size: limit,
    };
  }

  /**
   * Get a single order with items
   */
  static async getOrderById(id: string): Promise<OrderWithItems | null> {
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        addresses(*)
      `)
      .eq('id', id)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch order: ${orderError.message}`);
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select(`
        *,
        products(id, name, image_url)
      `)
      .eq('order_id', id);

    if (itemsError) {
      throw new Error(`Failed to fetch order items: ${itemsError.message}`);
    }

    return {
      ...order,
      items: items.map((item: any) => ({
        ...item,
        product: item.products,
      })),
      address: order.addresses as any,
    };
  }

  /**
   * Create a new order
   */
  static async createOrder(input: CreateOrderInput, auth: AuthContext): Promise<OrderWithItems> {
    // Get address
    const { data: address, error: addressError } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('id', input.address_id)
      .single();

    if (addressError || !address) {
      throw new Error('Address not found');
    }

    // Get products and calculate total
    const productIds = input.items.map((item) => item.product_id);
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, price_kobo, is_active, stock_quantity')
      .in('id', productIds);

    if (productsError || !products) {
      throw new Error('Failed to fetch products');
    }

    // Check stock availability using products.stock_quantity
    for (const item of input.items) {
      const product = products.find((p) => p.id === item.product_id);
      const stock = product?.stock_quantity ?? 0;

      if (!product || !product.is_active) {
        throw new Error(`Product ${item.product_id} is not available`);
      }

      console.log(`Stock check for product ${item.product_id} (${product.name}): requested=${item.quantity}, available=${stock}`);

      if (stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}. Requested: ${item.quantity}, Available: ${stock}`);
      }
    }

    // Calculate totals
    let subtotalKobo = 0;
    const orderItems = input.items.map((item) => {
      const product = products.find((p) => p.id === item.product_id)!;
      const lineTotal = product.price_kobo * item.quantity;
      subtotalKobo += lineTotal;
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_kobo: product.price_kobo,
        total_kobo: lineTotal,
      };
    });

    // Create a proper address snapshot (only necessary fields)
    const addressSnapshot = {
      id: address.id,
      full_name: address.full_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
    };

    // Calculate delivery fee using the shared config
    const { FREE_DELIVERY_THRESHOLD_KOBO, DELIVERY_BASE_FEE_KOBO, DELIVERY_PER_KM_KOBO } = await import('@pharmago/shared');
    const distanceKm = 5; // Default 5km for now (should calculate from address coords)
    let deliveryFeeKobo = 0;
    if (subtotalKobo < FREE_DELIVERY_THRESHOLD_KOBO) {
      deliveryFeeKobo = DELIVERY_BASE_FEE_KOBO + Math.round(distanceKm * DELIVERY_PER_KM_KOBO);
    }
    const totalKobo = subtotalKobo + deliveryFeeKobo;

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: input.customer_id,
        status: 'pending_payment',
        subtotal_kobo: subtotalKobo,
        delivery_fee_kobo: deliveryFeeKobo,
        total_kobo: totalKobo,
        address_id: input.address_id,
        notes: input.notes,
        prescription_url: input.prescription_url || null,
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    // Create order items
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(
        orderItems.map((item) => ({
          order_id: order.id,
          ...item,
        }))
      );

    if (itemsError) {
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    // Note: Stock is now deducted when order status changes to 'confirmed' (not at creation)

    // Fetch the address for the response
    const { data: orderAddress } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('id', input.address_id)
      .single();

    // Send push notification for new order to all admins and attendants
    try {
      await PushService.sendToRoles(['attendant', 'admin', 'super_admin'], {
        title: 'New Order Received',
        body: `New order #${order.code} from customer`,
        data: {
          type: 'order_created',
          order_id: order.id,
          screen: 'order/[id]',
        },
      });
    } catch (pushError) {
      // Don't fail the order creation if push fails
      console.error('Failed to send push notification:', pushError);
    }

    return {
      ...order,
      items: orderItems.map((item, idx) => ({
        id: `temp-${idx}`,
        order_id: order.id,
        ...item,
        created_at: order.created_at,
      })),
      address: orderAddress || undefined,
    };
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    id: string,
    input: UpdateOrderStatusInput,
    auth: AuthContext
  ): Promise<Order> {
    // Get current order status before updating to check for stock restoration
    const { data: currentOrder } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', id)
      .single();

    const updates: any = {
      status: input.status,
    };

    if (input.attendant_id) {
      updates.attendant_id = input.attendant_id;
    }

    if (input.cancellation_reason) {
      updates.cancellation_reason = input.cancellation_reason;
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }

    // Deduct stock when order is packed (items have been verified)
    if (input.status === 'packed') {
      await this.deductStock(id);
    }

    // If order is cancelled, restore stock only if it was previously packed
    if (input.status === 'cancelled' && currentOrder) {
      // Only restore stock if the order was at or past 'packed' status
      // This means stock was already deducted
      if (['packed', 'ready_for_pickup', 'picked_up', 'out_for_delivery'].includes(currentOrder.status)) {
        await this.restoreStock(id);
      }
    }

    // Send push notifications for order status changes
    try {
      // Notify customer about status change
      await PushService.sendToUser(data.customer_id, {
        title: input.status === 'cancelled' ? 'Order Cancelled' : 'Order Status Updated',
        body: input.status === 'cancelled'
          ? `Your order #${data.code} was cancelled${data.cancellation_reason ? `: ${data.cancellation_reason}` : '.'}`
          : `Your order #${data.code} is now ${input.status}`,
        data: {
          type: input.status === 'cancelled' ? 'order_cancelled' : 'order_status_updated',
          order_id: data.id,
          status: input.status,
          cancellation_reason: data.cancellation_reason,
          screen: 'order/[id]',
        },
      });

      // Notify attendant if one is assigned
      if (data.attendant_id) {
        await PushService.sendToUser(data.attendant_id, {
          title: 'Order Status Updated',
          body: `Order #${data.code} is now ${input.status}`,
          data: {
            type: 'order_status_updated',
            order_id: data.id,
            status: input.status,
            screen: 'order/[id]',
          },
        });
      }

      if (['paid', 'cancelled', 'payment_failed'].includes(input.status)) {
        await PushService.sendToRoles(['attendant', 'admin', 'super_admin'], {
          title: input.status === 'paid' ? 'Order Paid' : input.status === 'cancelled' ? 'Order Cancelled' : 'Payment Failed',
          body: `Order #${data.code} is now ${input.status}`,
          data: {
            type: input.status === 'cancelled' ? 'order_cancelled' : 'order_status_updated',
            order_id: data.id,
            status: input.status,
            screen: 'order/[id]',
          },
        });
      }
    } catch (pushError) {
      // Don't fail the order update if push fails
      console.error('Failed to send push notification:', pushError);
    }

    return data;
  }

  /**
   * Cancel an order
   */
  static async cancelOrder(id: string, reason: string, auth: AuthContext): Promise<Order> {
    return this.updateOrderStatus(
      id,
      { status: 'cancelled', cancellation_reason: reason },
      auth
    );
  }

  /**
   * Deduct stock when order is packed (items have been verified)
   */
  private static async deductStock(orderId: string): Promise<void> {
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (!items) return;

    for (const item of items) {
      // Get current stock
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();
      
      if (product) {
        const newStock = Math.max(0, product.stock_quantity - item.quantity);
        await supabaseAdmin
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product_id);
      }
    }
  }

  /**
   * Restore stock when order is cancelled
   */
  private static async restoreStock(orderId: string): Promise<void> {
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (!items) return;

    for (const item of items) {
      // Get current stock
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();
      
      if (product) {
        const newStock = product.stock_quantity + item.quantity;
        await supabaseAdmin
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product_id);
      }
    }
  }

  /**
   * Get order statistics
   */
  static async getOrderStats(): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    preparing: number;
    packed: number;
    ready: number;
    out_for_delivery: number;
    delivered: number;
    cancelled: number;
  }> {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('status');

    if (error) {
      throw new Error(`Failed to fetch order stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      pending: 0,
      confirmed: 0,
      preparing: 0,
      packed: 0,
      ready: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const order of data) {
      const status = order.status as keyof typeof stats;
      if (status in stats) {
        stats[status]++;
      }
    }

    return stats;
  }
}
