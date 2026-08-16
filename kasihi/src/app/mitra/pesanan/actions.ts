'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Get all orders assigned to a specific mitra
 * Filters by status and includes related data
 */
export async function getMitraOrdersAction(
  mitraId: string,
  statusFilter?: string
) {
  try {
    const adminClient = createAdminClient()

    let query = adminClient
      .from('orders')
      .select(`
        id,
        order_number,
        patient_name,
        patient_age,
        patient_condition,
        status,
        created_at,
        hospitals:hospital_id (id, name, address),
        service_packages:package_id (id, name, duration_hours, base_price),
        users:user_id (id, full_name, phone),
        payments (id, status, amount)
      `)
      .eq('mitra_id', mitraId)
      .order('created_at', { ascending: false })

    // Apply status filter if provided
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (err: any) {
    console.error('Get Mitra Orders Error:', err)
    return { success: false, data: [], error: err.message || 'Gagal mengambil daftar pesanan.' }
  }
}

/**
 * Accept an incoming order
 * Changes status from 'waiting_mitra' to 'accepted'
 * Updates the order timestamp
 */
export async function acceptOrderAction(orderId: string, mitraId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    // Verify that the order belongs to this mitra
    const adminClient = createAdminClient()
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, mitra_id, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { success: false, error: 'Pesanan tidak ditemukan.' }
    }

    if (order.mitra_id !== mitraId) {
      return { success: false, error: 'Anda tidak berhak mengakses pesanan ini.' }
    }

    if (order.status !== 'waiting_mitra') {
      return { success: false, error: 'Pesanan tidak dapat diterima pada status ini.' }
    }

    // Update order status to 'accepted'
    const { error: updateError } = await adminClient
      .from('orders')
      .update({
        status: 'accepted'
      })
      .eq('id', orderId)

    if (updateError) throw updateError

    revalidatePath('/mitra/pesanan')
    revalidatePath('/mitra/dashboard')
    revalidatePath(`/admin/pesanan/${orderId}`)

    return { success: true }
  } catch (err: any) {
    console.error('Accept Order Error:', err)
    return { success: false, error: err.message || 'Gagal menerima pesanan.' }
  }
}

/**
 * Reject an incoming order
 * Changes status back to 'waiting_mitra' (available for other mitras)
 * Stores rejection reason in order notes
 */
export async function rejectOrderAction(
  orderId: string,
  mitraId: string,
  reason?: string
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    // Verify that the order belongs to this mitra
    const adminClient = createAdminClient()
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, mitra_id, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { success: false, error: 'Pesanan tidak ditemukan.' }
    }

    if (order.mitra_id !== mitraId) {
      return { success: false, error: 'Anda tidak berhak mengakses pesanan ini.' }
    }

    if (order.status !== 'waiting_mitra' && order.status !== 'accepted') {
      return { success: false, error: 'Pesanan tidak dapat ditolak pada status ini.' }
    }

    // Update order: reset mitra_id to null and set status back to waiting_mitra
    const { error: updateError } = await adminClient
      .from('orders')
      .update({
        mitra_id: null,
        status: 'waiting_mitra',
        rejection_reason: reason || null
      })
      .eq('id', orderId)

    if (updateError) throw updateError

    revalidatePath('/mitra/pesanan')
    revalidatePath('/mitra/dashboard')
    revalidatePath(`/admin/pesanan/${orderId}`)

    return { success: true }
  } catch (err: any) {
    console.error('Reject Order Error:', err)
    return { success: false, error: err.message || 'Gagal menolak pesanan.' }
  }
}

/**
 * Update order status during execution
 * Valid transitions:
 * waiting_mitra -> accepted
 * accepted -> in_transit
 * in_transit -> arrived
 * arrived -> in_progress (pendampingan dimulai)
 * in_progress -> completed
 */
