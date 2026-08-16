'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function registerMitraAction(formData: FormData) {
  try {
    const fullName = formData.get('full_name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const gender = formData.get('gender') as string || 'Perempuan'
    const skillsString = formData.get('skills') as string
    const bankName = formData.get('bank_name') as string
    const bankAccountNumber = formData.get('bank_account_number') as string
    const bankAccountName = formData.get('bank_account_name') as string
    
    // Get admin user for audit logging
    const supabase = await createClient()
    const { data: { user: adminUser } } = await supabase.auth.getUser()

    // Split skills by comma and trim
    const skillsArray = skillsString ? skillsString.split(',').map(s => s.trim()).filter(Boolean) : []

    const adminClient = createAdminClient()

    // 1. Buat User di Supabase Auth menggunakan Admin API
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: 'PenjagaHati123', // Default password sesuai kesepakatan
      email_confirm: true, // Otomatis terkonfirmasi karena didaftarkan admin
      user_metadata: {
        full_name: fullName,
        role: 'mitra'
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return { success: false, error: 'Email sudah terdaftar di sistem.' }
      }
      return { success: false, error: authError.message }
    }

    const userId = authData.user.id

    const { error: userError } = await adminClient.from('users').upsert({
      id: userId,
      full_name: fullName,
      phone: phone,
      email: email,
      role: 'mitra'
    })

    if (userError) {
      console.error("Gagal insert ke users:", userError)
      // Attempt cleanup
      await adminClient.auth.admin.deleteUser(userId)
      
      if (userError.code === '23505' && userError.message.includes('users_phone_key')) {
        return { success: false, error: 'Nomor WhatsApp sudah terdaftar di sistem. Gunakan nomor lain.' }
      }
      return { success: false, error: 'Gagal membuat profil pengguna. Silakan coba lagi.' }
    }

    // 3. Insert ke tabel public.mitras
    const { error: mitraError } = await adminClient.from('mitras').insert({
      user_id: userId,
      gender: gender,
      specializations: skillsArray,
      bank_name: bankName,
      bank_account_number: bankAccountNumber,
      bank_account_name: bankAccountName,
      is_verified: false, // Pending verification by admin
      is_available: true
    })

    if (mitraError) {
      console.error("Gagal insert ke mitras:", mitraError)
      return { success: false, error: 'Gagal membuat profil mitra.' }
    }

    // Log action (optional, wrap in try-catch so it won't crash if table doesn't exist yet)
    if (adminUser) {
      try {
        await adminClient.from('admin_activity_log').insert({
          admin_id: adminUser.id,
          action: 'register_mitra',
          resource_type: 'mitra',
          resource_id: userId,
          changes: { full_name: fullName, email, phone }
        })
      } catch (logErr) {
        console.warn("Gagal mencatat log aktivitas admin:", logErr)
      }
    }

    revalidatePath('/admin/mitra')
    return { success: true }

  } catch (err: any) {
    console.error("Register Mitra Error:", err)
    return { success: false, error: 'Terjadi kesalahan sistem yang tidak terduga.' }
  }
}

export async function getMitrasAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const adminClient = createAdminClient()

    // Verify admin role
    const { data: adminUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminUser?.role !== 'admin' && adminUser?.role !== 'owner') return []

    const { data, error } = await adminClient
      .from('mitras')
      .select(`
        id,
        specializations,
        average_rating,
        is_verified,
        is_available,
        users:user_id (id, full_name, phone, created_at)
      `)
      .order('id', { ascending: false })

    if (error) {
      console.error("Error fetching mitras:", error)
      return []
    }
    return data || []
  } catch (err) {
    console.error("Server Action getMitras Error:", err)
    return []
  }
}

export async function getMitraDetailAction(mitraId: string) {
  try {
    const adminClient = createAdminClient()
    const { data: mitra, error: mitraError } = await adminClient
      .from('mitras')
      .select(`
        *,
        users:user_id (id, full_name, phone, email, created_at)
      `)
      .eq('id', mitraId)
      .single()

    if (mitraError) throw mitraError

    const { data: orders, error: ordersError } = await adminClient
      .from('orders')
      .select(`
        *,
        users:user_id (full_name, phone),
        hospitals:hospital_id (name),
        service_packages:package_id (name)
      `)
      .eq('mitra_id', mitraId)
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    return { success: true, data: { mitra, orders } }
  } catch (err: any) {
    console.error("Server Action getMitraDetail Error:", err)
    return { success: false, error: 'Gagal mengambil data detail mitra.' }
  }
}

/**
 * Approve mitra (set is_verified = true)
 */
