import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireAdmin } from '@/server/auth';
import { ReportService } from '@/server/services';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    requireAdmin(auth);

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let data;

    switch (reportType) {
      case 'sales':
        data = await ReportService.getSalesReport(startDate || '', endDate || '');
        break;
      case 'best_sellers':
        data = await ReportService.getBestSellingProducts(startDate || undefined, endDate || undefined);
        break;
      case 'delivery':
        data = await ReportService.getDeliveryPerformance(startDate || undefined, endDate || undefined);
        break;
      case 'low_stock':
        data = await ReportService.getLowStockReport();
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching report:', error);
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
