'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'

// Mitra Actions
export async function approveMitra(mitraId: string, ownerId: string) {
  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('mitras')
      .update({ 
        is_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', mitraId)

    if (error) throw error

    // Log in admin activity log if possible (optional but good practice)
    try {
      await adminClient.from('admin_activity_log').insert({
        admin_id: ownerId,
        action: 'register_mitra',
        resource_type: 'mitra',
        resource_id: mitraId,
        new_values: { is_verified: true }
      })
    } catch (logErr) {
      console.warn("Could not write to activity log:", logErr)
    }

    revalidatePath('/owner/mitra')
    revalidatePath('/owner/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error("Error approving mitra:", err)
    return { success: false, error: err.message || "Gagal menyetujui mitra." }
  }
}

export async function suspendUser(userId: string, ownerId: string, resourceType: 'user' | 'mitra') {
  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('users')
      .update({ 
        is_active: false
      })
      .eq('id', userId)

    if (error) throw error

    try {
      await adminClient.from('admin_activity_log').insert({
        admin_id: ownerId,
        action: resourceType === 'mitra' ? 'suspend_mitra' : 'suspend_user',
        resource_type: resourceType,
        resource_id: userId,
        new_values: { is_active: false }
      })
    } catch (logErr) {
      console.warn("Could not write to activity log:", logErr)
    }

    revalidatePath('/owner/mitra')
    revalidatePath('/owner/pengguna')
    revalidatePath('/owner/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error("Error suspending user:", err)
    return { success: false, error: err.message || "Gagal menonaktifkan pengguna." }
  }
}

export async function unsuspendUser(userId: string, ownerId: string, resourceType: 'user' | 'mitra') {
  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('users')
      .update({ 
        is_active: true
      })
      .eq('id', userId)

    if (error) throw error

    try {
      await adminClient.from('admin_activity_log').insert({
        admin_id: ownerId,
        action: resourceType === 'mitra' ? 'unsuspend_mitra' : 'unsuspend_user',
        resource_type: resourceType,
        resource_id: userId,
        new_values: { is_active: true }
      })
    } catch (logErr) {
      console.warn("Could not write to activity log:", logErr)
    }

    revalidatePath('/owner/mitra')
    revalidatePath('/owner/pengguna')
    revalidatePath('/owner/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error("Error unsuspending user:", err)
    return { success: false, error: err.message || "Gagal mengaktifkan kembali pengguna." }
  }
}

// User Actions
export async function toggleUserStatus(userId: string, currentStatus: boolean, ownerId: string) {
  if (currentStatus) {
    return suspendUser(userId, ownerId, 'user')
  } else {
    return unsuspendUser(userId, ownerId, 'user')
  }
}

// Financial / Withdrawal Actions
export async function approveWithdrawal(withdrawalId: string, ownerId: string) {
  try {
    const adminClient = createAdminClient()
    const now = new Date().toISOString()
    const { error } = await adminClient
      .from('mitra_withdrawals')
      .update({ 
        status: 'completed',
        approved_by: ownerId,
        approved_at: now,
        completed_at: now,
        updated_at: now
      })
      .eq('id', withdrawalId)

    if (error) throw error

    revalidatePath('/owner/keuangan')
    revalidatePath('/owner/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error("Error approving withdrawal:", err)
    return { success: false, error: err.message || "Gagal menyetujui penarikan." }
  }
}

export async function rejectWithdrawal(withdrawalId: string, rejectionReason: string, ownerId: string) {
  try {
    const adminClient = createAdminClient()
    const now = new Date().toISOString()
    const { error } = await adminClient
      .from('mitra_withdrawals')
      .update({ 
        status: 'rejected',
        rejection_reason: rejectionReason,
        approved_by: ownerId,
        approved_at: now,
        updated_at: now
      })
      .eq('id', withdrawalId)

    if (error) throw error

    revalidatePath('/owner/keuangan')
    revalidatePath('/owner/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error("Error rejecting withdrawal:", err)
    return { success: false, error: err.message || "Gagal menolak penarikan." }
  }
}

// Owner Order Actions
export async function ownerAssignMitra(orderId: string, mitraId: string, ownerId: string) {
  try {
    const adminClient = createAdminClient()

    // Get old order data for audit
    const { data: oldOrder } = await adminClient
      .from('orders')
      .select('mitra_id, status')
      .eq('id', orderId)
      .single()

    // Update order: assign mitra and set status to 'waiting_mitra'
    const { error } = await adminClient
      .from('orders')
      .update({ 
        mitra_id: mitraId, 
        status: 'waiting_mitra'
      })
      .eq('id', orderId)

    if (error) throw error

    // Log to activity log
    try {
      await adminClient.from('admin_activity_log').insert({
        admin_id: ownerId,
        action: 'assign_mitra',
        resource_type: 'order',
        resource_id: orderId,
        old_values: { mitra_id: oldOrder?.mitra_id, status: oldOrder?.status },
        new_values: { mitra_id: mitraId, status: 'waiting_mitra' }
      })
    } catch (logErr) {
      console.warn("Could not write to activity log:", logErr)
    }

    // Log to order timeline
    try {
      await adminClient.from('order_timeline').insert({
        order_id: orderId,
        event_type: 'mitra_assigned',
        status_before: oldOrder?.status,
        status_after: 'waiting_mitra',
        details: { mitra_id: mitraId },
        triggered_by: 'owner',
        created_by: ownerId
      })
    } catch (logErr) {
      console.warn("Could not write to order timeline:", logErr)
    }

    revalidatePath('/owner/pesanan')
    revalidatePath(`/owner/pesanan/${orderId}`)
    revalidatePath('/owner/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error("Owner Assign Mitra Error:", err)
    return { success: false, error: err.message || "Gagal menetapkan mitra." }
  }
}

export async function ownerUpdateOrderStatus(orderId: string, status: string, ownerId: string) {
  try {
    const adminClient = createAdminClient()

    // Get old order data for audit
    const { data: oldOrder } = await adminClient
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    const { error } = await adminClient
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) throw error

    // Log to activity log
    try {
      await adminClient.from('admin_activity_log').insert({
        admin_id: ownerId,
        action: 'update_order_status',
        resource_type: 'order',
        resource_id: orderId,
        old_values: { status: oldOrder?.status },
        new_values: { status }
      })
    } catch (logErr) {
      console.warn("Could not write to activity log:", logErr)
    }

    // Log to order timeline
    try {
      await adminClient.from('order_timeline').insert({
        order_id: orderId,
        event_type: 'owner_status_change',
        status_before: oldOrder?.status,
        status_after: status,
        triggered_by: 'owner',
        created_by: ownerId
      })
    } catch (logErr) {
      console.warn("Could not write to order timeline:", logErr)
    }

    revalidatePath('/owner/pesanan')
    revalidatePath(`/owner/pesanan/${orderId}`)
    revalidatePath('/owner/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error("Owner Update Order Status Error:", err)
    return { success: false, error: err.message || "Gagal memperbarui status pesanan." }
  }
}

// ----------------------------------------------------
// NEW SERVER ACTIONS FOR ADMIN MANAGEMENT & METRICS
// ----------------------------------------------------

export async function getAdminAccountsAction() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Unauthorized' }

    const adminClient = createAdminClient()
    const { data: profile } = await adminClient.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'owner') return { success: false, error: 'Unauthorized' }

    const { data, error } = await adminClient
      .from('users')
      .select('id, full_name, email, phone, is_active, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: true })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (err: any) {
    console.error("getAdminAccountsAction Error:", err)
    return { success: false, error: err.message || "Gagal mengambil data admin." }
  }
}

export async function updateAdminProfileAction(
  adminId: string,
  formData: { full_name: string; phone: string; is_active: boolean }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Unauthorized' }

    const adminClient = createAdminClient()
    const { data: profile } = await adminClient.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'owner') return { success: false, error: 'Unauthorized' }

    const { error } = await adminClient
      .from('users')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)
      .eq('role', 'admin')

    if (error) throw error

    // Log to activity log
    try {
      await adminClient.from('admin_activity_log').insert({
        admin_id: user.id,
        action: 'system_setting_update',
        resource_type: 'user',
        resource_id: adminId,
        new_values: formData
      })
    } catch (logErr) {
      console.warn("Could not log activity:", logErr)
    }

    revalidatePath('/owner/admins')
    return { success: true }
  } catch (err: any) {
    console.error("updateAdminProfileAction Error:", err)
    return { success: false, error: err.message || "Gagal memperbarui profil admin." }
  }
}

export async function getAdminPerformanceMetricsAction() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Unauthorized' }

    const adminClient = createAdminClient()
    const { data: profile } = await adminClient.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'owner') return { success: false, error: 'Unauthorized' }

    const { data: logs, error } = await adminClient
      .from('admin_activity_log')
      .select(`
        id,
        admin_id,
        action,
        created_at,
        resource_type,
        resource_id,
        users!admin_activity_log_admin_id_fkey (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data: logs || [] }
  } catch (err: any) {
    console.error("getAdminPerformanceMetricsAction Error:", err)
    return { success: false, error: err.message || "Gagal mengambil metrik kinerja." }
  }
}
