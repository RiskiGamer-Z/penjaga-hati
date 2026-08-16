-- ============================================
-- PENJAGA HATI — Session 6 Database Migration
-- Add admin_response columns to reviews table
-- Created: August 15, 2026
-- ============================================

-- ============================================
-- GROUP A: REVIEWS ENHANCEMENT
-- Add admin response columns
-- ============================================
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS admin_response TEXT,
  ADD COLUMN IF NOT EXISTS admin_response_at TIMESTAMPTZ;

-- RLS Policy: Only admins/owners can update review responses
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins and owners can update review responses') THEN
    CREATE POLICY "Admins and owners can update review responses" ON reviews
      FOR UPDATE USING (
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'owner')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users and mitras can view their own reviews') THEN
    CREATE POLICY "Users and mitras can view their own reviews" ON reviews
      FOR SELECT USING (
        mitra_id IN (SELECT id FROM mitras WHERE user_id = auth.uid())
        OR order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- ============================================
-- SUMMARY
-- ============================================
/*
CHANGES:
- reviews table: Added admin_response (TEXT) and admin_response_at (TIMESTAMPTZ)
- RLS policies: Admins/owners can update responses, users/mitras can view

FILE: 20260815_session6_add_reviews_columns.sql
*/
