import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireStaff } from '@/server/auth';
import { supabaseAdmin } from '@/server/supabase';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Staff (attendants, admins, super_admins) can view inventory
    requireStaff(auth);

    const { searchParams } = new URL(request.url);

    const search = searchParams.get('q') || searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const pageSize = searchParams.get('page_size') ? parseInt(searchParams.get('page_size')!) : 100;
    const inStockOnly = searchParams.get('in_stock_only') === 'true';

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
        updated_at,
        categories:category_id (
          name
        )
      `)
      .eq('is_active', true)
      .order('stock_quantity', { ascending: true }); // Sort by stock ascending (lowest first)

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,generic_name.ilike.%${search}%,brand.ilike.%${search}%`);
    }

    // Apply category filter
    if (category) {
      query = query.eq('category_id', category);
    }

    // Apply in-stock filter
    if (inStockOnly) {
      query = query.gt('stock_quantity', 0);
    }

    // Get total count before pagination
    const { count } = await query;

    // Apply pagination
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching inventory products:', error);
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }

    // Format the response to match the expected ProductWithStock interface
    const formattedProducts = data?.map((item: any) => ({
      ...item,
      quantity: item.stock_quantity || 0,
      stock_quantity: item.stock_quantity || 0,
      low_stock_threshold: item.low_stock_threshold || 10,
      category_name: item.categories?.name || null,
    })) || [];

    return NextResponse.json({
      items: formattedProducts,
      total: count || 0,
      page,
      page_size: pageSize,
    });
  } catch (error: any) {
    console.error('Inventory products error:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
