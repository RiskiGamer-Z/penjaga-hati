-- Seed Test Data for Penjaga Hati
-- Creates 5 customers, 5 mitra, 5 orders, and 5 payments
-- Run this migration to populate test data

-- ============================================
-- Insert Test Customer Users
-- ============================================
INSERT INTO users (id, email, full_name, phone, role, is_active, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'budi@test.com', 'Budi Santoso', '081234567890', 'user', true, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'siti@test.com', 'Siti Nurhaliza', '081234567891', 'user', true, NOW()),
  ('33333333-3333-3333-3333-333333333333', 'ahmad@test.com', 'Ahmad Hidayat', '081234567892', 'user', true, NOW()),
  ('44444444-4444-4444-4444-444444444444', 'rina@test.com', 'Rina Wijaya', '081234567893', 'user', true, NOW()),
  ('55555555-5555-5555-5555-555555555555', 'yudi@test.com', 'Yudi Pratama', '081234567894', 'user', true, NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- Insert Test Mitra Users
-- ============================================
INSERT INTO users (id, email, full_name, phone, role, is_active, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'mitra1@test.com', 'Dr. Bambang Setiawan', '081334567890', 'mitra', true, NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'mitra2@test.com', 'Ibu Nurdin Pratiwi', '081334567891', 'mitra', true, NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'mitra3@test.com', 'Pak Suwarman Handoko', '081334567892', 'mitra', true, NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'mitra4@test.com', 'Dewi Kusumawati', '081334567893', 'mitra', true, NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'mitra5@test.com', 'Hendra Wijaya', '081334567894', 'mitra', true, NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- Insert Test Mitra Profiles
-- ============================================
INSERT INTO mitras (user_id, is_verified, bio, experience, specialization, rating, total_orders_completed, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, 'Perawat profesional dengan 8 tahun pengalaman', 8, 'Perawatan Umum', 4.8, 45, NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true, 'Ahli dalam perawatan ibu hamil & bayi', 6, 'Perawatan Ibu Hamil', 4.9, 38, NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', true, 'Spesialisasi perawatan lansia & rehabilitasi', 10, 'Perawatan Lansia', 4.7, 62, NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', true, 'Companion sehat berbasis ilmu keperawatan', 4, 'Companion Kesehatan', 4.6, 28, NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', true, 'Terapis kesehatan dengan sertifikasi internasional', 7, 'Terapi Kesehatan', 4.85, 51, NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- Insert Test Hospitals
-- ============================================
INSERT INTO hospitals (name, city, address, phone, created_at) VALUES
  ('Rumah Sakit Medistra', 'Jakarta Selatan', 'Jl. Gatot Subroto, Jakarta', '021-2522222', NOW()),
  ('RSUPN Cipto Mangunkusumo', 'Jakarta Pusat', 'Jl. Diponegoro, Jakarta', '021-3918333', NOW()),
  ('Rumah Sakit Advent', 'Bandung', 'Jl. Asia Afrika, Bandung', '022-4206666', NOW()),
  ('Rumah Sakit Karya Medika', 'Bogor', 'Jl. Ahmad Yani, Bogor', '0251-8340888', NOW()),
  ('Rumah Sakit Pondok Gede', 'Tangerang', 'Jl. Melati, Tangerang', '021-8669888', NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- Get Hospital IDs for Orders
-- ============================================
-- Note: Orders will use the actual hospital IDs from the table

-- ============================================
-- Insert Test Orders
-- ============================================
WITH hospital_ids AS (
  SELECT id, row_number() OVER (ORDER BY created_at) as rn FROM hospitals ORDER BY created_at LIMIT 5
),
package_ids AS (
  SELECT id, base_price, row_number() OVER (ORDER BY duration_hours) as rn FROM service_packages ORDER BY duration_hours
)
INSERT INTO orders (
  user_id, 
  mitra_id, 
  package_id, 
  hospital_id,
  patient_name, 
  patient_age, 
  patient_condition, 
  status, 
  total_price, 
  created_at
) 
SELECT 
  users_cte.user_id,
  mitra_cte.mitra_id,
  pkg.id,
  h.id,
  'Pasien ' || (row_number() OVER () :: text),
  FLOOR(random() * 60 + 20)::INT,
  'Pemulihan umum',
  CASE (row_number() OVER ()) % 4
    WHEN 1 THEN 'pending_payment'
    WHEN 2 THEN 'waiting_mitra'
    WHEN 3 THEN 'accepted'
    ELSE 'completed'
  END,
  pkg.base_price,
  NOW() - INTERVAL '1 day' * (row_number() OVER ())
FROM 
  (VALUES 
    ('11111111-1111-1111-1111-111111111111'),
    ('22222222-2222-2222-2222-222222222222'),
    ('33333333-3333-3333-3333-333333333333'),
    ('44444444-4444-4444-4444-444444444444'),
    ('55555555-5555-5555-5555-555555555555')
  ) AS users_cte(user_id),
  (VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee')
  ) AS mitra_cte(mitra_id),
  service_packages pkg,
  hospitals h
WHERE 
  pkg.id IN (SELECT id FROM service_packages LIMIT 1) OR
  pkg.id IN (SELECT id FROM service_packages LIMIT 1 OFFSET 1) OR
  pkg.id IN (SELECT id FROM service_packages LIMIT 1 OFFSET 2)
LIMIT 5
ON CONFLICT DO NOTHING;

-- ============================================
-- Insert Test Payments
-- ============================================
WITH recent_orders AS (
  SELECT id, user_id, total_price, status FROM orders 
  WHERE patient_name LIKE 'Pasien %'
  ORDER BY created_at DESC LIMIT 5
)
INSERT INTO payments (
  order_id,
  user_id,
  amount,
  status,
  method,
  reference,
  paid_at,
  created_at
)
SELECT 
  ro.id,
  ro.user_id,
  ro.total_price,
  CASE ro.status
    WHEN 'pending_payment' THEN 'pending'
    ELSE 'completed'
  END,
  CASE (row_number() OVER ())  % 3
    WHEN 1 THEN 'transfer'
    WHEN 2 THEN 'credit_card'
    ELSE 'e_wallet'
  END,
  'PAY-' || DATE_PART('epoch', NOW())::text || '-' || (row_number() OVER ())::text,
  CASE WHEN ro.status != 'pending_payment' THEN ro.created_at ELSE NULL END,
  NOW()
FROM recent_orders ro
ON CONFLICT DO NOTHING;
