import { supabaseAdmin } from '../supabase';
import { AuthContext } from '../auth';
import { ProductService } from './product.service';

export interface StockMovement {
  id: string;
  product_id: string;
  previous_quantity: number;
  new_quantity: number;
  change: number;
  reason: string;
  performed_by?: string;
  created_at: string;
}

export interface UpdateStockInput {
  product_id: string;
  quantity: number;
  reason: string;
}

export class InventoryService {
  /**
   * Update stock quantity for a product
   */
  static async updateStock(input: UpdateStockInput, auth: AuthContext): Promise<void> {
    // Get current stock
    const { data: currentInventory, error: fetchError } = await supabaseAdmin
      .from('inventory')
      .select('quantity')
      .eq('product_id', input.product_id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch current inventory: ${fetchError.message}`);
    }

    const previousQuantity = currentInventory.quantity;
    const change = input.quantity - previousQuantity;

    // Update inventory
    const { error: updateError } = await supabaseAdmin
      .from('inventory')
      .update({
        quantity: input.quantity,
        updated_by: auth.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('product_id', input.product_id);

    if (updateError) {
      throw new Error(`Failed to update inventory: ${updateError.message}`);
    }

    // Record stock movement
    const { error: movementError } = await supabaseAdmin
      .from('stock_movements')
      .insert({
        product_id: input.product_id,
        previous_quantity: previousQuantity,
        new_quantity: input.quantity,
        change,
        reason: input.reason,
        performed_by: auth.userId,
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
      .from('stock_movements')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch stock movements: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all inventory items
   */
  static async getAllInventory(filters?: {
    low_stock?: boolean;
    out_of_stock?: boolean;
  }) {
    let query = supabaseAdmin
      .from('inventory')
      .select(`
        *,
        products (
          id,
          name,
          generic_name,
          brand,
          category_id,
          price_kobo,
          is_active
        )
      `)
      .order('updated_at', { ascending: false });

    if (filters?.low_stock) {
      // This will be filtered after fetching
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch inventory: ${error.message}`);
    }

    let result = data;

    if (filters?.low_stock) {
      result = result.filter((item: any) => 
        item.quantity <= item.low_stock_threshold && item.quantity > 0
      );
    }

    if (filters?.out_of_stock) {
      result = result.filter((item: any) => item.quantity === 0);
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
      body: 'A product you were watching is now available',
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
