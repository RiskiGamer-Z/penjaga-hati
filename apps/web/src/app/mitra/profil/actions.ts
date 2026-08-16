'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Get mitra profile details
 * Includes user info, specializations, ratings, availability
 */
export async function getMitraProfileAction(mitraId: string) {
  try {
    const adminClient = createAdminClient()

    const { data: mitra, error } = await adminClient
      .from('mitras')
      .select(`
        id,
        user_id,
        gender,
        specializations,
        bio,
        experience,
        average_rating,
        total_reviews,
        is_verified,
        is_available,
        bank_name,
        bank_account_number,
        bank_account_name,
        created_at,
        verified_at,
        users!mitras_user_id_fkey (
          id,
          full_name,
          phone,
          created_at
        )
      `)
      .eq('id', mitraId)
      .single()

    if (error || !mitra) {
      return { success: false, data: null, error: 'Profil mitra tidak ditemukan.' }
    }

    return { success: true, data: mitra }
  } catch (err: any) {
    console.error('Get Mitra Profile Error:', err)
    return { success: false, data: null, error: err.message }
  }
}

/**
 * Update mitra profile information
 * Can update: bio, experience, specializations, gender
 */
export async function updateMitraProfileAction(
  mitraId: string,
  data: {
    bio?: string
    experience?: string
    specializations?: string[]
    gender?: string
  }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    // Verify that the mitra owns this profile
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

    // Prepare update data (only include fields that are provided)
    const updateData: any = {}
    if (data.bio !== undefined) updateData.bio = data.bio
    if (data.experience !== undefined) updateData.experience = data.experience
    if (data.specializations !== undefined) updateData.specializations = data.specializations
    if (data.gender !== undefined) updateData.gender = data.gender

    // Update mitra profile
    const { error: updateError } = await adminClient
      .from('mitras')
      .update(updateData)
      .eq('id', mitraId)

    if (updateError) throw updateError

    revalidatePath('/mitra/profil')
    revalidatePath('/mitra/dashboard')

    return { success: true }
  } catch (err: any) {
    console.error('Update Mitra Profile Error:', err)
    return { success: false, error: err.message || 'Gagal memperbarui profil.' }
  }
}

/**
 * Update mitra availability status
 * Set whether mitra is available to accept new orders
 */
export async function updateMitraAvailabilityAction(
  mitraId: string,
  isAvailable: boolean
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    // Verify ownership
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

    // Update availability
    const { error: updateError } = await adminClient
      .from('mitras')
      .update({ is_available: isAvailable })
      .eq('id', mitraId)

    if (updateError) throw updateError

    revalidatePath('/mitra/dashboard')
    revalidatePath('/mitra/profil')

    return { success: true, data: { is_available: isAvailable } }
  } catch (err: any) {
    console.error('Update Mitra Availability Error:', err)
    return { success: false, error: err.message || 'Gagal memperbarui ketersediaan.' }
  }
}

/**
 * Update mitra bank account details
 * Used for receiving payments
 */
export async function updateBankDetailsAction(
  mitraId: string,
  data: {
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

    // Validate input
    if (!data.bank_name || !data.bank_account_number || !data.bank_account_name) {
      return { success: false, error: 'Mohon lengkapi semua data rekening bank.' }
    }

    // Verify ownership
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

    // Update bank details
    const { error: updateError } = await adminClient
      .from('mitras')
      .update({
        bank_name: data.bank_name,
        bank_account_number: data.bank_account_number,
        bank_account_name: data.bank_account_name
      })
      .eq('id', mitraId)

    if (updateError) throw updateError

    revalidatePath('/mitra/profil')

    return { success: true }
  } catch (err: any) {
    console.error('Update Bank Details Error:', err)
    return { success: false, error: err.message || 'Gagal memperbarui data rekening.' }
  }
}

/**
 * Update mitra's full name in user table
 * (through the related users table)
 */
export async function updateMitraNameAction(mitraId: string, fullName: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    if (!fullName || fullName.trim().length === 0) {
      return { success: false, error: 'Nama tidak boleh kosong.' }
    }

    // Verify ownership
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

    // Update full_name in users table
    const { error: updateError } = await adminClient
      .from('users')
      .update({ full_name: fullName.trim() })
      .eq('id', mitra.user_id)

    if (updateError) throw updateError

    revalidatePath('/mitra/profil')
    revalidatePath('/mitra/dashboard')

    return { success: true }
  } catch (err: any) {
    console.error('Update Mitra Name Error:', err)
    return { success: false, error: err.message || 'Gagal memperbarui nama.' }
  }
}

/**
 * Update mitra's phone number in user table
 */
export async function updateMitraPhoneAction(mitraId: string, phone: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    if (!phone || phone.trim().length < 10) {
      return { success: false, error: 'Nomor telepon tidak valid.' }
    }

    // Verify ownership
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

    // Update phone in users table
    const { error: updateError } = await adminClient
      .from('users')
      .update({ phone: phone.trim() })
      .eq('id', mitra.user_id)

    if (updateError) {
      if (updateError.code === '23505') {
        return { success: false, error: 'Nomor telepon ini sudah terdaftar.' }
      }
      throw updateError
    }

    revalidatePath('/mitra/profil')

    return { success: true }
  } catch (err: any) {
    console.error('Update Mitra Phone Error:', err)
    return { success: false, error: err.message || 'Gagal memperbarui nomor telepon.' }
  }
}

/**
 * Get mitra rating and reviews summary
 */
export async function getMitraRatingAction(mitraId: string) {
  try {
    const adminClient = createAdminClient()

    const { data: mitra, error } = await adminClient
      .from('mitras')
      .select('id, average_rating, total_reviews')
      .eq('id', mitraId)
      .single()

    if (error || !mitra) {
      return { success: false, data: null, error: 'Mitra tidak ditemukan.' }
    }

    // Get detailed reviews
    const { data: reviews } = await adminClient
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        users:user_id (full_name)
      `)
      .eq('mitra_id', mitraId)
      .order('created_at', { ascending: false })
      .limit(10)

    return {
      success: true,
      data: {
        average_rating: mitra.average_rating || 0,
        total_reviews: mitra.total_reviews || 0,
        recent_reviews: reviews || []
      }
    }
  } catch (err: any) {
    console.error('Get Mitra Rating Error:', err)
    return { success: false, data: null, error: err.message }
  }
}

/**
 * Update mitra's avatar url in user table
 */
export async function updateMitraAvatarAction(mitraId: string, avatarUrl: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

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

    const { error: updateError } = await adminClient
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', mitra.user_id)

    if (updateError) throw updateError

    revalidatePath('/mitra/profil')
    revalidatePath('/mitra/dashboard')
    revalidatePath('/mitra')

    return { success: true }
  } catch (err: any) {
    console.error('Update Mitra Avatar Error:', err)
    return { success: false, error: err.message || 'Gagal memperbarui foto profil.' }
  }
}
