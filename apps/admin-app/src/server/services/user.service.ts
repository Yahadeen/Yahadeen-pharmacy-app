import { supabaseAdmin } from '../supabase';
import { AuthContext } from '../auth';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  preferred_payment_method?: string;
  role: 'customer' | 'attendant' | 'admin' | 'super_admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAttendantInput {
  email: string;
  full_name: string;
  phone?: string;
  password: string;
}

export interface UpdateProfileInput {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  preferred_payment_method?: string;
}

export class UserService {
  /**
   * Get user profile by ID
   */
  static async getProfileById(userId: string): Promise<Profile | null> {
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch profile: ${userError.message}`);
    }

    // If user is a customer, fetch customer profile for additional fields
    if (user.role === 'customer') {
      const { data: customerProfile, error: profileError } = await supabaseAdmin
        .from('customer_profiles')
        .select('date_of_birth, preferred_payment_method')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profileError && customerProfile) {
        return {
          ...user,
          date_of_birth: customerProfile.date_of_birth,
          preferred_payment_method: customerProfile.preferred_payment_method,
        };
      }
    }

    return user;
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    input: UpdateProfileInput,
    auth: AuthContext
  ): Promise<Profile> {
    // Only allow users to update their own profile unless admin
    if (auth.userId !== userId && auth.role !== 'admin' && auth.role !== 'super_admin') {
      throw new Error('Forbidden');
    }

    // Separate user fields from customer profile fields
    const userFields: Partial<UpdateProfileInput> = {
      full_name: input.full_name,
      phone: input.phone,
      avatar_url: input.avatar_url,
    };

    const customerFields: { date_of_birth?: string; preferred_payment_method?: string } = {
      date_of_birth: input.date_of_birth,
      preferred_payment_method: input.preferred_payment_method,
    };

    // Update users table
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .update(userFields)
      .eq('id', userId)
      .select()
      .single();

    if (userError) {
      throw new Error(`Failed to update profile: ${userError.message}`);
    }

    // If user is a customer, update customer_profiles table
    if (user.role === 'customer') {
      const { error: profileError } = await supabaseAdmin
        .from('customer_profiles')
        .update(customerFields)
        .eq('user_id', userId);

      if (profileError) {
        // If customer profile doesn't exist, create it
        if (profileError.code === 'PGRST116') {
          await supabaseAdmin
            .from('customer_profiles')
            .insert({
              user_id: userId,
              ...customerFields,
              preferred_payment_method: customerFields.preferred_payment_method || 'card',
              payment_methods: [],
              loyalty_points: 0,
              total_orders: 0,
              total_spent_kobo: 0,
            });
        } else {
          throw new Error(`Failed to update customer profile: ${profileError.message}`);
        }
      }
    }

    return {
      ...user,
      date_of_birth: input.date_of_birth,
      preferred_payment_method: input.preferred_payment_method,
    };
  }

  /**
   * Get all customers
   */
  static async getCustomers(filters?: {
    limit?: number;
    offset?: number;
  }): Promise<Profile[]> {
    let query = supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all attendants
   */
  static async getAttendants(filters?: {
    limit?: number;
    offset?: number;
  }): Promise<Profile[]> {
    let query = supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'attendant')
      .order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch attendants: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new attendant account (admin only)
   */
  static async createAttendant(input: CreateAttendantInput, auth: AuthContext): Promise<Profile> {
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`);
    }

    // Create user
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: input.email,
        full_name: input.full_name,
        phone: input.phone,
        role: 'attendant',
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      // Rollback auth user creation
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    return profile;
  }

  /**
   * Activate/deactivate a user (admin only)
   */
  static async setUserActiveStatus(
    userId: string,
    isActive: boolean,
    auth: AuthContext
  ): Promise<Profile> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user status: ${error.message}`);
    }

    return data;
  }

  /**
   * Get customer with order history
   */
  static async getCustomerWithHistory(customerId: string): Promise<{
    profile: Profile;
    orders: any[];
  } | null> {
    const [profile, orders] = await Promise.all([
      this.getProfileById(customerId),
      supabaseAdmin
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (!profile) {
      return null;
    }

    return {
      profile,
      orders: orders.data || [],
    };
  }
}
