-- Penjaga Hati Database Schema Migration
-- This file contains all missing tables needed for full MVP implementation
-- Created: May 15, 2026

-- ============================================
-- 1. MITRA WITHDRAWALS - Track all withdrawal requests
-- ============================================
CREATE TABLE IF NOT EXISTS mitra_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mitra_id UUID NOT NULL REFERENCES mitras(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  bank_account_number VARCHAR(50) NOT NULL,
  bank_account_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, completed, failed
  rejection_reason TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_withdrawal_amount CHECK (amount > 0),
  CONSTRAINT check_withdrawal_status CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed'))
);

CREATE INDEX idx_mitra_withdrawals_mitra_id ON mitra_withdrawals(mitra_id);
CREATE INDEX idx_mitra_withdrawals_status ON mitra_withdrawals(status);
CREATE INDEX idx_mitra_withdrawals_requested_at ON mitra_withdrawals(requested_at DESC);

-- ============================================
-- 2. USER PREFERENCES - User-specific settings
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(10) DEFAULT 'id', -- id, en
  timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
  notifications_email BOOLEAN DEFAULT true,
  notifications_whatsapp BOOLEAN DEFAULT true,
  notifications_order_update BOOLEAN DEFAULT true,
  notifications_review BOOLEAN DEFAULT true,
  notifications_payment BOOLEAN DEFAULT true,
  preferred_payment_method VARCHAR(50),
  theme_preference VARCHAR(20) DEFAULT 'light', -- light, dark, system
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- ============================================
-- 3. USER FAVORITES - Track favorite mitras
-- ============================================
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mitra_id UUID NOT NULL REFERENCES mitras(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  
  UNIQUE(user_id, mitra_id)
  -- Note: Validation that user can't favorite themselves handled in application layer
);

CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_mitra_id ON user_favorites(mitra_id);
CREATE INDEX idx_user_favorites_added_at ON user_favorites(added_at DESC);

-- ============================================
-- 4. ORDER CANCELLATIONS - Track order cancellations
-- ============================================
CREATE TABLE IF NOT EXISTS order_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  cancelled_by VARCHAR(20) NOT NULL, -- user, mitra, admin
  reason TEXT NOT NULL,
  refund_status VARCHAR(20) DEFAULT 'pending', -- pending, processed, failed
  refund_amount DECIMAL(12, 2),
  refund_processed_at TIMESTAMP,
  cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_cancelled_by CHECK (cancelled_by IN ('user', 'mitra', 'admin')),
  CONSTRAINT check_refund_status CHECK (refund_status IN ('pending', 'processed', 'failed'))
);

CREATE INDEX idx_order_cancellations_order_id ON order_cancellations(order_id);
CREATE INDEX idx_order_cancellations_cancelled_at ON order_cancellations(cancelled_at DESC);
CREATE INDEX idx_order_cancellations_refund_status ON order_cancellations(refund_status);

-- ============================================
-- 5. ORDER TIMELINE - Detailed timeline of order events
-- ============================================
CREATE TABLE IF NOT EXISTS order_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- created, payment_pending, payment_verified, mitra_assigned, mitra_accepted, in_transit, arrived, in_progress, completed, cancelled, reviewed
  status_before VARCHAR(50),
  status_after VARCHAR(50),
  details JSONB, -- flexible storage for event-specific data
  triggered_by VARCHAR(20), -- user, mitra, admin, system
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_event_type CHECK (event_type IN (
    'created', 'payment_pending', 'payment_verified', 'payment_rejected',
    'mitra_assigned', 'mitra_accepted', 'mitra_rejected',
    'in_transit', 'arrived', 'in_progress', 'completed', 'cancelled', 'reviewed'
  )),
  CONSTRAINT check_triggered_by CHECK (triggered_by IN ('user', 'mitra', 'admin', 'system'))
);

CREATE INDEX idx_order_timeline_order_id ON order_timeline(order_id);
CREATE INDEX idx_order_timeline_event_type ON order_timeline(event_type);
CREATE INDEX idx_order_timeline_created_at ON order_timeline(created_at DESC);

