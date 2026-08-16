'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Get mitra earnings summary
 * Includes balance, total earnings, pending payments, etc
 */
export async function getMitraEarningsAction(mitraId: string, timeframe: 'month' | 'year' | 'all' = 'month') {
  try {
    const adminClient = createAdminClient()

    // Calculate date range based on timeframe
    const now = new Date()
    let startDate = new Date()

    if (timeframe === 'month') {
      startDate.setMonth(now.getMonth() - 1)
    } else if (timeframe === 'year') {
      startDate.setFullYear(now.getFullYear() - 1)
    } else {
      startDate = new Date('2000-01-01') // All time
    }

    // Fetch completed orders with payments for this mitra
    const { data: orders, error: ordersError } = await adminClient
      .from('orders')
      .select(`
        id,
        order_number,
        created_at,
        status,
        payments (
          id,
          amount,
          status
        )
      `)
      .eq('mitra_id', mitraId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    // Get balance from mitras table directly
    const { data: mitraData } = await adminClient
      .from('mitras')
      .select('balance')
      .eq('id', mitraId)
      .single()

    // Calculate statistics
    const stats = {
      total_completed_orders: orders?.filter(o => o.status === 'completed').length || 0,
      total_in_progress: orders?.filter(o => o.status === 'in_progress').length || 0,
      total_accepted: orders?.filter(o => o.status === 'accepted').length || 0,
      total_earnings: 0,
      verified_earnings: 0,
      pending_earnings: 0,
      balance: mitraData?.balance || 0
    }

    // Calculate earnings from payments
    orders?.forEach(order => {
      const paymentData = order.payments
      const payment = paymentData ? (Array.isArray(paymentData) ? paymentData[0] : paymentData) : null
      if (payment) {
        const amount = Number(payment.amount) || 0
        stats.total_earnings += amount
        if (payment.status === 'verified') {
          stats.verified_earnings += amount
        } else if (payment.status === 'pending') {
          stats.pending_earnings += amount
        }
      }
    })

    return { success: true, data: stats }
  } catch (err: any) {
    console.error('Get Mitra Earnings Error:', err)
    return { success: false, data: null, error: err.message }
  }
}

/**
 * Get detailed earnings breakdown
 * Shows earnings per order with dates and amounts
 */
export async function getMitraEarningsDetailAction(
  mitraId: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    const adminClient = createAdminClient()

    const { data: orders, error, count } = await adminClient
      .from('orders')
      .select(
        `
        id,
        order_number,
        patient_name,
        status,
        created_at,
        hospitals:hospital_id (name),
        service_packages:package_id (name, base_price),
        payments (
          id,
          amount,
          status,
          created_at,
          verified_at
        )
      `,
        { count: 'exact' }
      )
      .eq('mitra_id', mitraId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      success: true,
      data: {
        orders: orders || [],
        total: count || 0,
        limit,
        offset
      }
    }
  } catch (err: any) {
    console.error('Get Mitra Earnings Detail Error:', err)
    return { success: false, data: null, error: err.message }
  }
}

/**
 * Get withdrawal history
 * Shows all past withdrawal requests and their status
 */
export async function getWithdrawalHistoryAction(
  mitraId: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    const adminClient = createAdminClient()

    const { data: withdrawals, error, count } = await adminClient
      .from('mitra_withdrawals')
      .select('*', { count: 'exact' })
      .eq('mitra_id', mitraId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet, return empty
        return {
          success: true,
          data: {
            withdrawals: [],
            total: 0,
            limit,
            offset,
            message: 'Fitur penarikan dana sedang dipersiapkan'
          }
        }
      }
      throw error
    }

    return {
      success: true,
      data: {
        withdrawals: withdrawals || [],
        total: count || 0,
        limit,
        offset
      }
    }
  } catch (err: any) {
    console.error('Get Withdrawal History Error:', err)
    return { success: false, data: null, error: err.message }
  }
}

/**
 * Request a withdrawal
 * Creates a new withdrawal record with pending status
 * Admin must approve before funds are transferred
 */
