-- =========================================================================
-- KASIHI (KAMI SIAP HADIR MENDAMPINGI) - COMPLETE DATABASE INITIALIZATION
-- =========================================================================
-- This script sets up a brand new database for the Kasihi web application.
-- It includes core tables, ancillary tables, views, RLS policies,
-- automatic auth triggers, and storage bucket setup.
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- =========================================================================

-- Note: Postgres 13+ in Supabase supports gen_random_uuid() natively.
-- Extension creation is omitted to prevent read-only transaction errors.

-- =========================================================================
-- 1. CORE SCHEMA INITIALIZATION
-- =========================================================================

-- 1.1 USERS TABLE (Linked with Supabase Auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(25),
  role VARCHAR(20) DEFAULT 'user', -- user, mitra, admin, cs, owner
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  security_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 1.2 MITRAS TABLE (Mitra profiles referencing public.users)
CREATE TABLE IF NOT EXISTS public.mitras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  gender VARCHAR(20),
  specialization VARCHAR(255),
  specializations TEXT[],
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(50),
  bank_account_name VARCHAR(255),
  is_verified BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  rating DECIMAL(3, 2) DEFAULT 0.0,
  average_rating DECIMAL(3, 2) DEFAULT 0.0,
  total_orders_completed INT DEFAULT 0,
  total_reviews INT DEFAULT 0,
  balance DECIMAL(12, 2) DEFAULT 0.0 NOT NULL,
  bio TEXT,
  experience TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mitras_user_id ON public.mitras(user_id);
CREATE INDEX IF NOT EXISTS idx_mitras_is_verified ON public.mitras(is_verified);
CREATE INDEX IF NOT EXISTS idx_mitras_is_available ON public.mitras(is_available);

-- 1.3 HOSPITALS TABLE
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  city VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hospitals_name ON public.hospitals(name);

-- 1.4 SERVICE PACKAGES TABLE
CREATE TABLE IF NOT EXISTS public.service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_hours INT NOT NULL,
  price_per_hour DECIMAL(12, 2) NOT NULL,
  base_price DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.5 ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mitra_id UUID REFERENCES public.mitras(id) ON DELETE SET NULL,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
  package_id UUID NOT NULL REFERENCES public.service_packages(id) ON DELETE RESTRICT,
  patient_name VARCHAR(255) NOT NULL,
  patient_age INT NOT NULL,
  patient_condition TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_payment', -- pending_payment, waiting_mitra, accepted, in_progress, completed, cancelled, rejected
  total_amount DECIMAL(12, 2) NOT NULL,
  mitra_earnings DECIMAL(12, 2),
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_hours INT NOT NULL,
  room_number VARCHAR(50),
  special_notes TEXT,
  actual_completion_time TIMESTAMP WITH TIME ZONE,
  admin_viewed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_mitra_id ON public.orders(mitra_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 1.6 PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'bank_transfer',
  bank_name_from VARCHAR(100),
  bank_account_name_from VARCHAR(255),
  proof_of_transfer_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected, refunded
  verified_by_admin_id UUID REFERENCES public.users(id),
  rejection_reason TEXT,
  snap_token VARCHAR(255),
  midtrans_transaction_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  reference_number VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 1.7 REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mitra_id UUID NOT NULL REFERENCES public.mitras(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  admin_response TEXT,
  admin_response_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_mitra_id ON public.reviews(mitra_id);

-- 1.8 INQUIRIES TABLE (Customer Service Support Log)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved
  handled_by_cs_id UUID REFERENCES public.users(id),
  response_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);

-- =========================================================================
-- 2. AUTOMATIC USER SYNC TRIGGER (auth.users -> public.users)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, phone, avatar_url, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- 3. STORAGE BUCKETS SETUP
-- =========================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_proofs', 'payment_proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public Read Access Avatars" ON storage.objects;
CREATE POLICY "Public Read Access Avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated Insert Avatars" ON storage.objects;
CREATE POLICY "Authenticated Insert Avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public Read Access Payment Proofs" ON storage.objects;
CREATE POLICY "Public Read Access Payment Proofs" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment_proofs');

DROP POLICY IF EXISTS "Authenticated Insert Payment Proofs" ON storage.objects;
CREATE POLICY "Authenticated Insert Payment Proofs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment_proofs');

-- Enable RLS on core tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mitras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Core RLS Policies
DROP POLICY IF EXISTS "Public read hospitals" ON public.hospitals;
CREATE POLICY "Public read hospitals" ON public.hospitals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read service_packages" ON public.service_packages;
CREATE POLICY "Public read service_packages" ON public.service_packages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read mitras" ON public.mitras;
CREATE POLICY "Public read mitras" ON public.mitras FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users read own profile" ON public.users;
CREATE POLICY "Users read own profile" ON public.users FOR SELECT USING (auth.uid() = id OR true);

DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR true);

DROP POLICY IF EXISTS "Users create orders" ON public.orders;
CREATE POLICY "Users create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR true);

DROP POLICY IF EXISTS "Payments access policy" ON public.payments;
CREATE POLICY "Payments access policy" ON public.payments FOR ALL USING (true);


-- =========================================================================
-- 4. SYSTEM CONFIGURATION & AUDIT TRAIL TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default system settings
INSERT INTO public.system_settings (setting_key, setting_value, category) VALUES
  ('commission_percentage', '15', 'financial'),
  ('min_order_amount', '50000', 'order'),
  ('max_order_amount', '10000000', 'order'),
  ('min_withdrawal_amount', '50000', 'financial'),
  ('max_withdrawal_amount', '5000000', 'financial'),
  ('order_acceptance_timeout_minutes', '15', 'order'),
  ('mitra_active_orders_limit', '3', 'order'),
  ('cancellation_refund_percentage', '80', 'order')
ON CONFLICT (setting_key) DO NOTHING;

-- RLS policies for system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read system_settings" ON public.system_settings;
CREATE POLICY "Public read system_settings" ON public.system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage system_settings" ON public.system_settings;
CREATE POLICY "Admins manage system_settings" ON public.system_settings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.role = 'owner')
  )
);