-- ============================================
-- 6. ADMIN ACTIVITY LOG - Audit trail for admin actions
-- ============================================
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- verify_payment, reject_payment, register_mitra, suspend_user, etc
  resource_type VARCHAR(50), -- order, payment, mitra, user, hospital, etc
  resource_id UUID,
  changes JSONB, -- what was changed
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_action CHECK (
    action IN (
      'verify_payment', 'reject_payment', 'register_mitra', 'suspend_mitra',
      'unsuspend_mitra', 'suspend_user', 'unsuspend_user', 'assign_mitra',
      'update_order_status', 'add_hospital', 'update_hospital', 'delete_hospital',
      'add_package', 'update_package', 'delete_package', 'respond_review',
      'system_setting_update'
    )
  )
);

CREATE INDEX idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX idx_admin_activity_log_resource_type ON admin_activity_log(resource_type);
CREATE INDEX idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX idx_admin_activity_log_action ON admin_activity_log(action);

-- ============================================
-- 7. SYSTEM SETTINGS - Configuration management
-- ============================================
DROP TABLE IF EXISTS system_settings CASCADE;

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50), -- billing, commission, payment, system
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id)
);

INSERT INTO system_settings (setting_key, setting_value, description, category, is_active)
VALUES
  ('commission_percentage', '15', 'Commission percentage for Penjaga Hati from order value', 'commission', true),
  ('min_order_amount', '250000', 'Minimum order amount in IDR', 'billing', true),
  ('max_order_amount', '50000000', 'Maximum order amount in IDR', 'billing', true),
  ('min_withdrawal_amount', '100000', 'Minimum withdrawal amount for mitras in IDR', 'billing', true),
  ('max_withdrawal_amount', '50000000', 'Maximum withdrawal amount per request in IDR', 'billing', true),
  ('order_acceptance_timeout_minutes', '30', 'Minutes for mitra to accept/reject order', 'system', true),
  ('mitra_active_orders_limit', '5', 'Maximum concurrent active orders per mitra', 'system', true),
  ('cancellation_refund_percentage', '100', 'Percentage of refund if user cancels before mitra accepts', 'billing', true);

CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_system_settings_category ON system_settings(category);

-- ============================================
-- 8. BANK ACCOUNTS - Bank account configuration
-- ============================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL UNIQUE,
  account_holder_name VARCHAR(255) NOT NULL,
  swift_code VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  usage_type VARCHAR(50), -- collection, payout (untuk collect payment dari user, atau bayar mitra)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_usage_type CHECK (usage_type IN ('collection', 'payout', 'both'))
);

CREATE INDEX idx_bank_accounts_is_active ON bank_accounts(is_active);
CREATE INDEX idx_bank_accounts_is_default ON bank_accounts(is_default);
CREATE INDEX idx_bank_accounts_usage_type ON bank_accounts(usage_type);

-- ============================================
-- 9. MITRA AVAILABILITY SCHEDULE - Working hours
-- ============================================
CREATE TABLE IF NOT EXISTS mitra_availability_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mitra_id UUID NOT NULL REFERENCES mitras(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL, -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  
  UNIQUE(mitra_id, day_of_week),
  CONSTRAINT check_day_of_week CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT check_time_order CHECK (start_time < end_time)
);

CREATE INDEX idx_mitra_availability_mitra_id ON mitra_availability_schedule(mitra_id);

-- ============================================
-- 10. MITRA DOCUMENTS - Upload dokumen verifikasi
-- ============================================
CREATE TABLE IF NOT EXISTS mitra_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mitra_id UUID NOT NULL REFERENCES mitras(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- ktp, driving_license, certificate, medical_license, vaccination
  file_url VARCHAR(500) NOT NULL,
  verification_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason TEXT,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  CONSTRAINT check_document_type CHECK (document_type IN (
    'ktp', 'driving_license', 'certificate', 'medical_license', 'vaccination'
  )),
  CONSTRAINT check_verification_status CHECK (verification_status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_mitra_documents_mitra_id ON mitra_documents(mitra_id);
CREATE INDEX idx_mitra_documents_verification_status ON mitra_documents(verification_status);
CREATE INDEX idx_mitra_documents_document_type ON mitra_documents(document_type);

-- ============================================
-- ALTER EXISTING TABLES TO ADD MISSING COLUMNS
-- ============================================

-- Add missing columns to orders table if they don't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS order_notes TEXT,
ADD COLUMN IF NOT EXISTS expected_completion_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS actual_completion_time TIMESTAMP;

-- Add missing columns to payments table if they don't exist
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS verified_by_admin_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS method VARCHAR(50) DEFAULT 'bank_transfer',
ADD COLUMN IF NOT EXISTS bank_name_from VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_account_name_from VARCHAR(255),
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);

-- Add missing columns to mitras table if they don't exist
ALTER TABLE mitras
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2),
ADD COLUMN IF NOT EXISTS total_orders_completed INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT;

