import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/server/services';

export async function GET(request: NextRequest) {
  try {
    // Get featured products (products with quantity > 0, limit to 6)
    const products = await ProductService.getProducts({ is_active: true });
    
    // Sort by quantity (higher stock = more popular) and take top 6
    const featured = products
      .filter((p) => (p as any).quantity > 0)
      .sort((a, b) => (b as any).quantity - (a as any).quantity)
      .slice(0, 6);

    return NextResponse.json(featured);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