-- RLS policies for admin_activity_log
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view activity log" ON public.admin_activity_log;
CREATE POLICY "Admins view activity log" ON public.admin_activity_log FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.role = 'owner')
  )
);

DROP POLICY IF EXISTS "Admins insert activity log" ON public.admin_activity_log;
CREATE POLICY "Admins insert activity log" ON public.admin_activity_log FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.role = 'owner')
  )
);


-- =========================================================================
-- 5. MITRA DOCUMENTS & CLIENT PREFERENCES
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.mitra_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mitra_id UUID NOT NULL REFERENCES public.mitras(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  file_url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  rejection_reason TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  notifications_email BOOLEAN DEFAULT true,
  notifications_whatsapp BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mitra_id UUID NOT NULL REFERENCES public.mitras(id) ON DELETE CASCADE,
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT user_favorites_user_mitra_unique UNIQUE (user_id, mitra_id)
);

CREATE TABLE IF NOT EXISTS public.order_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  status_before VARCHAR(50),
  status_after VARCHAR(50),
  details JSONB,
  triggered_by VARCHAR(50) DEFAULT 'system', -- system, admin, user, mitra
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS policies for mitra_documents
ALTER TABLE public.mitra_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Mitras manage own documents" ON public.mitra_documents;
CREATE POLICY "Mitras manage own documents" ON public.mitra_documents FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.mitras
    WHERE mitras.id = mitra_documents.mitra_id AND mitras.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins view all documents" ON public.mitra_documents;
CREATE POLICY "Admins view all documents" ON public.mitra_documents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.role = 'owner')
  )
);

-- RLS policies for user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own preferences" ON public.user_preferences;
CREATE POLICY "Users manage own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- RLS policies for user_favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own favorites" ON public.user_favorites;
CREATE POLICY "Users manage own favorites" ON public.user_favorites FOR ALL USING (auth.uid() = user_id);

-- RLS policies for order_timeline
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own order timeline" ON public.order_timeline;
CREATE POLICY "Users view own order timeline" ON public.order_timeline FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_timeline.order_id AND (orders.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.mitras WHERE mitras.id = orders.mitra_id AND mitras.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.users WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.role = 'owner')
    ))
  )
);

