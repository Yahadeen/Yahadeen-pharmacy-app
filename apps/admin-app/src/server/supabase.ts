import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for use with user JWT (RLS applies)
export function createSupabaseClient(token?: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

// Service role client (bypasses RLS, use with caution)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper to verify JWT and extract user ID
export async function verifyToken(token: string): Promise<{ userId: string; role: string; email?: string } | null> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data.user) {
    return null;
  }

  // Fetch user role from users table
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('role, is_active')
    .eq('id', data.user.id)
    .single();

  if (!user || !user.is_active) {
    return null;
  }

  return {
    userId: data.user.id,
    role: user.role,
    email: data.user.email,
  };
}
