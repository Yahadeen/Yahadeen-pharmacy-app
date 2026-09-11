import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/server/auth';
import { CategoryService } from '@/server/services';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const categories = await CategoryService.getCategories(activeOnly);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth || (auth.role !== 'admin' && auth.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const category = await CategoryService.createCategory(body, auth);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
