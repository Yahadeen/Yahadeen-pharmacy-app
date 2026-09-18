import { supabaseAdmin, createSupabaseClient } from '../supabase';
import { AuthContext } from '../auth';

export interface Product {
  id: string;
  name: string;
  generic_name?: string;
  brand?: string;
  description?: string;
  image_url?: string;
  category_id: string;
  price_kobo: number;
  requires_prescription: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithStock extends Product {
  stock_quantity: number;
  low_stock_threshold: number;
}

export interface CreateProductInput {
  name: string;
  generic_name?: string;
  brand?: string;
  description?: string;
  image_url?: string;
  category_id: string;
  price_kobo: number;
  requires_prescription?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  generic_name?: string;
  brand?: string;
  description?: string;
  image_url?: string;
  category_id?: string;
  price_kobo?: number;
  requires_prescription?: boolean;
  is_active?: boolean;
}

export class ProductService {
  /**
   * Get all products with optional filters
   */
  static async getProducts(filters?: {
    category_id?: string;
    search?: string;
    is_active?: boolean;
    in_stock_only?: boolean;
    limit?: number;
    offset?: number;
    sort?: string;
  }): Promise<ProductWithStock[]> {
    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        categories:category_id (
          name
        )
      `);

    // Apply sorting
    if (filters?.sort === 'price_asc') {
      query = query.order('price_kobo', { ascending: true });
    } else if (filters?.sort === 'price_desc') {
      query = query.order('price_kobo', { ascending: false });
    } else if (filters?.sort === 'name') {
      query = query.order('name', { ascending: true });
    } else {
      // Default: created_at descending
      query = query.order('created_at', { ascending: false });
    }

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,generic_name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.in_stock_only) {
      query = query.gt('stock_quantity', 0);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return data.map((item: any) => ({
      ...item,
      quantity: item.stock_quantity || 0,
      stock_quantity: item.stock_quantity || 0,
      low_stock_threshold: item.low_stock_threshold || 10,
      category_name: item.categories?.name || null,
    }));
  }

  /**
   * Get a single product by ID
   */
  static async getProductById(id: string): Promise<ProductWithStock | null> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories:category_id (
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return {
      ...data,
      quantity: data.stock_quantity || 0,
      stock_quantity: data.stock_quantity || 0,
      low_stock_threshold: data.low_stock_threshold || 10,
      category_name: data.categories?.name || null,
    };
  }

  /**
   * Create a new product (admin only)
   */
  static async createProduct(input: CreateProductInput, auth: AuthContext): Promise<Product> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        name: input.name,
        generic_name: input.generic_name,
        brand: input.brand,
        description: input.description,
        image_url: input.image_url,
        category_id: input.category_id,
        price_kobo: input.price_kobo,
        requires_prescription: input.requires_prescription || false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a product (admin only)
   */
  static async updateProduct(
    id: string,
    input: UpdateProductInput,
    auth: AuthContext
  ): Promise<Product> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete/deactivate a product (admin only)
   */
  static async deleteProduct(id: string, auth: AuthContext): Promise<void> {
    const { error } = await supabaseAdmin
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  /**
   * Get products with low stock
   */
  static async getLowStockProducts(): Promise<ProductWithStock[]> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch low stock products: ${error.message}`);
    }

    return data
      .filter((item: any) => (item.stock_quantity || 0) <= (item.low_stock_threshold || 10))
      .map((item: any) => ({
        ...item,
        stock_quantity: item.stock_quantity || 0,
        low_stock_threshold: item.low_stock_threshold || 10,
      }));
  }
}
