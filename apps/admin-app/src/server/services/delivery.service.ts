// Delivery Partner Adapter Interface
// This allows swapping between different delivery providers (e.g., Gokada, Bolt, local couriers)

export interface DeliveryQuote {
  fee_kobo: number;
  estimated_minutes: number;
  provider: string;
  provider_ref?: string;
}

export interface DeliveryRequest {
  order_id: string;
  pickup_address: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    lat?: number;
    lng?: number;
  };
  delivery_address: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    lat?: number;
    lng?: number;
  };
  recipient_name: string;
  recipient_phone: string;
  notes?: string;
}

export interface DeliveryStatus {
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  driver_name?: string;
  driver_phone?: string;
  driver_photo?: string;
  estimated_arrival?: string;
  tracking_url?: string;
}

export interface DeliveryAdapter {
  name: string;
  
  // Get a delivery quote before placing an order
  getQuote(request: Omit<DeliveryRequest, 'order_id'>): Promise<DeliveryQuote>;
  
  // Create a delivery request
  createDelivery(request: DeliveryRequest): Promise<{
    delivery_id: string;
    provider_ref: string;
    quote: DeliveryQuote;
  }>;
  
  // Get current delivery status
  getStatus(deliveryId: string): Promise<DeliveryStatus>;
  
  // Cancel a delivery
  cancelDelivery(deliveryId: string, reason: string): Promise<void>;
  
  // Track delivery location (if supported)
  trackDelivery?(deliveryId: string): Promise<{
    lat: number;
    lng: number;
    last_updated: string;
  }>;
}

// Example implementation for a mock/local delivery provider
class MockDeliveryAdapter implements DeliveryAdapter {
  name = 'Mock Delivery';
  
  async getQuote(request: Omit<DeliveryRequest, 'order_id'>): Promise<DeliveryQuote> {
    // Mock calculation based on distance
    const baseFee = 1000;
    const perKmFee = 100;
    const distance = 5; // Mock 5km
    const fee = baseFee + (distance * perKmFee);
    
    return {
      fee_kobo: fee,
      estimated_minutes: 30,
      provider: this.name,
    };
  }
  
  async createDelivery(request: DeliveryRequest): Promise<{
    delivery_id: string;
    provider_ref: string;
    quote: DeliveryQuote;
  }> {
    const deliveryId = `DEL-${Date.now()}`;
    const quote = await this.getQuote(request);
    
    return {
      delivery_id,
      provider_ref: `REF-${Date.now()}`,
      quote,
    };
  }
  
  async getStatus(deliveryId: string): Promise<DeliveryStatus> {
    return {
      status: 'pending',
      estimated_arrival: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }
  
  async cancelDelivery(deliveryId: string, reason: string): Promise<void> {
    console.log(`Cancelling delivery ${deliveryId}: ${reason}`);
  }
}

// Example implementation for Gokada (would use their actual API)
class GokadaAdapter implements DeliveryAdapter {
  name = 'Gokada';
  private apiKey: string;
  private apiUrl: string;
  
  constructor(apiKey: string, apiUrl: string) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }
  
  async getQuote(request: Omit<DeliveryRequest, 'order_id'>): Promise<DeliveryQuote> {
    // Implementation would call Gokada's quote API
    const response = await fetch(`${this.apiUrl}/quote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    const data = await response.json();
    return {
      fee_kobo: data.price,
      estimated_minutes: data.eta,
      provider: this.name,
      provider_ref: data.quote_id,
    };
  }
  
  async createDelivery(request: DeliveryRequest): Promise<{
    delivery_id: string;
    provider_ref: string;
    quote: DeliveryQuote;
  }> {
    const response = await fetch(`${this.apiUrl}/deliveries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    const data = await response.json();
    return {
      delivery_id: data.id,
      provider_ref: data.reference,
      quote: {
        fee_kobo: data.price,
        estimated_minutes: data.eta,
        provider: this.name,
        provider_ref: data.reference,
      },
    };
  }
  
  async getStatus(deliveryId: string): Promise<DeliveryStatus> {
    const response = await fetch(`${this.apiUrl}/deliveries/${deliveryId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });
    
    const data = await response.json();
    return {
      status: data.status,
      driver_name: data.driver?.name,
      driver_phone: data.driver?.phone,
      driver_photo: data.driver?.photo,
      estimated_arrival: data.eta,
      tracking_url: data.tracking_url,
    };
  }
  
  async cancelDelivery(deliveryId: string, reason: string): Promise<void> {
    await fetch(`${this.apiUrl}/deliveries/${deliveryId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
  }
  
  async trackDelivery(deliveryId: string): Promise<{
    lat: number;
    lng: number;
    last_updated: string;
  }> {
    const response = await fetch(`${this.apiUrl}/deliveries/${deliveryId}/location`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });
    
    const data = await response.json();
    return {
      lat: data.latitude,
      lng: data.longitude,
      last_updated: data.timestamp,
    };
  }
}

// Factory to get the appropriate delivery adapter
export function getDeliveryAdapter(provider: string = 'mock'): DeliveryAdapter {
  switch (provider) {
    case 'gokada':
      return new GokadaAdapter(
        process.env.GOKADA_API_KEY || '',
        process.env.GOKADA_API_URL || 'https://api.gokada.com/v1'
      );
    case 'mock':
    default:
      return new MockDeliveryAdapter();
  }
}

// Service class to handle delivery operations
export class DeliveryService {
  private adapter: DeliveryAdapter;
  
  constructor(adapter?: DeliveryAdapter) {
    this.adapter = adapter || getDeliveryAdapter();
  }
  
  async getQuote(request: Omit<DeliveryRequest, 'order_id'>): Promise<DeliveryQuote> {
    return this.adapter.getQuote(request);
  }
  
  async createDelivery(request: DeliveryRequest): Promise<{
    delivery_id: string;
    provider_ref: string;
    quote: DeliveryQuote;
  }> {
    return this.adapter.createDelivery(request);
  }
  
  async getStatus(deliveryId: string): Promise<DeliveryStatus> {
    return this.adapter.getStatus(deliveryId);
  }
  
  async cancelDelivery(deliveryId: string, reason: string): Promise<void> {
    return this.adapter.cancelDelivery(deliveryId, reason);
  }
  
  async trackDelivery(deliveryId: string): Promise<{
    lat: number;
    lng: number;
    last_updated: string;
  } | null> {
    if (this.adapter.trackDelivery) {
      return this.adapter.trackDelivery(deliveryId);
    }
    return null;
  }
}
