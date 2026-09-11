import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireAdmin } from '@/server/auth';
import { ReportService } from '@/server/services';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    requireAdmin(auth);

    const stats = await ReportService.getOverviewStats();

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
