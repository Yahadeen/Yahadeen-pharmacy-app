-- Seed sample products for testing inventory
-- This adds common pharmacy products with stock levels

-- First, ensure we have at least one category
INSERT INTO categories (id, name, description, is_active, sort_order)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Medications', 'Common medications and drugs', true, 1),
  ('00000000-0000-0000-0000-000000000002', 'Supplements', 'Vitamins and dietary supplements', true, 2),
  ('00000000-0000-0000-0000-000000000003', 'Personal Care', 'Personal care and hygiene products', true, 3)
ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, generic_name, brand, description, category_id, price_kobo, requires_prescription, is_active, stock_quantity, low_stock_threshold)
VALUES
  -- Pain Relief
  ('Paracetamol 500mg', 'Paracetamol', 'Emzor', 'Pain relief and fever reduction', '00000000-0000-0000-0000-000000000001', 5000, false, true, 150, 20),
  ('Ibuprofen 400mg', 'Ibuprofen', 'Advil', 'Anti-inflammatory pain relief', '00000000-0000-0000-0000-000000000001', 8000, false, true, 85, 15),
  ('Aspirin 75mg', 'Aspirin', 'Bayer', 'Pain relief and blood thinner', '00000000-0000-0000-0000-000000000001', 4500, false, true, 200, 30),
  
  -- Antibiotics (require prescription)
  ('Amoxicillin 500mg', 'Amoxicillin', 'GSK', 'Antibiotic for bacterial infections', '00000000-0000-0000-0000-000000000001', 12000, true, true, 45, 10),
  ('Ciprofloxacin 500mg', 'Ciprofloxacin', 'Bayer', 'Broad-spectrum antibiotic', '00000000-0000-0000-0000-000000000001', 15000, true, true, 30, 8),
  ('Azithromycin 250mg', 'Azithromycin', 'Pfizer', 'Antibiotic for respiratory infections', '00000000-0000-0000-0000-000000000001', 18000, true, true, 25, 10),
  
  -- Cold & Flu
  ('Cold Relief Syrup', 'Cold Relief', 'Benylin', 'Cough and cold relief syrup', '00000000-0000-0000-0000-000000000001', 6500, false, true, 60, 15),
  ('Vitamin C 1000mg', 'Ascorbic Acid', 'Nature\'s Way', 'Immune system support', '00000000-0000-0000-0000-000000000002', 9000, false, true, 120, 25),
  ('Zinc 50mg', 'Zinc', 'Now Foods', 'Immune support supplement', '00000000-0000-0000-0000-000000000002', 7500, false, true, 90, 20),
  
  -- Allergy
  ('Loratadine 10mg', 'Loratadine', 'Claritin', 'Allergy relief', '00000000-0000-0000-0000-000000000001', 7000, false, true, 75, 15),
  ('Cetirizine 10mg', 'Cetirizine', 'Zyrtec', 'Antihistamine for allergies', '00000000-0000-0000-0000-000000000001', 6500, false, true, 80, 15),
  
  -- Digestive Health
  ('Antacid Tablets', 'Calcium Carbonate', 'Tums', 'Heartburn and indigestion relief', '00000000-0000-0000-0000-000000000001', 4000, false, true, 200, 40),
  ('Probiotics', 'Probiotic Blend', 'Culturelle', 'Digestive health support', '00000000-0000-0000-0000-000000000002', 15000, false, true, 50, 12),
  
  -- Personal Care
  ('Hand Sanitizer', 'Alcohol-based', 'Dettol', 'Hand sanitizer 500ml', '00000000-0000-0000-0000-000000000003', 3500, false, true, 5, 10),
  ('Face Masks (50 pack)', 'Surgical Masks', '3M', 'Disposable face masks', '00000000-0000-0000-0000-000000000003', 10000, false, true, 3, 10),
  ('Thermometer Digital', 'Digital Thermometer', 'Omron', 'Digital thermometer for temperature', '00000000-0000-0000-0000-000000000003', 8000, false, true, 15, 5),
  
  -- Chronic Conditions
  ('Metformin 500mg', 'Metformin', 'Merck', 'Diabetes management', '00000000-0000-0000-0000-000000000001', 5500, true, true, 100, 20),
  ('Amlodipine 5mg', 'Amlodipine', 'Pfizer', 'Blood pressure medication', '00000000-0000-0000-0000-000000000001', 6000, true, true, 70, 15),
  ('Lisinopril 10mg', 'Lisinopril', 'AstraZeneca', 'Blood pressure medication', '00000000-0000-0000-0000-000000000001', 5500, true, true, 65, 15),
  
  -- First Aid
  ('Bandages Pack', 'Adhesive Bandages', 'Band-Aid', 'Assorted bandages', '00000000-0000-0000-0000-000000000003', 2500, false, true, 150, 30),
  ('Antiseptic Solution', 'Chlorhexidine', 'Dettol', 'Wound cleaning solution', '00000000-0000-0000-0000-000000000003', 3000, false, true, 80, 20),
  ('Cotton Wool', 'Absorbent Cotton', 'Johnson & Johnson', 'Medical cotton wool', '00000000-0000-0000-0000-000000000003', 2000, false, true, 200, 50)
ON CONFLICT DO NOTHING;
