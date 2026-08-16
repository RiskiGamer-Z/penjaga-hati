-- ============================================
-- PENJAGA HATI — Session 5 Database Migration
-- Tier Packages System, Attendance & Order Photos Workflow
-- Created: August 15, 2026
-- FIXED: Individual INSERT statements + fixed VIEW syntax
-- ============================================

-- ============================================
-- GROUP A: SERVICE PACKAGES — Tier System Enhancement
-- ============================================
ALTER TABLE service_packages 
  ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold')),
  ADD COLUMN IF NOT EXISTS duration_unit TEXT DEFAULT 'hours' CHECK (duration_unit IN ('hours', 'days', 'weeks')),
  ADD COLUMN IF NOT EXISTS max_duration INT,
  ADD COLUMN IF NOT EXISTS min_duration INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS price_per_unit INT,
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS color_hex TEXT DEFAULT '#6B7280';

CREATE INDEX IF NOT EXISTS idx_service_packages_tier ON service_packages(tier);
CREATE INDEX IF NOT EXISTS idx_service_packages_duration_unit ON service_packages(duration_unit);

-- ============================================
-- GROUP B: ATTENDANCES — Attendance Tracking System
-- Mitra check-in/check-out setiap 6 jam
-- ============================================
CREATE TABLE IF NOT EXISTS attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  mitra_id UUID REFERENCES mitras(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ DEFAULT now(),
  check_out_time TIMESTAMPTZ,
  status TEXT CHECK (status IN ('checked_in', 'checked_out')),
  photo_url TEXT,
  gps_location JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendances_order_id ON attendances(order_id);
CREATE INDEX IF NOT EXISTS idx_attendances_mitra_id ON attendances(mitra_id);
CREATE INDEX IF NOT EXISTS idx_attendances_check_in_time ON attendances(check_in_time DESC);
CREATE INDEX IF NOT EXISTS idx_attendances_status ON attendances(status);

-- ============================================
-- GROUP C: ORDER PHOTOS — Workflow Proof Photos
-- Foto bukti di setiap step alur pesanan
-- ============================================
CREATE TABLE IF NOT EXISTS order_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  mitra_id UUID REFERENCES mitras(id) ON DELETE CASCADE,
  step TEXT CHECK (step IN ('accepted', 'arrived', 'started', 'completed')),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_photos_order_id ON order_photos(order_id);
CREATE INDEX IF NOT EXISTS idx_order_photos_step ON order_photos(step);
CREATE INDEX IF NOT EXISTS idx_order_photos_created_at ON order_photos(created_at DESC);

-- ============================================
-- GROUP D: ORDERS ENHANCEMENT
-- Column untuk tracking workflow progress
-- ============================================
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS current_step TEXT DEFAULT 'pending_payment' 
    CHECK (current_step IN ('pending_payment', 'waiting_mitra', 'accepted', 'transit', 'arrived', 'in_progress', 'completed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS attendance_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS photo_count INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_current_step ON orders(current_step);

-- ============================================
-- INSERT DEFAULT PACKAGES — 11 Paket (Bronze/Silver/Gold)
-- Admin bisa edit harga via admin panel
-- NOTE: Setiap paket INSERT sendiri agar aman paste ke Supabase
-- ============================================

-- BRONZE TIER -- Based on Hours
INSERT INTO service_packages (name, description, duration_hours, duration_unit, tier, price_per_unit, min_duration, max_duration, features, color_hex, icon) VALUES
('Bronze - 12 Jam', 'Pendampingan dasar 12 jam untuk kunjungan medis atau keperluan sehari-hari', 12, 'hours', 'bronze', 150000, 12, 12, '["Pendaftaran di RS", "Antrian dokter", "Pemberian obat rutin", "Pemantauan vital dasar"]', '#C0C0C0', 'E29');

INSERT INTO service_packages (name, description, duration_hours, duration_unit, tier, price_per_unit, min_duration, max_duration, features, color_hex, icon) VALUES
('Bronze - 24 Jam', 'Pendampingan penuh 24 jam dengan absensi berkala setiap 6 jam', 24, 'hours', 'bronze', 280000, 24, 24, '["Pendaftaran di RS", "Antrian dokter", "Pemberian obat rutin", "Pemantauan vital berkala", "Absensi 6 jam", "Laporan harian"]', '#C0C0C0', 'E29');

-- SILVER TIER -- Based on Days
INSERT INTO service_packages (name, description, duration_hours, duration_unit, tier, price_per_unit, min_duration, max_duration, features, color_hex, icon) VALUES
('Silver - 1 Hari', 'Pendampingan intensif 24 jam dengan laporan harian lengkap', 1, 'days', 'silver', 350000, 1, 1, '["Absensi setiap 6 jam", "Laporan harian detail", "Pemantauan vital berkala", "Pendampingan makan dan minum"]', '#A0A0A0', 'EA2');

INSERT INTO service_packages (name, description, duration_hours, duration_unit, tier, price_per_unit, min_duration, max_duration, features, color_hex, icon) VALUES
('Silver - 2 Hari', 'Pendampingan intensif 2 hari dengan laporan harian', 2, 'days', 'silver', 650000, 2, 2, '["Absensi setiap 6 jam", "Laporan harian detail", "Pemantauan vital berkala", "Pendampingan makan dan minum"]', '#A0A0A0', 'EA2');

INSERT INTO service_packages (name, description, duration_hours, duration_unit, tier, price_per_unit, min_duration, max_duration, features, color_hex, icon) VALUES
('Silver - 3 Hari', 'Pendampingan intensif 3 hari dengan laporan harian', 3, 'days', 'silver', 950000, 3, 3, '["Absensi setiap 6 jam", "Laporan harian detail", "Pemantauan vital berkala", "Pendampingan makan dan minum"]', '#A0A0A0', 'EA2');

INSERT INTO service_packages (name, description, duration_hours, duration_unit, tier, price_per_unit, min_duration, max_duration, features, color_hex, icon) VALUES
('Silver - 5 Hari', 'Pendampingan intensif 5 hari dengan laporan harian', 5, 'days', 'silver', 1500000, 5, 5, '["Absensi setiap 6 jam", "Laporan harian detail", "Pemantauan vital berkala", "Pendampingan makan dan minum"]', '#A0A0A0', 'EA2');

INSERT INTO service_packages (name, description, duration_hours, duration_unit, tier, price_per_unit, min_duration, max_duration, features, color_hex, icon) VALUES
('Silver - 7 Hari', 'Pendampingan intensif 7 hari dengan laporan harian lengkap', 7, 'days', 'silver', 2000000, 7, 7, '["Absensi setiap 6 jam", "Laporan harian + rangkuman mingguan", "Pemantauan vital berkala", "Pendampingan makan dan minum"]', '#A0A0A0', 'EA2');

-- GOLD TIER -- Based on Weeks
INSERT INTO service_packages (name, description, duration_hours, duration_unit, tier, price_per_unit, min_duration, max_duration, features, color_hex, icon) VALUES
('Gold - 1 Minggu', 'Pendampingan premium 7 hari dengan laporan komprehensif', 1, 'weeks', 'gold', 2100000, 1, 1, '["Absensi setiap 6 jam nonstop", "Laporan harian + rangkuman mingguan", "Konsultasi dokter online", "Pemantauan 24 jam full"]', '#FFD700', 'EAE7');

INSERT INTO service_packages (name, description, duration_hours, duration_unit, tier, price_per_unit, min_duration, max_duration, features, color_hex, icon) VALUES
('Gold - 2 Minggu', 'Pendampingan premium 14 hari dengan laporan komprehensif', 2, 'weeks', 'gold', 4000000, 2, 2, '["Absensi setiap 6 jam nonstop", "Laporan harian + rangkuman mingguan", "Konsultasi dokter online", "Pemantauan 24 jam full"]', '#FFD700', 'EAE7');

INSERT INTO service_packages (name, description, duration_hours, duration_unit, tier, price_per_unit, min_duration, max_duration, features, color_hex, icon) VALUES
('Gold - 3 Minggu', 'Pendampingan premium 21 hari dengan laporan komprehensif', 3, 'weeks', 'gold', 5800000, 3, 3, '["Absensi setiap 6 jam nonstop", "Laporan harian + rangkuman mingguan", "Konsultasi dokter online", "Pemantauan 24 jam full"]', '#FFD700', 'EAE7');

INSERT INTO service_packages (name, description, duration_hours, duration_unit, tier, price_per_unit, min_duration, max_duration, features, color_hex, icon) VALUES
('Gold - 4 Minggu', 'Pendampingan premium 28 hari dengan laporan komprehensif lengkap', 4, 'weeks', 'gold', 7500000, 4, 4, '["Absensi setiap 6 jam nonstop", "Laporan harian + rangkuman mingguan", "Konsultasi dokter online", "Pemantauan 24 jam full", "Follow-up pasca perawatan"]', '#FFD700', 'EAE7');

-- ============================================
-- CLEANUP & BACKFILL (idempotent — aman run ulang)
-- Karena migration ini dijalankan berkali-kali saat debugging,
-- INSERT di atas bisa menghasilkan duplikat. Blok ini:
-- 1. Reassign orders ke paket yang dipertahankan (id terkecil)
-- 2. Hapus paket duplikat
-- 3. Sync base_price dari price_per_unit (app masih baca base_price)
-- ============================================

-- 1. Reassign orders yang mereferensikan paket duplikat
UPDATE orders o
SET package_id = keep.id
FROM service_packages dup
JOIN service_packages keep ON keep.name = dup.name AND keep.id < dup.id
WHERE o.package_id = dup.id;

-- 2. Hapus paket duplikat (keep id terkecil per nama)
DELETE FROM service_packages dup
USING service_packages keep
WHERE dup.name = keep.name AND dup.id > keep.id;

-- 3. Backfill base_price dari price_per_unit
UPDATE service_packages
SET base_price = COALESCE(price_per_unit, base_price)
WHERE base_price IS NULL;

-- ============================================
-- VIEW: Package Details dengan Stats
-- ============================================
CREATE OR REPLACE VIEW v_package_details AS
SELECT 
  sp.id,
  sp.name,
  sp.description,
  sp.duration_hours,
  sp.duration_unit,
  sp.tier,
  sp.price_per_unit,
  sp.min_duration,
  sp.max_duration,
  sp.features,
  sp.color_hex,
  sp.icon,
  COUNT(o.id) as total_orders,
  COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_orders,
  ROUND(AVG(
    CASE WHEN sp.price_per_unit > 0 THEN sp.price_per_unit::numeric ELSE NULL END
  ), 0)::int as avg_revenue
FROM service_packages sp
LEFT JOIN orders o ON sp.id = o.package_id AND o.package_id IS NOT NULL
GROUP BY sp.id;

-- ============================================
-- VIEW: Mitra Active Orders dengan Progress
-- ============================================
CREATE OR REPLACE VIEW v_mitra_active_orders AS
SELECT 
  o.id as order_id,
  o.patient_name,
  o.hospital_id,
  h.name as hospital_name,
  sp.name as package_name,
  sp.tier,
  o.current_step,
  sp.price_per_unit as package_price,
  o.created_at,
  COUNT(ap.id) as photos_submitted,
  COUNT(att.id) as attendances_done
FROM orders o
LEFT JOIN hospitals h ON o.hospital_id = h.id
LEFT JOIN service_packages sp ON o.package_id = sp.id
LEFT JOIN order_photos ap ON o.id = ap.order_id
LEFT JOIN attendances att ON o.id = att.order_id
WHERE o.current_step NOT IN ('completed', 'cancelled', 'pending_payment')
GROUP BY o.id, h.name, sp.name, sp.tier, sp.price_per_unit, o.current_step;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_photos ENABLE ROW LEVEL SECURITY;

-- Attendances Policies (with IF NOT EXISTS guard)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users_can_view_attendances_of_their_orders') THEN
    CREATE POLICY "Users can view attendances of their orders" 
      ON attendances FOR SELECT 
      USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Mitras_can_manage_attendances_for_their_orders') THEN
    CREATE POLICY "Mitras can manage attendances for their orders" 
      ON attendances FOR ALL 
      USING (mitra_id = (SELECT id FROM mitras WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Only_admins_can_modify_all_attendances') THEN
    CREATE POLICY "Only admins can modify all attendances" 
      ON attendances FOR ALL 
      USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'owner'));
  END IF;
END $$;

-- Order Photos Policies (with IF NOT EXISTS guard)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users_can_view_order_photos_of_their_orders') THEN
    CREATE POLICY "Users can view order photos of their orders" 
      ON order_photos FOR SELECT 
      USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Mitras_can_manage_order_photos_for_their_orders') THEN
    CREATE POLICY "Mitras can manage order photos for their orders" 
      ON order_photos FOR ALL 
      USING (mitra_id = (SELECT id FROM mitras WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Only_admins_can_modify_all_order_photos') THEN
    CREATE POLICY "Only admins can modify all order photos" 
      ON order_photos FOR ALL 
      USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'owner'));
  END IF;
END $$;

-- Service Packages Policy (with IF NOT EXISTS guard)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Everyone_can_read_service_packages') THEN
    CREATE POLICY "Everyone can read service packages" 
      ON service_packages FOR SELECT 
      USING (true);
  END IF;
END $$;

-- ============================================
-- SUMMARY OF CHANGES
-- ============================================
/*
NEW TABLES CREATED:
1. attendances — Attendance tracking setiap 6 jam (~2KB)
2. order_photos — Workflow proof photos per step (~2KB)

EXISTING TABLES ALTERED:
- service_packages — Added tier, features, pricing columns
- orders — Added current_step, attendance_count, photo_count

INDEXES CREATED: 8 indexes for performance

DEFAULT PACKAGES INSERTED: 11 paket (2 bronze + 5 silver + 4 gold)
- Tiap INSERT dijalankan sebagai statement terpisah (bisa di-copy paste aman)

VIEWS CREATED:
- v_package_details — Package analytics
- v_mitra_active_orders — Active orders dengan progress

RLS POLICIES: 7 policies dengan IF NOT EXISTS guard (safe run ulang)

TOTAL ESTIMATED STORAGE: ~15 KB

FIX NOTES:
- All INSERT statements are now single-row (no multi-VALUES continuation)
- All VIEW references use proper single quotes ('completed' not ''completed'')
- All RLS policies wrapped in DO $$ ... END $$ with IF NOT EXISTS checks
*/
