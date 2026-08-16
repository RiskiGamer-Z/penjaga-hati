'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Get all orders for current user with pagination
 */
export async function getUserOrdersAction(
  limit: number = 10,
  offset: number = 0,
  statusFilter?: string
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, data: null, error: 'Silakan login kembali.' }
    }

    const adminClient = createAdminClient()

    let query = adminClient
      .from('orders')
      .select(
        `
        id,
        order_number,
        patient_name,
        patient_age,
        status,
        created_at,
        hospitals:hospital_id (id, name),
        service_packages:package_id (id, name, duration_hours),
        mitras:mitra_id (id, users:user_id (full_name, phone)),
        payments (id, status, amount)
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply status filter if provided
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: orders, error, count } = await query.range(offset, offset + limit - 1)

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
    console.error('Get User Orders Error:', err)
    return { success: false, data: null, error: err.message }
  }
}

/**
 * Get detailed information about a single order
 */
export async function getOrderDetailAction(orderId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, data: null, error: 'Silakan login kembali.' }
    }

    const adminClient = createAdminClient()

    // Fetch order with full details
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select(`
        id,
        order_number,
        patient_name,
        patient_age,
        patient_condition,
        status,
        created_at,
        hospitals:hospital_id (id, name, address, city),
        service_packages:package_id (id, name, description, duration_hours, base_price),
        mitras:mitra_id (
          id,
          average_rating,
          users:user_id (id, full_name, phone)
        ),
        payments (
          id,
          status,
          amount,
          proof_of_transfer_url,
          created_at,
          verified_at
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return { success: false, data: null, error: 'Pesanan tidak ditemukan.' }
    }

    // Fetch timeline
    const { data: timeline } = await adminClient
      .from('order_timeline')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    return {
      success: true,
      data: {
        ...order,
        timeline: timeline || []
      }
    }
  } catch (err: any) {
    console.error('Get Order Detail Error:', err)
    return { success: false, data: null, error: err.message }
  }
}

/**
 * Cancel an order before mitra accepts
 * User can only cancel if order status is 'pending_payment', 'waiting_mitra', or 'accepted'
 */
export async function cancelOrderAction(orderId: string, reason: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    if (!reason || reason.trim().length === 0) {
      return { success: false, error: 'Alasan pembatalan tidak boleh kosong.' }
    }

    const adminClient = createAdminClient()

    // Get order to verify ownership and status
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, user_id, status, payments (amount, status)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { success: false, error: 'Pesanan tidak ditemukan.' }
    }

    if (order.user_id !== user.id) {
      return { success: false, error: 'Anda tidak berhak membatalkan pesanan ini.' }
    }

    // Check if cancellation is allowed for this status
    const cancellableStatuses = ['pending_payment', 'waiting_mitra', 'accepted']
    if (!cancellableStatuses.includes(order.status)) {
      return {
        success: false,
        error: `Pesanan dengan status '${order.status}' tidak dapat dibatalkan.`
      }
    }

    // Calculate refund amount
    const paymentData = order.payments
    const payment = paymentData ? (Array.isArray(paymentData) ? paymentData[0] : paymentData) : null
    let refundAmount = 0
    if (payment && payment.status === 'verified') {
      // Get refund percentage from settings
      const { data: settings } = await adminClient
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'cancellation_refund_percentage')
        .single()

      const refundPercentage = settings?.setting_value ? parseInt(settings.setting_value) : 100
      refundAmount = (Number(payment.amount) * refundPercentage) / 100
    }

    // Create cancellation record
    const { error: cancelError } = await adminClient
      .from('order_cancellations')
      .insert({
        order_id: orderId,
        cancelled_by: 'user',
        reason: reason.trim(),
        refund_status: refundAmount > 0 ? 'pending' : 'processed',
        refund_amount: refundAmount
      })

    if (cancelError) throw cancelError

    // Update order status
    const { error: updateError } = await adminClient
      .from('orders')
      .update({
        status: 'cancelled'
      })
      .eq('id', orderId)

    if (updateError) throw updateError

    // Add timeline entry
    await adminClient.from('order_timeline').insert({
      order_id: orderId,
      event_type: 'cancelled',
      status_before: order.status,
      status_after: 'cancelled',
      details: { cancellation_reason: reason },
      triggered_by: 'user',
      created_by: user.id
    })

    revalidatePath('/user/dashboard')
    revalidatePath(`/user/orders/${orderId}`)

    return {
      success: true,
      data: {
        refund_amount: refundAmount,
        message: refundAmount > 0
          ? `Pesanan dibatalkan. Refund Rp ${refundAmount.toLocaleString('id-ID')} akan diproses dalam 3-5 hari kerja.`
          : 'Pesanan dibatalkan.'
      }
    }
  } catch (err: any) {
    console.error('Cancel Order Error:', err)
    return { success: false, error: err.message || 'Gagal membatalkan pesanan.' }
  }
}

/**
 * Request refund for completed order
 */
