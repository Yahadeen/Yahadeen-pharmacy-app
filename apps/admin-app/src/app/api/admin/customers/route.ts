import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireAdmin } from '@/server/auth';
import { UserService } from '@/server/services';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    requireAdmin(auth);

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const customers = await UserService.getCustomers({ limit, offset });

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
