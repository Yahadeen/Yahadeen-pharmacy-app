import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireStaff } from '@/server/auth';
import { InventoryService } from '@/server/services';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const auth = await getAuthContext(request);
    requireStaff(auth);

    const { productId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const movements = await InventoryService.getStockMovements(productId, limit);

    return NextResponse.json(movements);
  } catch (error: any) {
    console.error('Error fetching stock movements:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
