-- Yahadeen Seed Data
-- Initial categories, products, and demo data

-- Insert categories
INSERT INTO categories (name, description, image_url, is_active, sort_order) VALUES
('Pain Relief', 'Pain relievers and analgesics', 'https://images.unsplash.com/photo-1550572017-edd951b9515e?w=400&h=400&fit=crop', true, 1),
('Antibiotics', 'Antibacterial medications', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true, 2),
('Vitamins', 'Vitamins and supplements', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true, 3),
('Cold & Flu', 'Cold and flu remedies', 'https://images.unsplash.com/photo-1550572017-edd951b9515e?w=400&h=400&fit=crop', true, 4),
('Digestive Health', 'Digestive and stomach medications', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true, 5),
('Skin Care', 'Skin treatments and ointments', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop', true, 6),
('First Aid', 'First aid supplies', 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&h=400&fit=crop', true, 7),
('Chronic Conditions', 'Medications for chronic conditions', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true, 8)
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO products (name, generic_name, brand, description, category_id, price_kobo, requires_prescription, is_active, image_url, stock_quantity, low_stock_threshold) VALUES
-- Pain Relief
('Paracetamol 500mg', 'Paracetamol', 'Yahadeen', 'Effective pain reliever for headaches and fever', (SELECT id FROM categories WHERE name = 'Pain Relief'), 500, false, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 50, 10),
('Ibuprofen 400mg', 'Ibuprofen', 'Yahadeen', 'Anti-inflammatory pain reliever', (SELECT id FROM categories WHERE name = 'Pain Relief'), 800, false, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 50, 10),
('Aspirin 75mg', 'Aspirin', 'Yahadeen', 'Low-dose aspirin for pain relief', (SELECT id FROM categories WHERE name = 'Pain Relief'), 600, false, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 50, 10),

-- Antibiotics
('Amoxicillin 500mg', 'Amoxicillin', 'Yahadeen', 'Broad-spectrum antibiotic', (SELECT id FROM categories WHERE name = 'Antibiotics'), 2500, true, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 30, 5),
('Azithromycin 500mg', 'Azithromycin', 'Yahadeen', 'Antibiotic for bacterial infections', (SELECT id FROM categories WHERE name = 'Antibiotics'), 3500, true, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 30, 5),
('Ciprofloxacin 500mg', 'Ciprofloxacin', 'Yahadeen', 'Antibiotic for various infections', (SELECT id FROM categories WHERE name = 'Antibiotics'), 2800, true, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 5, 10),

-- Vitamins
('Vitamin C 1000mg', 'Ascorbic Acid', 'Yahadeen', 'Immune system support', (SELECT id FROM categories WHERE name = 'Vitamins'), 1500, false, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 100, 20),
('Vitamin D3 1000IU', 'Cholecalciferol', 'Yahadeen', 'Bone health and immunity', (SELECT id FROM categories WHERE name = 'Vitamins'), 1800, false, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 100, 20),
('Multivitamin Complete', 'Multivitamin', 'Yahadeen', 'Daily comprehensive vitamin supplement', (SELECT id FROM categories WHERE name = 'Vitamins'), 2500, false, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 100, 20),
('Omega-3 Fish Oil', 'Fish Oil', 'Yahadeen', 'Heart and brain health', (SELECT id FROM categories WHERE name = 'Vitamins'), 3000, false, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 0, 10),

-- Cold & Flu
('Cold Relief Syrup', 'Cold Relief', 'Yahadeen', 'Syrup for cold and flu symptoms', (SELECT id FROM categories WHERE name = 'Cold & Flu'), 1200, false, true, 'https://images.unsplash.com/photo-1550572017-edd951b9515e?w=400&h=400&fit=crop', 25, 8),
('Nasal Decongestant Spray', 'Oxymetazoline', 'Yahadeen', 'Fast nasal congestion relief', (SELECT id FROM categories WHERE name = 'Cold & Flu'), 1500, false, true, 'https://images.unsplash.com/photo-1550572017-edd951b9515e?w=400&h=400&fit=crop', 25, 8),
('Cough Suppressant', 'Dextromethorphan', 'Yahadeen', 'Relief from persistent cough', (SELECT id FROM categories WHERE name = 'Cold & Flu'), 1000, false, true, 'https://images.unsplash.com/photo-1550572017-edd951b9515e?w=400&h=400&fit=crop', 25, 8),

-- Digestive Health
('Antacid Tablets', 'Calcium Carbonate', 'Yahadeen', 'Fast relief from heartburn', (SELECT id FROM categories WHERE name = 'Digestive Health'), 800, false, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 40, 10),
('Probiotic Capsules', 'Probiotics', 'Yahadeen', 'Digestive health support', (SELECT id FROM categories WHERE name = 'Digestive Health'), 2200, false, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 40, 10),
('Anti-Diarrheal', 'Loperamide', 'Yahadeen', 'Relief from diarrhea', (SELECT id FROM categories WHERE name = 'Digestive Health'), 900, false, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 40, 10),

-- Skin Care
('Antibiotic Ointment', 'Bacitracin', 'Yahadeen', 'Prevents infection in minor cuts', (SELECT id FROM categories WHERE name = 'Skin Care'), 1500, false, true, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop', 35, 8),
('Hydrocortisone Cream', 'Hydrocortisone', 'Yahadeen', 'Relief from itching and inflammation', (SELECT id FROM categories WHERE name = 'Skin Care'), 1200, false, true, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop', 35, 8),
('Moisturizing Lotion', 'Moisturizer', 'Yahadeen', 'Daily skin moisturizer', (SELECT id FROM categories WHERE name = 'Skin Care'), 2000, false, true, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop', 35, 8),

-- First Aid
('Bandage Pack', 'Bandages', 'Yahadeen', 'Assorted bandages for wounds', (SELECT id FROM categories WHERE name = 'First Aid'), 1000, false, true, 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&h=400&fit=crop', 60, 15),
('Antiseptic Solution', 'Antiseptic', 'Yahadeen', 'Cleansing solution for wounds', (SELECT id FROM categories WHERE name = 'First Aid'), 800, false, true, 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&h=400&fit=crop', 60, 15),
('Digital Thermometer', 'Thermometer', 'Yahadeen', 'Accurate temperature reading', (SELECT id FROM categories WHERE name = 'First Aid'), 3500, false, true, 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&h=400&fit=crop', 20, 5),

-- Chronic Conditions
('Metformin 500mg', 'Metformin', 'Yahadeen', 'Diabetes management', (SELECT id FROM categories WHERE name = 'Chronic Conditions'), 1500, true, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 45, 10),
('Lisinopril 10mg', 'Lisinopril', 'Yahadeen', 'Blood pressure management', (SELECT id FROM categories WHERE name = 'Chronic Conditions'), 1800, true, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 45, 10),
('Atorvastatin 20mg', 'Atorvastatin', 'Yahadeen', 'Cholesterol management', (SELECT id FROM categories WHERE name = 'Chronic Conditions'), 2500, true, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 45, 10)
ON CONFLICT DO NOTHING;

-- Note: Users will be created via Supabase Auth and synced via triggers
-- Profile tables (admin_profiles, attendant_profiles, customer_profiles) will be populated during registration
