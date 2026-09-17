import { supabaseAdmin } from '../supabase';
import { AuthContext } from '../auth';

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code?: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressInput {
  user_id: string;
  full_name: string;
  phone?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code?: string;
  country?: string;
  is_default?: boolean;
}

export interface UpdateAddressInput {
  full_name?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_default?: boolean;
}

export class AddressService {
  /**
   * Get all addresses for a user
   */
  static async getAddresses(userId: string): Promise<Address[]> {
    const { data, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch addresses: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a single address by ID
   */
  static async getAddressById(id: string): Promise<Address | null> {
    const { data, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch address: ${error.message}`);
    }

    return data;
  }

  /**
   * Get default address for a user
   */
  static async getDefaultAddress(userId: string): Promise<Address | null> {
    const { data, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch default address: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new address
   */
  static async createAddress(input: CreateAddressInput, auth: AuthContext): Promise<Address> {
    // Only allow users to create their own addresses
    if (auth.userId !== input.user_id && auth.role !== 'admin' && auth.role !== 'super_admin') {
      throw new Error('Forbidden');
    }

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .insert({
        user_id: input.user_id,
        full_name: input.full_name,
        phone: input.phone,
        address_line1: input.address_line1,
        address_line2: input.address_line2,
        city: input.city,
        state: input.state,
        postal_code: input.postal_code,
        country: input.country || 'Nigeria',
        is_default: input.is_default || false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create address: ${error.message}`);
    }

    // Notification is created by database trigger

    return data;
  }

  /**
   * Update an address
   */
  static async updateAddress(
    id: string,
    input: UpdateAddressInput,
    auth: AuthContext
  ): Promise<Address> {
    // Check ownership
    const address = await this.getAddressById(id);
    if (!address) {
      throw new Error('Address not found');
    }

    if (auth.userId !== address.user_id && auth.role !== 'admin' && auth.role !== 'super_admin') {
      throw new Error('Forbidden');
    }

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update address: ${error.message}`);
    }

    // Notification is created by database trigger

    return data;
  }

  /**
   * Delete an address
   */
  static async deleteAddress(id: string, auth: AuthContext): Promise<void> {
    // Check ownership
    const address = await this.getAddressById(id);
    if (!address) {
      throw new Error('Address not found');
    }

    if (auth.userId !== address.user_id && auth.role !== 'admin' && auth.role !== 'super_admin') {
      throw new Error('Forbidden');
    }

    const { error } = await supabaseAdmin
      .from('addresses')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete address: ${error.message}`);
    }
  }

  /**
   * Set address as default
   */
  static async setDefaultAddress(id: string, auth: AuthContext): Promise<Address> {
    // Check ownership
    const address = await this.getAddressById(id);
    if (!address) {
      throw new Error('Address not found');
    }

    if (auth.userId !== address.user_id && auth.role !== 'admin' && auth.role !== 'super_admin') {
      throw new Error('Forbidden');
    }

    // First, unset all default addresses for this user
    await supabaseAdmin
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', address.user_id);

    // Then set this one as default
    const { data, error } = await supabaseAdmin
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to set default address: ${error.message}`);
    }

    return data;
  }

  /**
   * Calculate delivery fee based on distance (simplified)
   */
  static calculateDeliveryFee(
    address: Address,
    storeLat: number,
    storeLng: number,
    baseFeeKobo: number,
    perKmKobo: number
  ): number {
    // Since we don't have lat/lng in the current schema, use a simplified approach
    // You can implement more complex logic later if needed
    return baseFeeKobo;
  }
}
