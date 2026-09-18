import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireAdmin, requireStaff } from '@/server/auth';
import { ProductService } from '@/server/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const categoryParam = searchParams.get('category_id') || searchParams.get('category');
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('page_size');

    // For admin dashboard (no pagination), use no limit/offset
    // For mobile apps with pagination, calculate limit/offset
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) :
                 pageSizeParam ? parseInt(pageSizeParam!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) :
                 pageParam && pageSizeParam ? (parseInt(pageParam!) - 1) * parseInt(pageSizeParam!) : undefined;

    const filters = {
      category_id: categoryParam && categoryParam !== 'undefined' ? categoryParam : undefined,
      search: searchParams.get('search') || searchParams.get('q') || undefined,
      is_active: searchParams.get('is_active') === 'true' ? true :
                 searchParams.get('is_active') === 'false' ? false : undefined,
      in_stock_only: searchParams.get('in_stock_only') === 'true' ? true : undefined,
      limit,
      offset,
      sort: searchParams.get('sort') || undefined,
    };

    const products = await ProductService.getProducts(filters);

    // For admin dashboard (no pagination params), return array directly
    // For mobile app, return paginated response when pagination params are present
    if (limit !== undefined && offset !== undefined) {
      return NextResponse.json({
        items: products,
        total: products.length,
        page: pageParam ? parseInt(pageParam!) : 1,
        page_size: limit,
      });
    }

    // Mobile app without pagination params - return paginated format with all items
    if (searchParams.has('q') || searchParams.has('category') || searchParams.has('in_stock_only') || searchParams.has('sort')) {
      return NextResponse.json({
        items: products,
        total: products.length,
        page: 1,
        page_size: products.length,
      });
    }

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    const verifiedAuth = requireAdmin(auth);

    const body = await request.json();
    const product = await ProductService.createProduct(body, verifiedAuth);

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
