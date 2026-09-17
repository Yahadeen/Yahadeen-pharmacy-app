import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireCustomer } from '@/server/auth';
import { AddressService } from '@/server/services';
import { FREE_DELIVERY_THRESHOLD_KOBO, DELIVERY_BASE_FEE_KOBO, DELIVERY_PER_KM_KOBO } from '@pharmago/shared';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    const verifiedAuth = requireCustomer(auth);

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('address_id');
    const subtotalKobo = searchParams.get('subtotal_kobo');

    if (!addressId || !subtotalKobo) {
      return NextResponse.json(
        { error: 'Missing required parameters: address_id and subtotal_kobo' },
        { status: 400 }
      );
    }

    const subtotal = parseInt(subtotalKobo, 10);
    if (isNaN(subtotal) || subtotal < 0) {
      return NextResponse.json(
        { error: 'Invalid subtotal_kobo value' },
        { status: 400 }
      );
    }

    // Get the address to calculate distance (simplified for now)
    const address = await AddressService.getAddressById(addressId);
    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (address.user_id !== verifiedAuth.userId && verifiedAuth.role !== 'admin' && verifiedAuth.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Since we don't have lat/lng in the current schema, use a simplified distance calculation
    // In production, you would use Google Maps API or similar to calculate actual distance
    const distanceKm = 5; // Default 5km for now

    // Calculate delivery fee
    let feeKobo = 0;
    if (subtotal < FREE_DELIVERY_THRESHOLD_KOBO) {
      feeKobo = DELIVERY_BASE_FEE_KOBO + Math.round(distanceKm * DELIVERY_PER_KM_KOBO);
    }

    const etaMinutes = Math.max(15, Math.round(distanceKm * 10)); // ~10 minutes per km, minimum 15

    const quote = {
      distance_km: distanceKm,
      fee_kobo: feeKobo,
      free_reason: subtotal >= FREE_DELIVERY_THRESHOLD_KOBO ? 'Free over ₦50,000' : null,
      eta_minutes: etaMinutes,
    };

    return NextResponse.json(quote);
  } catch (error: any) {
    console.error('Error fetching delivery quote:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
