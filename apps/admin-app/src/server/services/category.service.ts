import { supabaseAdmin } from '../supabase';
import { AuthContext } from '../auth';

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  sort_order?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
}

export class CategoryService {
  /**
   * Get all categories
   */
  static async getCategories(activeOnly = false): Promise<Category[]> {
    let query = supabaseAdmin
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a single category by ID
   */
  static async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch category: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a single category by slug
   */
  static async getCategoryBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch category: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new category (admin only)
   */
  static async createCategory(input: CreateCategoryInput, auth: AuthContext): Promise<Category> {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name: input.name,
        description: input.description,
        parent_id: input.parent_id,
        image_url: input.image_url,
        sort_order: input.sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a category (admin only)
   */
  static async updateCategory(
    id: string,
    input: UpdateCategoryInput,
    auth: AuthContext
  ): Promise<Category> {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete/deactivate a category (admin only)
   */
  static async deleteCategory(id: string, auth: AuthContext): Promise<void> {
    const { error } = await supabaseAdmin
      .from('categories')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }
}