export async function requestWithdrawalAction(
  mitraId: string,
  data: {
    amount: number
    bank_name: string
    bank_account_number: string
    bank_account_name: string
  }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    // Validate amount
    if (!data.amount || data.amount <= 0) {
      return { success: false, error: 'Jumlah penarikan tidak valid.' }
    }

    if (data.amount > 50000000) {
      return { success: false, error: 'Jumlah penarikan melebihi batas maksimal.' }
    }

    // Validate bank details
    if (!data.bank_name || !data.bank_account_number || !data.bank_account_name) {
      return { success: false, error: 'Data rekening bank tidak lengkap.' }
    }

    // Verify mitra ownership
    const adminClient = createAdminClient()
    const { data: mitra, error: mitraError } = await adminClient
      .from('mitras')
      .select('id, user_id')
      .eq('id', mitraId)
      .single()

    if (mitraError || !mitra) {
      return { success: false, error: 'Profil mitra tidak ditemukan.' }
    }

    if (mitra.user_id !== user.id) {
      return { success: false, error: 'Anda tidak berhak mengakses profil ini.' }
    }

    // Cek saldo dengan membaca tabel mitras
    const { data: mitraData } = await adminClient
      .from('mitras')
      .select('balance')
      .eq('id', mitraId)
      .single()

    const availableBalance = mitraData?.balance || 0

    if (data.amount > availableBalance) {
      return {
        success: false,
        error: `Saldo tidak cukup. Saldo tersedia: Rp ${availableBalance.toLocaleString('id-ID')}`
      }
    }

    // Call RPC request_withdrawal_transaction
    const { data: result, error: rpcError } = await adminClient.rpc('request_withdrawal_transaction', {
      p_mitra_id: mitraId,
      p_amount: data.amount,
      p_bank_name: data.bank_name,
      p_bank_account_number: data.bank_account_number,
      p_bank_account_name: data.bank_account_name
    });

    if (rpcError) {
      if (rpcError.code === '42883') { // function does not exist
        return {
          success: false,
          error: 'Fitur penarikan sedang dalam pengembangan (Prosedur tidak ditemukan). Silakan hubungi admin.'
        }
      }
      throw rpcError
    }

    revalidatePath('/mitra/pendapatan')

    return { success: true, data: { amount: data.amount, status: 'pending' } }
  } catch (err: any) {
    console.error('Request Withdrawal Error:', err)
    return { success: false, error: err.message || 'Gagal membuat permintaan penarikan.' }
  }
}

/**
 * Get available balance for withdrawal
 * Only counts verified payments from completed orders
 */
export async function getAvailableBalanceAction(mitraId: string) {
  try {
    const adminClient = createAdminClient()

    // Get balance from mitras table
    const { data: mitraData, error } = await adminClient
      .from('mitras')
      .select('balance')
      .eq('id', mitraId)
      .single()

    if (error) throw error

    const balance = mitraData?.balance || 0

    return { success: true, data: { available_balance: balance } }
  } catch (err: any) {
    console.error('Get Available Balance Error:', err)
    return { success: false, data: null, error: err.message }
  }
}

/**
 * Get balance summary
 * Shows available, pending, and total earned
 */
export async function getBalanceSummaryAction(mitraId: string) {
  try {
    const adminClient = createAdminClient()

    // Get all orders for this mitra
    const { data: orders, error } = await adminClient
      .from('orders')
      .select('status, payments (status, amount)')
      .eq('mitra_id', mitraId)

    if (error) throw error

    // Get balance from mitras table
    const { data: mitraData } = await adminClient
      .from('mitras')
      .select('balance')
      .eq('id', mitraId)
      .single()

    const available = mitraData?.balance || 0
    let pending = 0
    let total = 0

    orders?.forEach(order => {
      const paymentData = order.payments
      const payment = paymentData ? (Array.isArray(paymentData) ? paymentData[0] : paymentData) : null
      if (payment) {
        const amount = Number(payment.amount) || 0
        total += amount
        if (order.status === 'completed' && payment.status === 'pending') {
          pending += amount
        }
      }
    })

    return {
      success: true,
      data: {
        available_balance: available,
        pending_balance: pending,
        total_earned: total
      }
    }
  } catch (err: any) {
    console.error('Get Balance Summary Error:', err)
    return { success: false, data: null, error: err.message }
  }
}
