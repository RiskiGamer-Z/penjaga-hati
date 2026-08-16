'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Get all active users
 */
export async function getPenggunaAction() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return []
    }

    const adminClient = createAdminClient()

    // Verify admin role
    const { data: adminUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminUser?.role !== 'admin' && adminUser?.role !== 'owner') {
      return []
    }

    const { data, error } = await adminClient
      .from('users')
      .select(`
        id,
        full_name,
        phone,
        email,
        created_at,
        is_active,
        deleted_at,
        orders (id)
      `)
      .eq('role', 'user')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching pengguna:", error)
      return []
    }
    
    // Transform data to include total_orders count
    return (data || []).map(user => ({
      ...user,
      total_orders: user.orders ? user.orders.length : 0
    }))
  } catch (err) {
    console.error("Server Action getPengguna Error:", err)
    return []
  }
}

/**
 * Suspend a user account (soft delete)
 */
export async function suspendUserAction(
  userId: string,
  reason: string,
  duration?: number
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Login required' }
    }

    const adminClient = createAdminClient()

    // Verify admin role
    const { data: adminUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminUser?.role !== 'admin' && adminUser?.role !== 'owner') {
      return { success: false, error: 'Unauthorized - admin or owner only' }
    }

    // Validate input
    if (!userId || !reason || reason.length < 5) {
      return { success: false, error: 'Invalid input - reason required (min 5 chars)' }
    }

    // Suspend the user
    const { error: updateError } = await adminClient
      .from('users')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) throw updateError

    // Log to audit trail
    await adminClient.from('admin_activity_log').insert({
      admin_id: user.id,
      action: 'suspend_user',
      resource_type: 'user',
      resource_id: userId,
      old_values: { is_active: true, deleted_at: null },
      new_values: { is_active: false, deleted_at: new Date().toISOString() },
      changes: { reason, duration: duration || null }
    })

    revalidatePath('/admin/pengguna')
    revalidatePath('/admin/dashboard')

    return { success: true }
  } catch (err: any) {
    console.error('Suspend User Error:', err)
    return { success: false, error: err.message || 'Gagal menggantung akun.' }
  }
}

/**
 * Reactivate a suspended user
 */
export async function reactivateUserAction(userId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Login required' }
    }

    const adminClient = createAdminClient()

    // Verify admin role
    const { data: adminUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminUser?.role !== 'admin' && adminUser?.role !== 'owner') {
      return { success: false, error: 'Unauthorized' }
    }

    // Reactivate user
    const { error: updateError } = await adminClient
      .from('users')
      .update({
        is_active: true,
        deleted_at: null
      })
      .eq('id', userId)

    if (updateError) throw updateError

    // Log action
    await adminClient.from('admin_activity_log').insert({
      admin_id: user.id,
      action: 'unsuspend_user',
      resource_type: 'user',
      resource_id: userId,
      old_values: { is_active: false },
      new_values: { is_active: true }
    })

    revalidatePath('/admin/pengguna')

    return { success: true }
  } catch (err: any) {
    console.error('Reactivate User Error:', err)
    return { success: false, error: err.message || 'Gagal mengaktifkan kembali akun.' }
  }
}

/**
 * Get all deleted/suspended users
 */
export async function getDeletedUsersAction(limit: number = 50, offset: number = 0) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Login required', data: [] }
    }

    const adminClient = createAdminClient()

    // Verify admin role
    const { data: adminUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminUser?.role !== 'admin' && adminUser?.role !== 'owner') {
      return { success: false, error: 'Unauthorized', data: [] }
    }

    const { data, count, error } = await adminClient
      .from('users')
      .select('id, full_name, email, phone, deleted_at, created_at', { count: 'exact' })
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return { success: true, data: data || [], count: count || 0 }
  } catch (err: any) {
    console.error('Get Deleted Users Error:', err)
    return { success: false, error: err.message, data: [] }
  }
}
