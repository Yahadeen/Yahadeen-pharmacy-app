import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NotificationService } from '@/server/services';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, email, phone, date_of_birth, password } = body;

    // Validate input
    if (!full_name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate date of birth if provided
    if (date_of_birth) {
      const dob = new Date(date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      const ageInYears = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) 
        ? age - 1 
        : age;
      
      if (isNaN(dob.getTime()) || ageInYears < 14 || ageInYears > 120) {
        return NextResponse.json(
          { error: 'You must be at least 14 years old to use this app' },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser.users.find(u => u.email === email.toLowerCase());
    
    if (userExists) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Create user with Supabase Auth using admin API (bypasses RLS)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
        phone: phone.trim(),
        date_of_birth: date_of_birth || null,
        role: 'customer',
      },
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Failed to create account' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Create user row in users table using RLS-bypass function
    const { data: user, error: userError } = await supabaseAdmin.rpc('create_user_with_bypass', {
      p_id: userId,
      p_email: email.trim().toLowerCase(),
      p_full_name: full_name.trim(),
      p_phone: phone.trim(),
      p_role: 'customer',
    });

    if (userError) {
      console.error('Failed to create user row:', userError);
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // Create customer_profile row using RLS-bypass function
    const { error: profileError } = await supabaseAdmin.rpc('create_customer_profile_with_bypass', {
      p_user_id: userId,
      p_date_of_birth: date_of_birth || null,
      p_preferred_payment_method: 'card',
      p_payment_methods: [],
      p_loyalty_points: 0,
      p_total_orders: 0,
      p_total_spent_kobo: 0,
    });

    if (profileError) {
      console.error('Failed to create customer profile:', profileError);
      // Rollback: delete user and auth user
      await supabaseAdmin.from('users').delete().eq('id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create customer profile' },
        { status: 500 }
      );
    }

    // Create welcome notification using RLS-bypass function
    try {
      await supabaseAdmin.rpc('create_notification_with_bypass', {
        p_user_id: userId,
        p_type: 'welcome',
        p_priority: 'high',
        p_title: 'Welcome to Yahadeen Pharm Go!',
        p_message: `Hi ${full_name.trim()}, welcome to Yahadeen Pharm Go! We're excited to have you with us. Start exploring our products and place your first order.`,
        p_data: { type: 'welcome' },
      });
    } catch (notificationError) {
      console.error('Failed to create welcome notification:', notificationError);
      // Don't fail the signup if notification fails
    }

    return NextResponse.json({ 
      success: true,
      needsConfirmation: false // Admin API creates confirmed users by default
    });
  } catch (error) {
    console.error('Customer signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
