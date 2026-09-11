import { supabaseAdmin } from '../supabase';
import { AuthContext } from '../auth';

export interface Address {
  id: string;
  user_id: string;
  label?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code?: string;
  country: string;
  is_default: boolean;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressInput {
  user_id: string;
  label?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code?: string;
  country?: string;
  lat?: number;
  lng?: number;
  is_default?: boolean;
}

export interface UpdateAddressInput {
  label?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  lat?: number;
  lng?: number;
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
        label: input.label,
        address_line1: input.address_line1,
        address_line2: input.address_line2,
        city: input.city,
        state: input.state,
        postal_code: input.postal_code,
        country: input.country || 'Nigeria',
        lat: input.lat,
        lng: input.lng,
        is_default: input.is_default || false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create address: ${error.message}`);
    }

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
    if (!address.lat || !address.lng) {
      return baseFeeKobo;
    }

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (address.lat - storeLat) * (Math.PI / 180);
    const dLng = (address.lng - storeLng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(storeLat * (Math.PI / 180)) *
        Math.cos(address.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return baseFeeKobo + Math.floor(distance * perKmKobo);
  }
}
