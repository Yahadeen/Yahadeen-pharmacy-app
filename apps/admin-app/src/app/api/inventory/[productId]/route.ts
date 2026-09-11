import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireStaff } from '@/server/auth';
import { InventoryService } from '@/server/services';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const auth = await getAuthContext(request);
    const verifiedAuth = requireStaff(auth);

    const body = await request.json();
    await InventoryService.updateStock(
      { product_id: params.productId, ...body },
      verifiedAuth
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating inventory:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
