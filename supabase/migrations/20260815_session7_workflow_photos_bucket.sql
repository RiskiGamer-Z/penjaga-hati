-- ============================================
-- PENJAGA HATI — Session 7 Migration
-- Storage Bucket untuk Foto Bukti Workflow (order_photos)
-- Created: August 15, 2026
-- Idempotent: aman dijalankan berulang kali
-- ============================================

-- ============================================
-- STORAGE BUCKET: order_photos
-- Foto bukti mitra di setiap step (tiba, mulai, selesai) + foto absensi
-- Public agar admin/owner/user bisa lihat progress
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('order_photos', 'order_photos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES (idempotent via DO block)
-- Struktur path: {mitra_user_id}/{order_id}-{step}-{timestamp}.ext
-- ============================================

-- Semua orang bisa lihat (bucket public — untuk tampil di dashboard user/admin)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public_can_view_order_photos') THEN
    CREATE POLICY "Public_can_view_order_photos" ON storage.objects
      FOR SELECT
      USING (bucket_id = 'order_photos');
  END IF;
END $$;

-- Mitra terautentikasi bisa upload ke foldernya sendiri
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Mitra_can_upload_order_photos') THEN
    CREATE POLICY "Mitra_can_upload_order_photos" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'order_photos'
        AND (auth.uid())::text = (string_to_array(name, '/'))[1]
      );
  END IF;
END $$;

-- ============================================
-- CATATAN
-- ============================================
-- Upload sebenarnya dilakukan via server action (createAdminClient)
-- yang bypass RLS, jadi policy di atas hanya sebagai lapisan tambahan.
-- Tabel `order_photos` dan `attendances` sudah dibuat di session5.
-- ============================================
