import { supabaseAdmin } from '../supabase';
import { AuthContext } from '../auth';

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
  paid_at?: string;
  confirmed_at?: string;
  preparing_at?: string;
  packed_at?: string;
  ready_at?: string;
  picked_up_at?: string;
  out_for_delivery_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  name_snapshot: string;
  unit_price_kobo: number;
  qty: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CreateOrderInput {
  customer_id: string;
  items: Array<{
    product_id: string;
    qty: number;
  }>;
  address_id: string;
  notes?: string;
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
  }): Promise<Order[]> {
    let query = supabaseAdmin
      .from('orders')
      .select('*')
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

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a single order with items
   */
  static async getOrderById(id: string): Promise<OrderWithItems | null> {
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
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
      .select('*')
      .eq('order_id', id);

    if (itemsError) {
      throw new Error(`Failed to fetch order items: ${itemsError.message}`);
    }

    return {
      ...order,
      items,
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
      .select('id, name, price_kobo, is_active')
      .in('id', productIds);

    if (productsError || !products) {
      throw new Error('Failed to fetch products');
    }

    // Check stock availability
    const { data: inventory } = await supabaseAdmin
      .from('inventory')
      .select('product_id, quantity')
      .in('product_id', productIds);

    const inventoryMap = new Map(
      (inventory || []).map((inv: any) => [inv.product_id, inv.quantity])
    );

    for (const item of input.items) {
      const product = products.find((p) => p.id === item.product_id);
      const stock = inventoryMap.get(item.product_id) || 0;

      if (!product || !product.is_active) {
        throw new Error(`Product ${item.product_id} is not available`);
      }

      if (stock < item.qty) {
        throw new Error(`Insufficient stock for product ${item.product_id}`);
      }
    }

    // Calculate totals
    let subtotalKobo = 0;
    const orderItems = input.items.map((item) => {
      const product = products.find((p) => p.id === item.product_id)!;
      const lineTotal = product.price_kobo * item.qty;
      subtotalKobo += lineTotal;
      return {
        product_id: item.product_id,
        name_snapshot: product.name || 'Product',
        unit_price_kobo: product.price_kobo,
        qty: item.qty,
      };
    });

    // Calculate delivery fee (simplified - should use distance-based calculation)
    const deliveryFeeKobo = 1000; // Base fee
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
        address_snapshot: address,
        notes: input.notes,
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

    return {
      ...order,
      items: orderItems.map((item, idx) => ({
        id: `temp-${idx}`,
        order_id: order.id,
        ...item,
        created_at: order.created_at,
      })),
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
    const updates: any = {
      status: input.status,
    };

    // Add timestamp based on status
    const timestampField = `${input.status}_at`;
    if (timestampField !== '_at') {
      updates[timestampField] = new Date().toISOString();
    }

    if (input.attendant_id) {
      updates.attendant_id = input.attendant_id;
    }

    if (input.cancellation_reason) {
      updates.cancellation_reason = input.cancellation_reason;
      updates.cancelled_at = new Date().toISOString();
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

    // If order is cancelled, restore stock
    if (input.status === 'cancelled') {
      await this.restoreStock(id);
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
   * Restore stock when order is cancelled
   */
  private static async restoreStock(orderId: string): Promise<void> {
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('product_id, qty')
      .eq('order_id', orderId);

    if (!items) return;

    for (const item of items) {
      await supabaseAdmin.rpc('increment_stock', {
        product_id: item.product_id,
        amount: item.qty,
      });
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
