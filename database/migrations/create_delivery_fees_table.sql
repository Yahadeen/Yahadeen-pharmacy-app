-- Create delivery fees table for managing delivery pricing rules
CREATE TABLE IF NOT EXISTS public.delivery_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_fee_naira INTEGER NOT NULL DEFAULT 0,
  fee_per_km_naira INTEGER NOT NULL DEFAULT 0,
  free_delivery_threshold_naira INTEGER NOT NULL DEFAULT 0,
  city VARCHAR(100),
  state VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for delivery fees
CREATE INDEX IF NOT EXISTS idx_delivery_fees_city ON public.delivery_fees(city);
CREATE INDEX IF NOT EXISTS idx_delivery_fees_state ON public.delivery_fees(state);
CREATE INDEX IF NOT EXISTS idx_delivery_fees_active ON public.delivery_fees(is_active);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_fees TO authenticated;

-- Insert default delivery fee rule
INSERT INTO public.delivery_fees (name, description, base_fee_naira, fee_per_km_naira, free_delivery_threshold_naira, city, state, is_active)
VALUES (
  'Standard Delivery',
  'Default delivery fee for all locations',
  1500,  -- 1500 Naira base fee
  1500,   -- 1500 Naira per km
  50000, -- Free delivery for orders over 5000 Naira
  'Lagos', -- City
  'Lagos', -- State
  true
) ON CONFLICT DO NOTHING;