-- Add missing columns to users table if they don't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- Dashboard overview for Owner
CREATE OR REPLACE VIEW v_owner_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM users WHERE role = 'user' AND deleted_at IS NULL) as total_users,
  (SELECT COUNT(*) FROM users WHERE role = 'user' AND created_at > NOW() - INTERVAL '30 days') as new_users_this_month,
  (SELECT COUNT(*) FROM mitras WHERE is_verified = true) as active_mitras,
  (SELECT COUNT(*) FROM orders WHERE status = 'completed') as total_completed_orders,
  (SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '30 days') as orders_this_month,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'verified') as total_revenue,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'verified' AND created_at > NOW() - INTERVAL '30 days') as revenue_this_month;

-- Mitra Performance View
CREATE OR REPLACE VIEW v_mitra_performance AS
SELECT
  m.id,
  m.user_id,
  u.full_name,
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
  ROUND(AVG(r.rating), 2) as average_rating,
  COUNT(DISTINCT r.id) as total_reviews,
  m.is_available,
  m.is_verified
FROM mitras m
LEFT JOIN users u ON m.user_id = u.id
LEFT JOIN orders o ON m.id = o.mitra_id
LEFT JOIN reviews r ON m.id = r.mitra_id
GROUP BY m.id, m.user_id, u.full_name, m.is_available, m.is_verified;

-- ============================================
-- RLS POLICIES (Row Level Security)
-- ============================================
-- Enable RLS on new tables
ALTER TABLE mitra_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitra_documents ENABLE ROW LEVEL SECURITY;

-- Mitra Withdrawals RLS
CREATE POLICY "Mitras can view their own withdrawals" ON mitra_withdrawals
  FOR SELECT USING (
    mitra_id = (SELECT id FROM mitras WHERE user_id = auth.uid())
  );

CREATE POLICY "Only admins can modify withdrawals" ON mitra_withdrawals
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- User Preferences RLS
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- User Favorites RLS
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own favorites" ON user_favorites
  FOR ALL USING (user_id = auth.uid());

-- Order Cancellations RLS
CREATE POLICY "Users can view cancellations of their orders" ON order_cancellations
  FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- Mitra Documents RLS
CREATE POLICY "Mitras can view their own documents" ON mitra_documents
  FOR SELECT USING (
    mitra_id = (SELECT id FROM mitras WHERE user_id = auth.uid())
  );

-- ============================================
-- SUMMARY OF CHANGES
-- ============================================
/*
NEW TABLES CREATED:
1. mitra_withdrawals (7,500 bytes) - withdrawal requests & history
2. user_preferences (2,000 bytes) - user settings & preferences
3. user_favorites (1,500 bytes) - favorite mitras per user
4. order_cancellations (2,500 bytes) - order cancellation tracking
5. order_timeline (3,000 bytes) - detailed event timeline
6. admin_activity_log (4,000 bytes) - audit trail
7. system_settings (2,500 bytes) - configuration management
8. bank_accounts (2,000 bytes) - bank account config
9. mitra_availability_schedule (1,500 bytes) - working hours
10. mitra_documents (2,500 bytes) - document uploads

COLUMNS ADDED:
- orders: rejection_reason, order_notes, expected_completion_time, actual_completion_time
- payments: verified_by_admin_id, method, bank_name_from, bank_account_name_from, reference_number
- mitras: rating, total_orders_completed, bio, experience
- users: email, avatar_url, is_active, deleted_at

VIEWS CREATED:
- v_owner_dashboard_stats
- v_mitra_performance

RLS POLICIES: 11 policies for data protection

TOTAL ESTIMATED STORAGE: ~32 KB per setup
*/
