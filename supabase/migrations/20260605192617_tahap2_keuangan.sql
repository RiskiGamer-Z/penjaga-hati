-- 1. Tambahkan kolom balance ke tabel mitras
ALTER TABLE public.mitras
ADD COLUMN IF NOT EXISTS balance NUMERIC(15,2) NOT NULL DEFAULT 0;

-- 2. Buat tabel mitra_withdrawals untuk mencatat penarikan dana
CREATE TABLE IF NOT EXISTS public.mitra_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mitra_id UUID NOT NULL REFERENCES public.mitras(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    bank_name VARCHAR(100) NOT NULL,
    bank_account_number VARCHAR(100) NOT NULL,
    bank_account_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES public.users(id),
    rejection_reason TEXT
);

-- Indexing untuk mempercepat query
CREATE INDEX IF NOT EXISTS idx_mitra_withdrawals_mitra_id ON public.mitra_withdrawals(mitra_id);
CREATE INDEX IF NOT EXISTS idx_mitra_withdrawals_status ON public.mitra_withdrawals(status);

-- 3. Stored Procedure untuk Selesaikan Pesanan & Tambah Saldo (Atomic)
CREATE OR REPLACE FUNCTION public.complete_order_transaction(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_payment_status VARCHAR;
BEGIN
    -- Kunci baris order untuk mencegah race condition (FOR UPDATE)
    SELECT id, mitra_id, status, mitra_earnings 
    INTO v_order
    FROM public.orders 
    WHERE id = p_order_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pesanan tidak ditemukan.';
    END IF;

    IF v_order.status = 'completed' THEN
        RAISE EXCEPTION 'Pesanan ini sudah diselesaikan.';
    END IF;

    IF v_order.mitra_id IS NULL THEN
        RAISE EXCEPTION 'Pesanan ini belum memiliki mitra pengampu.';
    END IF;

    -- Cek status pembayaran (pastikan verified)
    SELECT status INTO v_payment_status
    FROM public.payments
    WHERE order_id = p_order_id
    LIMIT 1;

    IF v_payment_status IS DISTINCT FROM 'verified' THEN
        RAISE EXCEPTION 'Pembayaran belum diverifikasi, tidak dapat diselesaikan.';
    END IF;

    -- Update status pesanan
    UPDATE public.orders
    SET 
        status = 'completed',
        actual_completion_time = NOW()
    WHERE id = p_order_id;

    -- Update saldo mitra secara atomik
    UPDATE public.mitras
    SET balance = balance + COALESCE(v_order.mitra_earnings, 0)
    WHERE id = v_order.mitra_id;

END;
$$;

-- 4. Stored Procedure untuk Penarikan Saldo (Atomic)
CREATE OR REPLACE FUNCTION public.request_withdrawal_transaction(
    p_mitra_id UUID,
    p_amount NUMERIC(15,2),
    p_bank_name VARCHAR,
    p_bank_account_number VARCHAR,
    p_bank_account_name VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance NUMERIC(15,2);
    v_withdrawal_id UUID;
BEGIN
    -- Kunci baris mitra untuk modifikasi saldo (FOR UPDATE)
    SELECT balance INTO v_current_balance
    FROM public.mitras
    WHERE id = p_mitra_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mitra tidak ditemukan.';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Jumlah penarikan harus lebih besar dari 0.';
    END IF;

    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Saldo tidak mencukupi.';
    END IF;

    -- Potong saldo
    UPDATE public.mitras
    SET balance = balance - p_amount
    WHERE id = p_mitra_id;

    -- Rekam penarikan
    INSERT INTO public.mitra_withdrawals (
        mitra_id, amount, bank_name, bank_account_number, bank_account_name, status
    ) VALUES (
        p_mitra_id, p_amount, p_bank_name, p_bank_account_number, p_bank_account_name, 'pending'
    ) RETURNING id INTO v_withdrawal_id;

    RETURN jsonb_build_object(
        'success', true,
        'withdrawal_id', v_withdrawal_id,
        'new_balance', v_current_balance - p_amount
    );
END;
$$;
