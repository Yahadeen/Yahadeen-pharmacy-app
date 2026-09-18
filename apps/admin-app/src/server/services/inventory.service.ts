import { supabaseAdmin } from '../supabase';
import { AuthContext } from '../auth';
import { ProductService } from './product.service';

export interface StockMovement {
  id: string;
  product_id: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  adjusted_by?: string;
  created_at: string;
}

export interface UpdateStockInput {
  product_id: string;
  quantity: number;
  reason: string;
  note?: string;
}

export class InventoryService {
  /**
   * Update stock quantity for a product
   * Stock is stored directly on the products table, not in a separate inventory table
   */
  static async updateStock(input: UpdateStockInput, auth: AuthContext): Promise<void> {
    // Get current stock from products table
    const { data: currentProduct, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('stock_quantity, low_stock_threshold')
      .eq('id', input.product_id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch current product: ${fetchError.message}`);
    }

    const previousQuantity = currentProduct.stock_quantity;
    const change = input.quantity - previousQuantity;

    // Update stock directly on products table
    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        stock_quantity: input.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.product_id);

    if (updateError) {
      throw new Error(`Failed to update product stock: ${updateError.message}`);
    }

    // Record stock movement in inventory_adjustments table
    const { error: movementError } = await supabaseAdmin
      .from('inventory_adjustments')
      .insert({
        product_id: input.product_id,
        quantity: input.quantity,
        previous_quantity: previousQuantity,
        reason: input.reason,
        adjusted_by: auth.userId,
      });

    if (movementError) {
      // Log error but don't fail the transaction
      console.error('Failed to record stock movement:', movementError);
    }

    // If stock increased and there are watchers, send notifications
    if (change > 0 && previousQuantity === 0) {
      await this.notifyRestockWatchers(input.product_id);
    }
  }

  /**
   * Get stock movement history for a product
   */
  static async getStockMovements(productId: string, limit = 50): Promise<StockMovement[]> {
    const { data, error } = await supabaseAdmin
      .from('inventory_adjustments')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch stock movements: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all inventory items
   * Returns products with their stock information
   */
  static async getAllInventory(filters?: {
    low_stock?: boolean;
    out_of_stock?: boolean;
  }) {
    let query = supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        generic_name,
        brand,
        category_id,
        price_kobo,
        is_active,
        stock_quantity,
        low_stock_threshold,
        image_url,
        updated_at
      `)
      .eq('is_active', true)
      .order('stock_quantity', { ascending: true }); // Sort by stock ascending (lowest first)

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch inventory: ${error.message}`);
    }

    let result = data || [];

    if (filters?.low_stock) {
      result = result.filter((item: any) => 
        item.stock_quantity <= item.low_stock_threshold && item.stock_quantity > 0
      );
    }

    if (filters?.out_of_stock) {
      result = result.filter((item: any) => item.stock_quantity === 0);
    }

    return result;
  }

  /**
   * Notify users watching a product that it's back in stock
   */
  private static async notifyRestockWatchers(productId: string): Promise<void> {
    const { data: watchers, error } = await supabaseAdmin
      .from('restock_watchers')
      .select('user_id')
      .eq('product_id', productId)
      .is('notified_at', null);

    if (error || !watchers || watchers.length === 0) {
      return;
    }

    // Create notifications for all watchers
    const notifications = watchers.map((watcher: any) => ({
      user_id: watcher.user_id,
      title: 'Product Back in Stock',
      message: 'A product you were watching is now available',
      data: { product_id: productId },
    }));

    await supabaseAdmin.from('notifications').insert(notifications);

    // Mark watchers as notified
    await supabaseAdmin
      .from('restock_watchers')
      .update({ notified_at: new Date().toISOString() })
      .eq('product_id', productId)
      .is('notified_at', null);
  }
}