export async function requestRefundAction(orderId: string, reason: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    if (!reason || reason.trim().length === 0) {
      return { success: false, error: 'Alasan refund tidak boleh kosong.' }
    }

    const adminClient = createAdminClient()

    // Get order to verify ownership and status
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, user_id, status, payments (amount, status)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { success: false, error: 'Pesanan tidak ditemukan.' }
    }

    if (order.user_id !== user.id) {
      return { success: false, error: 'Anda tidak berhak mengajukan refund untuk pesanan ini.' }
    }

    // Only allow refund for completed orders
    if (order.status !== 'completed') {
      return {
        success: false,
        error: `Refund hanya dapat diajukan untuk pesanan yang sudah selesai.`
      }
    }

    // Check if already refunded
    const { data: existingCancellation } = await adminClient
      .from('order_cancellations')
      .select('id')
      .eq('order_id', orderId)
      .single()

    if (existingCancellation) {
      return {
        success: false,
        error: 'Refund untuk pesanan ini sudah diajukan sebelumnya.'
      }
    }

    // Get refund amount (should be full for post-completion refunds, but limited by policy)
    const paymentData = order.payments
    const payment = paymentData ? (Array.isArray(paymentData) ? paymentData[0] : paymentData) : null
    const refundAmount = Number(payment?.amount) || 0

    // Create refund request record
    const { error: refundError } = await adminClient
      .from('order_cancellations')
      .insert({
        order_id: orderId,
        cancelled_by: 'user',
        reason: reason.trim(),
        refund_status: 'pending',
        refund_amount: refundAmount
      })

    if (refundError) throw refundError

    // Add timeline entry
    await adminClient.from('order_timeline').insert({
      order_id: orderId,
      event_type: 'cancelled',
      status_before: 'completed',
      status_after: 'refund_requested',
      details: { refund_reason: reason },
      triggered_by: 'user',
      created_by: user.id
    })

    revalidatePath('/user/dashboard')
    revalidatePath(`/user/orders/${orderId}`)

    return {
      success: true,
      data: {
        refund_amount: refundAmount,
        message: `Permintaan refund sebesar Rp ${refundAmount.toLocaleString('id-ID')} telah dikirim ke admin. Kami akan memproses dalam 3-5 hari kerja.`
      }
    }
  } catch (err: any) {
    console.error('Request Refund Error:', err)
    return { success: false, error: err.message || 'Gagal mengajukan refund.' }
  }
}

/**
 * Get refund/cancellation status
 */
export async function getRefundStatusAction(orderId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, data: null, error: 'Silakan login kembali.' }
    }

    const adminClient = createAdminClient()

    // Check if user owns this order
    const { data: order } = await adminClient
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .single()

    if (!order || order.user_id !== user.id) {
      return { success: false, data: null, error: 'Pesanan tidak ditemukan.' }
    }

    // Get cancellation record if exists
    const { data: cancellation, error } = await adminClient
      .from('order_cancellations')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (error?.code === 'PGRST116') {
      // No cancellation record found
      return {
        success: true,
        data: { status: 'none' }
      }
    }

    if (error) throw error

    return {
      success: true,
      data: {
        status: cancellation.refund_status,
        amount: cancellation.refund_amount,
        reason: cancellation.reason,
        cancelled_at: cancellation.cancelled_at,
        processed_at: cancellation.refund_processed_at
      }
    }
  } catch (err: any) {
    console.error('Get Refund Status Error:', err)
    return { success: false, data: null, error: err.message }
  }
}

/**
 * Get order statistics for user
 */
export async function getUserOrderStatsAction() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, data: null, error: 'Silakan login kembali.' }
    }

    const adminClient = createAdminClient()

    const { data: orders, error } = await adminClient
      .from('orders')
      .select('id, status')
      .eq('user_id', user.id)

    if (error) throw error

    const stats = {
      total_orders: orders?.length || 0,
      completed: orders?.filter(o => o.status === 'completed').length || 0,
      in_progress: orders?.filter(o => o.status === 'in_progress').length || 0,
      pending: orders?.filter(o => ['pending_payment', 'waiting_mitra', 'accepted'].includes(o.status)).length || 0,
      cancelled: orders?.filter(o => o.status === 'cancelled').length || 0
    }

    return { success: true, data: stats }
  } catch (err: any) {
    console.error('Get User Order Stats Error:', err)
    return { success: false, data: null, error: err.message }
  }
}

/**
 * Confirm completion of an order by user
 */
export async function confirmOrderCompletionAction(orderId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    const adminClient = createAdminClient()

    // 1. Get the order and check permission / status
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, user_id, status, mitra_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { success: false, error: 'Pesanan tidak ditemukan.' }
    }

    if (order.user_id !== user.id) {
      return { success: false, error: 'Anda tidak berhak menyelesaikan pesanan ini.' }
    }

    if (order.status !== 'service_done') {
      return { success: false, error: 'Pesanan belum dapat dikonfirmasi selesai.' }
    }

    // 2. Update status to 'completed' via atomic RPC
    const { error: updateError } = await adminClient.rpc('complete_order_transaction', {
      p_order_id: orderId
    });

    if (updateError) throw updateError

    // 3. Increment Mitra's total_orders_completed count
    if (order.mitra_id) {
      const { data: mitraData, error: mitraFetchError } = await adminClient
        .from('mitras')
        .select('total_orders_completed')
        .eq('id', order.mitra_id)
        .single()

      if (!mitraFetchError && mitraData) {
        const currentCount = mitraData.total_orders_completed || 0
        await adminClient
          .from('mitras')
          .update({ total_orders_completed: currentCount + 1 })
          .eq('id', order.mitra_id)
      }
    }

    // 4. Record the timeline event
    await adminClient.from('order_timeline').insert({
      order_id: orderId,
      event_type: 'completed',
      status_before: 'service_done',
      status_after: 'completed',
      details: { confirmation_by: 'user' },
      triggered_by: 'user',
      created_by: user.id
    })

    revalidatePath('/user/dashboard')
    revalidatePath(`/user/orders/${orderId}`)
    revalidatePath('/admin/pesanan')
    revalidatePath(`/admin/pesanan/${orderId}`)

    return { success: true }
  } catch (err: any) {
    console.error('Confirm Order Completion Error:', err)
    return { success: false, error: err.message || 'Gagal mengonfirmasi penyelesaian pesanan.' }
  }
}