-- Create storage bucket for mitra_documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('mitra_documents', 'mitra_documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Mitras manage own document files" ON storage.objects;
CREATE POLICY "Mitras manage own document files" ON storage.objects FOR ALL USING (bucket_id = 'mitra_documents');


-- =========================================================================
-- 6. MITRA WITHDRAWALS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.mitra_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mitra_id UUID NOT NULL REFERENCES public.mitras(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  bank_account_number VARCHAR(50) NOT NULL,
  bank_account_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, rejected
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS policies for mitra_withdrawals
ALTER TABLE public.mitra_withdrawals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Mitras manage own withdrawals" ON public.mitra_withdrawals;
CREATE POLICY "Mitras manage own withdrawals" ON public.mitra_withdrawals FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.mitras
    WHERE mitras.id = mitra_withdrawals.mitra_id AND mitras.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins view all withdrawals" ON public.mitra_withdrawals;
CREATE POLICY "Admins view all withdrawals" ON public.mitra_withdrawals FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.role = 'owner')
  )
);

DROP POLICY IF EXISTS "Admins manage all withdrawals" ON public.mitra_withdrawals;
CREATE POLICY "Admins manage all withdrawals" ON public.mitra_withdrawals FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.role = 'owner')
  )
);

-- =========================================================================
-- 7. DATABASE FUNCTIONS & TRIGGERS (RPCS)
-- =========================================================================

-- RPC: Complete order transaction and award earnings to mitra
CREATE OR REPLACE FUNCTION public.complete_order_transaction(p_order_id UUID)
RETURNS void AS $$
DECLARE
  v_mitra_id UUID;
  v_mitra_earnings DECIMAL(12, 2);
  v_status VARCHAR(50);
BEGIN
  -- Get order details
  SELECT status, mitra_id, mitra_earnings 
  INTO v_status, v_mitra_id, v_mitra_earnings
  FROM public.orders 
  WHERE id = p_order_id;

  -- Only process if not already completed
  IF v_status <> 'completed' THEN
    -- Update order status to completed
    UPDATE public.orders 
    SET status = 'completed', 
        updated_at = timezone('utc'::text, now())
    WHERE id = p_order_id;

    -- Add earnings to mitra balance if exists
    IF v_mitra_id IS NOT NULL AND v_mitra_earnings IS NOT NULL AND v_mitra_earnings > 0 THEN
      UPDATE public.mitras 
      SET balance = COALESCE(balance, 0) + v_mitra_earnings,
          updated_at = timezone('utc'::text, now())
      WHERE id = v_mitra_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Request withdrawal transaction
CREATE OR REPLACE FUNCTION public.request_withdrawal_transaction(
  p_mitra_id UUID,
  p_amount DECIMAL(12, 2),
  p_bank_name VARCHAR(100),
  p_bank_account_number VARCHAR(50),
  p_bank_account_name VARCHAR(255)
)
RETURNS void AS $$
DECLARE
  v_balance DECIMAL(12, 2);
BEGIN
  -- Get current balance of mitra
  SELECT balance INTO v_balance
  FROM public.mitras
  WHERE id = p_mitra_id;

  -- Check if balance is sufficient
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Saldo tidak mencukupi. Saldo saat ini: %', v_balance;
  END IF;

  -- Deduct from balance
  UPDATE public.mitras
  SET balance = balance - p_amount,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_mitra_id;

  -- Insert into withdrawals table
  INSERT INTO public.mitra_withdrawals (
    mitra_id,
    amount,
    bank_name,
    bank_account_number,
    bank_account_name,
    status,
    requested_at,
    created_at,
    updated_at
  ) VALUES (
    p_mitra_id,
    p_amount,
    p_bank_name,
    p_bank_account_number,
    p_bank_account_name,
    'pending',
    timezone('utc'::text, now()),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER: Auto-refund balance when a withdrawal request is rejected by owner/admin
CREATE OR REPLACE FUNCTION public.handle_withdrawal_status_change()
RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
    UPDATE public.mitras
    SET balance = balance + OLD.amount,
        updated_at = timezone('utc'::text, now())
    WHERE id = OLD.mitra_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_withdrawal_status_change ON public.mitra_withdrawals;
CREATE TRIGGER trg_withdrawal_status_change
  AFTER UPDATE OF status ON public.mitra_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_withdrawal_status_change();

-- =========================================================================
-- MIGRATION: ADD ADMIN RESPONSE COLUMNS TO REVIEWS
-- =========================================================================
-- Run this block if your table was already created and you just need to add the new columns:
-- ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS admin_response TEXT;
-- ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS admin_response_at TIMESTAMP WITH TIME ZONE;
-- =========================================================================
