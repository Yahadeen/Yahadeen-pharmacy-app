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

    const attendants = await UserService.getAttendants({ limit, offset });

    return NextResponse.json(attendants);
  } catch (error: any) {
    console.error('Error fetching attendants:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    const verifiedAuth = requireAdmin(auth);

    const body = await request.json();
    const attendant = await UserService.createAttendant(body, verifiedAuth);

    return NextResponse.json(attendant, { status: 201 });
  } catch (error: any) {
    console.error('Error creating attendant:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
