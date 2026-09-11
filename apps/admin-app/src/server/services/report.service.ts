import { supabaseAdmin } from '../supabase';
import { AuthContext } from '../auth';

export interface SalesReport {
  period: string;
  total_revenue_kobo: number;
  total_orders: number;
  average_order_value_kobo: number;
}

export interface BestSellingProduct {
  product_id: string;
  product_name: string;
  total_quantity_sold: number;
  total_revenue_kobo: number;
}

export interface DeliveryPerformance {
  total_deliveries: number;
  on_time_deliveries: number;
  average_delivery_time_minutes: number;
}

export class ReportService {
  /**
   * Get sales report for a period
   */
  static async getSalesReport(startDate: string, endDate: string): Promise<SalesReport> {
    let query = supabaseAdmin
      .from('orders')
      .select('total_kobo')
      .in('status', ['delivered', 'paid']);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: orders, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch sales report: ${error.message}`);
    }

    const totalRevenueKobo = (orders || []).reduce((sum, order) => sum + order.total_kobo, 0);
    const totalOrders = orders?.length || 0;
    const averageOrderValueKobo = totalOrders > 0 ? Math.floor(totalRevenueKobo / totalOrders) : 0;

    return {
      period: `${startDate} to ${endDate}`,
      total_revenue_kobo: totalRevenueKobo,
      total_orders: totalOrders,
      average_order_value_kobo: averageOrderValueKobo,
    };
  }

  /**
   * Get best-selling products
   */
  static async getBestSellingProducts(
    startDate?: string,
    endDate?: string,
    limit = 10
  ): Promise<BestSellingProduct[]> {
    let query = supabaseAdmin
      .from('order_items')
      .select(`
        product_id,
        name_snapshot,
        qty,
        unit_price_kobo,
        orders!inner (
          created_at,
          status
        )
      `);

    if (startDate) {
      query = query.gte('orders.created_at', startDate);
    }

    if (endDate) {
      query = query.lte('orders.created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch best-selling products: ${error.message}`);
    }

    // Aggregate by product
    const productMap = new Map<string, BestSellingProduct>();

    for (const item of data || []) {
      const existing = productMap.get(item.product_id);
      const quantity = item.qty;
      const revenue = item.qty * item.unit_price_kobo;

      if (existing) {
        existing.total_quantity_sold += quantity;
        existing.total_revenue_kobo += revenue;
      } else {
        productMap.set(item.product_id, {
          product_id: item.product_id,
          product_name: item.name_snapshot,
          total_quantity_sold: quantity,
          total_revenue_kobo: revenue,
        });
      }
    }

    return Array.from(productMap.values())
      .sort((a, b) => b.total_quantity_sold - a.total_quantity_sold)
      .slice(0, limit);
  }

  /**
   * Get delivery performance metrics
   */
  static async getDeliveryPerformance(startDate?: string, endDate?: string): Promise<DeliveryPerformance> {
    let query = supabaseAdmin
      .from('deliveries')
      .select('*');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch delivery performance: ${error.message}`);
    }

    const deliveries = data || [];
    const totalDeliveries = deliveries.length;
    const onTimeDeliveries = deliveries.filter((d) => d.status === 'delivered').length;

    // Calculate average delivery time (simplified - would need actual timestamps)
    const averageDeliveryTimeMinutes = 45; // Placeholder

    return {
      total_deliveries: totalDeliveries,
      on_time_deliveries: onTimeDeliveries,
      average_delivery_time_minutes: averageDeliveryTimeMinutes,
    };
  }

  /**
   * Get low stock report
   */
  static async getLowStockReport(): Promise<Array<{
    product_id: string;
    product_name: string;
    current_quantity: number;
    low_stock_threshold: number;
  }>> {
    const { data, error } = await supabaseAdmin
      .from('inventory')
      .select(`
        product_id,
        quantity,
        low_stock_threshold,
        products (
          name
        )
      `)
      .lte('quantity', 'low_stock_threshold');

    if (error) {
      throw new Error(`Failed to fetch low stock report: ${error.message}`);
    }

    return (data || []).map((item: any) => ({
      product_id: item.product_id,
      product_name: item.products?.name || 'Unknown',
      current_quantity: item.quantity,
      low_stock_threshold: item.low_stock_threshold,
    }));
  }

  /**
   * Get overview stats for admin dashboard
   */
  static async getOverviewStats(): Promise<{
    total_revenue_kobo: number;
    total_orders: number;
    pending_orders: number;
    low_stock_count: number;
    active_customers: number;
    active_attendants: number;
  }> {
    const [revenueResult, ordersResult, pendingResult, lowStockResult, customersResult, attendantsResult] =
      await Promise.all([
        supabaseAdmin
          .from('orders')
          .select('total_kobo')
          .in('status', ['delivered', 'paid']),
        supabaseAdmin
          .from('orders')
          .select('id', { count: 'exact', head: true }),
        supabaseAdmin
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending_payment', 'paid', 'confirmed', 'preparing']),
        supabaseAdmin
          .from('inventory')
          .select('id', { count: 'exact', head: true })
          .lte('quantity', 'low_stock_threshold'),
        supabaseAdmin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'customer')
          .eq('is_active', true),
        supabaseAdmin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'attendant')
          .eq('is_active', true),
      ]);

    const totalRevenueKobo = (revenueResult.data || []).reduce(
      (sum, order) => sum + order.total_kobo,
      0
    );

    return {
      total_revenue_kobo: totalRevenueKobo,
      total_orders: ordersResult.count || 0,
      pending_orders: pendingResult.count || 0,
      low_stock_count: lowStockResult.count || 0,
      active_customers: customersResult.count || 0,
      active_attendants: attendantsResult.count || 0,
    };
  }
}
