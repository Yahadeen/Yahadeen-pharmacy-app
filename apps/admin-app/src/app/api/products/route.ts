import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireAdmin } from '@/server/auth';
import { ProductService } from '@/server/services';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    const { searchParams } = new URL(request.url);

    const categoryParam = searchParams.get('category_id') || searchParams.get('category');
    const filters = {
      category_id: categoryParam && categoryParam !== 'undefined' ? categoryParam : undefined,
      search: searchParams.get('search') || searchParams.get('q') || undefined,
      is_active: searchParams.get('is_active') === 'true' ? true :
                 searchParams.get('is_active') === 'false' ? false : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) :
              searchParams.get('page_size') ? parseInt(searchParams.get('page_size')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
      sort: searchParams.get('sort') || undefined,
    };

    const products = await ProductService.getProducts(filters);

    // Return paginated response format expected by mobile app
    return NextResponse.json({
      items: products,
      total: products.length,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      page_size: filters.limit || products.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
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