export async function updateOrderStatusAction(
  orderId: string,
  mitraId: string,
  newStatus: 'accepted' | 'in_transit' | 'arrived' | 'in_progress' | 'completed' | 'service_done'
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    // Validate status transition
    const validStatuses = ['accepted', 'in_transit', 'arrived', 'in_progress', 'completed', 'service_done']
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: 'Status tidak valid.' }
    }

    const adminClient = createAdminClient()

    // Verify ownership
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, mitra_id, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { success: false, error: 'Pesanan tidak ditemukan.' }
    }

    if (order.mitra_id !== mitraId) {
      return { success: false, error: 'Anda tidak berhak mengakses pesanan ini.' }
    }

    // Update status
    if (newStatus === 'completed') {
      const { error: updateError } = await adminClient.rpc('complete_order_transaction', {
        p_order_id: orderId
      });
      if (updateError) throw updateError;
    } else {
      const updatePayload: any = { status: newStatus };
      if (newStatus === 'service_done') {
        updatePayload.actual_completion_time = new Date().toISOString();
      }
      const { error: updateError } = await adminClient
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId)

      if (updateError) throw updateError
    }

    // 🔐 Send WhatsApp Notifications for Status Transitions (Mitra -> Client)
    try {
      const { data: orderDetails } = await adminClient
        .from('orders')
        .select(`
          order_number,
          patient_name,
          status,
          hospitals:hospital_id (name),
          users:user_id (full_name, phone),
          mitras:mitra_id (
            users:user_id (full_name, phone)
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderDetails && orderDetails.users) {
        const clientProfile = orderDetails.users ? (Array.isArray(orderDetails.users) ? orderDetails.users[0] : orderDetails.users) : null;
        const rawMitra = orderDetails.mitras ? (Array.isArray(orderDetails.mitras) ? orderDetails.mitras[0] : orderDetails.mitras) : null;
        const mitraProfile = rawMitra?.users ? (Array.isArray(rawMitra.users) ? rawMitra.users[0] : rawMitra.users) : null;
        const rawHospital: any = orderDetails.hospitals;
        const hospitalName = (Array.isArray(rawHospital) ? rawHospital[0]?.name : rawHospital?.name) || 'Rumah Sakit';
        const clientPhone = clientProfile?.phone;

        if (clientPhone) {
          const { sendWhatsAppNotification } = await import('@/utils/whatsapp');
          const mitraName = mitraProfile?.full_name || 'Mitra Pendamping';
          let clientMessage = '';

          switch (newStatus) {
            case 'accepted':
              clientMessage = `🤝 *PESANAN DITERIMA MITRA* 🤝\n\nHalo *${clientProfile.full_name}*,\nKabar baik! Pesanan pendampingan Anda *#${orderDetails.order_number}* telah diterima oleh mitra *${mitraName}*.\n\nMitra kami akan segera mempersiapkan diri untuk mendampingi pasien pada jadwal yang ditentukan.`;
              break;
            case 'in_transit':
              clientMessage = `🚗 *MITRA DALAM PERJALANAN* 🚗\n\nHalo *${clientProfile.full_name}*,\nMitra pendamping Anda, *${mitraName}*, saat ini sedang dalam perjalanan menuju *${hospitalName}* untuk bertugas.`;
              break;
            case 'arrived':
              clientMessage = `📍 *MITRA TIBA DI LOKASI* 📍\n\nHalo *${clientProfile.full_name}*,\nMitra pendamping Anda, *${mitraName}*, telah tiba di *${hospitalName}* dan siap mendampingi pasien *${orderDetails.patient_name}*.`;
              break;
            case 'in_progress':
              clientMessage = `💼 *PENDAMPINGAN DIMULAI* 💼\n\nHalo *${clientProfile.full_name}*,\nPendampingan pasien *${orderDetails.patient_name}* di *${hospitalName}* oleh mitra *${mitraName}* telah resmi dimulai.`;
              break;
            case 'service_done':
              clientMessage = `🎉 *PENDAMPINGAN SELESAI* 🎉\n\nHalo *${clientProfile.full_name}*,\nMitra pendamping *${mitraName}* telah menyatakan bahwa tugas pendampingan untuk *${orderDetails.patient_name}* telah selesai dilaksanakan.\n\nMohon buka dasbor aplikasi Kasihi Anda dan berikan Konfirmasi Selesai serta review Anda. Terima kasih!`;
              break;
          }

          if (clientMessage) {
            await sendWhatsAppNotification(clientPhone, clientMessage);
          }
        }
      }
    } catch (notifyErr) {
      console.error('WhatsApp status notification error:', notifyErr);
    }

    revalidatePath('/mitra/pesanan')
    revalidatePath('/mitra/dashboard')
    revalidatePath(`/admin/pesanan/${orderId}`)

    return { success: true }
  } catch (err: any) {
    console.error('Update Order Status Error:', err)
    return { success: false, error: err.message || 'Gagal memperbarui status pesanan.' }
  }
}

/**
 * Get detailed view of a single order
 * Used when mitra opens order detail
 */
export async function getMitraOrderDetailAction(orderId: string, mitraId: string) {
  try {
    const adminClient = createAdminClient()

    const { data: order, error } = await adminClient
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
        service_packages:package_id (id, name, duration_hours, base_price, description),
        users:user_id (id, full_name, phone),
        payments (id, status, amount)
      `)
      .eq('id', orderId)
      .eq('mitra_id', mitraId)
      .single()

    if (error || !order) {
      return { success: false, data: null, error: 'Pesanan tidak ditemukan.' }
    }

    return { success: true, data: order }
  } catch (err: any) {
    console.error('Get Mitra Order Detail Error:', err)
    return { success: false, data: null, error: err.message }
  }
}

/**
 * Get summary statistics for mitra orders
 * Shows counts by status, total earnings, etc
 */
export async function getMitraOrderStatsAction(mitraId: string) {
  try {
    const adminClient = createAdminClient()

    // Fetch all orders for this mitra
    const { data: orders, error } = await adminClient
      .from('orders')
      .select('id, status, payments (amount)')
      .eq('mitra_id', mitraId)

    if (error) throw error

    // Calculate statistics
    const stats = {
      total: orders?.length || 0,
      accepted: orders?.filter(o => o.status === 'accepted').length || 0,
      in_transit: orders?.filter(o => o.status === 'in_transit').length || 0,
      arrived: orders?.filter(o => o.status === 'arrived').length || 0,
      in_progress: orders?.filter(o => o.status === 'in_progress').length || 0,
      completed: orders?.filter(o => o.status === 'completed').length || 0,
      total_earnings: orders?.reduce((sum, o) => {
        const paymentData = o.payments;
        const payment = paymentData ? (Array.isArray(paymentData) ? paymentData[0] : paymentData) : null;
        const amount = payment?.amount || 0;
        return sum + Number(amount);
      }, 0) || 0
    }

    return { success: true, data: stats }
  } catch (err: any) {
    console.error('Get Mitra Order Stats Error:', err)
    return { success: false, data: null, error: err.message }
  }
}