export async function approveMitraAction(mitraId: string, notes?: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

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

    // Update mitra
    const { error } = await adminClient
      .from('mitras')
      .update({ is_verified: true })
      .eq('id', mitraId)

    if (error) throw error

    // Log action
    await adminClient.from('admin_activity_log').insert({
      admin_id: user.id,
      action: 'register_mitra',
      resource_type: 'mitra',
      resource_id: mitraId,
      changes: { is_verified: true, notes: notes || 'Approved' }
    })

    revalidatePath('/admin/mitra')
    revalidatePath(`/admin/mitra/${mitraId}`)

    return { success: true }
  } catch (err: any) {
    console.error('Approve Mitra Error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Reject mitra (set is_verified = false)
 */
export async function rejectMitraAction(mitraId: string, reason: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

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

    if (!reason || reason.length < 5) {
      return { success: false, error: 'Reason required (min 5 characters)' }
    }

    // Update mitra
    const { error } = await adminClient
      .from('mitras')
      .update({ is_verified: false })
      .eq('id', mitraId)

    if (error) throw error

    // Log action with reason
    await adminClient.from('admin_activity_log').insert({
      admin_id: user.id,
      action: 'register_mitra',
      resource_type: 'mitra',
      resource_id: mitraId,
      changes: { is_verified: false, rejection_reason: reason }
    })

    revalidatePath('/admin/mitra')
    revalidatePath(`/admin/mitra/${mitraId}`)

    return { success: true }
  } catch (err: any) {
    console.error('Reject Mitra Error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Suspend mitra (set is_active = false)
 */
export async function suspendMitraAction(mitraId: string, reason: string, duration?: number) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

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

    if (!reason || reason.length < 5) {
      return { success: false, error: 'Reason required (min 5 characters)' }
    }

    const { error } = await adminClient
      .from('mitras')
      .update({ is_available: false })
      .eq('id', mitraId)

    if (error) throw error

    // Log action
    await adminClient.from('admin_activity_log').insert({
      admin_id: user.id,
      action: 'suspend_mitra',
      resource_type: 'mitra',
      resource_id: mitraId,
      changes: { is_available: false, reason, duration: duration || 'permanent' }
    })

    revalidatePath('/admin/mitra')
    revalidatePath(`/admin/mitra/${mitraId}`)
    revalidatePath('/admin/dashboard')

    return { success: true }
  } catch (err: any) {
    console.error('Suspend Mitra Error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get mitra documents for verification
 */
export async function getMitraDocumentsAction(mitraId: string) {
  try {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from('mitra_documents')
      .select('*')
      .eq('mitra_id', mitraId)
      .order('uploaded_at', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (err: any) {
    console.error('Get Mitra Documents Error:', err)
    return { success: false, error: err.message, data: [] }
  }
}

/**
 * Admin: Edit mitra profile (for account recovery / troubleshooting)
 * Can update: full_name, phone, email, password, bank info, specializations, gender
 */
export async function adminEditMitraAction(
  mitraId: string,
  data: {
    full_name?: string
    phone?: string
    email?: string
    new_password?: string
    gender?: string
    specializations?: string[]
    bank_name?: string
    bank_account_number?: string
    bank_account_name?: string
  }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return { success: false, error: 'Tidak terautentikasi.' }

    const adminClient = createAdminClient()

    // Verify admin role
    const { data: adminUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminUser?.role !== 'admin' && adminUser?.role !== 'owner') {
      return { success: false, error: 'Akses ditolak: Bukan admin atau owner.' }
    }

    // Get mitra's user_id
    const { data: mitra, error: mitraFetchError } = await adminClient
      .from('mitras')
      .select('user_id')
      .eq('id', mitraId)
      .single()

    if (mitraFetchError || !mitra) {
      return { success: false, error: 'Mitra tidak ditemukan.' }
    }

    const targetUserId = mitra.user_id
    const changes: Record<string, any> = {}

    // 1. Update Supabase Auth (email & password) via Admin API
    const authUpdates: Record<string, any> = {}
    if (data.email) authUpdates.email = data.email
    if (data.new_password && data.new_password.length >= 6) authUpdates.password = data.new_password

    if (Object.keys(authUpdates).length > 0) {
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
        targetUserId,
        authUpdates
      )
      if (authUpdateError) {
        return { success: false, error: `Gagal update auth: ${authUpdateError.message}` }
      }
      Object.assign(changes, authUpdates.email ? { email: authUpdates.email } : {})
      if (authUpdates.password) changes.password_reset = true
    }

    // 2. Update public.users table
    const userUpdates: Record<string, any> = {}
    if (data.full_name) userUpdates.full_name = data.full_name
    if (data.phone) userUpdates.phone = data.phone
    if (data.email) userUpdates.email = data.email

    if (Object.keys(userUpdates).length > 0) {
      const { error: userUpdateError } = await adminClient
        .from('users')
        .update(userUpdates)
        .eq('id', targetUserId)

      if (userUpdateError) {
        return { success: false, error: `Gagal update profil: ${userUpdateError.message}` }
      }
      Object.assign(changes, userUpdates)
    }

    // 3. Update public.mitras table
    const mitraUpdates: Record<string, any> = {}
    if (data.gender) mitraUpdates.gender = data.gender
    if (data.specializations) mitraUpdates.specializations = data.specializations
    if (data.bank_name) mitraUpdates.bank_name = data.bank_name
    if (data.bank_account_number) mitraUpdates.bank_account_number = data.bank_account_number
    if (data.bank_account_name) mitraUpdates.bank_account_name = data.bank_account_name

    if (Object.keys(mitraUpdates).length > 0) {
      const { error: mitraUpdateError } = await adminClient
        .from('mitras')
        .update(mitraUpdates)
        .eq('id', mitraId)

      if (mitraUpdateError) {
        return { success: false, error: `Gagal update data mitra: ${mitraUpdateError.message}` }
      }
      Object.assign(changes, mitraUpdates)
    }

    // 4. Log admin activity
    await adminClient.from('admin_activity_log').insert({
      admin_id: user.id,
      action: 'edit_mitra_profile',
      resource_type: 'mitra',
      resource_id: mitraId,
      changes
    })

    revalidatePath(`/admin/mitra/${mitraId}`)
    revalidatePath('/admin/mitra')

    return { success: true, message: 'Profil mitra berhasil diperbarui.' }
  } catch (err: any) {
    console.error('Admin Edit Mitra Error:', err)
    return { success: false, error: err.message || 'Terjadi kesalahan sistem.' }
  }
}
