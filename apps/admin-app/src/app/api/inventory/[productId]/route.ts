import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireStaff } from '@/server/auth';
import { InventoryService } from '@/server/services';
import { ProductService } from '@/server/services';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const auth = await getAuthContext(request);
    const verifiedAuth = requireStaff(auth);

    const body = await request.json();
    const { productId } = await params;
    await InventoryService.updateStock(
      { product_id: productId, ...body },
      verifiedAuth
    );

    // Return the updated product with stock information
    const updatedProduct = await ProductService.getProductById(productId);

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error('Error updating inventory:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
