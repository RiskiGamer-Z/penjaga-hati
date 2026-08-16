-- Buat Storage Bucket untuk dokumen mitra (hanya dilakukan jika belum ada)
-- Note: Vercel / SQL tidak bisa otomatis membuat storage bucket jika RLS ketat, tapi kita asumsikan lewat SQL insert ke storage.buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mitra_documents', 'mitra_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Set policy agar hanya admin dan pemilik dokumen yang bisa akses
CREATE POLICY "Mitra can upload their own documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'mitra_documents' AND (auth.uid())::text = (string_to_array(name, '/'))[1]);

CREATE POLICY "Mitra can view their own documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'mitra_documents' AND (auth.uid())::text = (string_to_array(name, '/'))[1]);

CREATE POLICY "Admin can view all documents" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'mitra_documents' AND 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Buat tabel mitra_documents
CREATE TABLE IF NOT EXISTS public.mitra_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mitra_id UUID NOT NULL REFERENCES public.mitras(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- ktp, sertifikat, skck, dll
    file_url TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, verified, rejected
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.users(id),
    rejection_reason TEXT,
    UNIQUE(mitra_id, document_type) -- Hanya 1 dokumen per tipe per mitra
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_mitra_documents_mitra_id ON public.mitra_documents(mitra_id);
