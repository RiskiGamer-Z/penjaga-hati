'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Get current user's full profile
 * Includes preferences and account details
 */
export async function getUserProfileAction() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, data: null, error: 'Silakan login kembali.' }
    }

    const adminClient = createAdminClient()

    // Fetch user profile from public.users
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select(`
        id,
        full_name,
        phone,
        email,
        avatar_url,
        role,
        created_at
      `)
      .eq('id', user.id)
      .single()

    if (profileError) {
      return { success: false, data: null, error: 'Profil tidak ditemukan.' }
    }

    // Fetch user preferences
    const { data: preferences } = await adminClient
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return {
      success: true,
      data: {
        ...profile,
        preferences: preferences || null,
        auth_email: user.email
      }
    }
  } catch (err: any) {
    console.error('Get User Profile Error:', err)
    return { success: false, data: null, error: err.message }
  }
}

/**
 * Update user profile information
 */
export async function updateUserProfileAction(data: {
  full_name?: string
  phone?: string
  avatar_url?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    const adminClient = createAdminClient()

    // Validate input
    if (data.full_name && data.full_name.trim().length === 0) {
      return { success: false, error: 'Nama tidak boleh kosong.' }
    }

    if (data.phone && data.phone.trim().length < 10) {
      return { success: false, error: 'Nomor telepon tidak valid.' }
    }

    // Prepare update data
    const updateData: any = {}
    if (data.full_name !== undefined) updateData.full_name = data.full_name.trim()
    if (data.phone !== undefined) updateData.phone = data.phone.trim()
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url

    // Update in database
    const { error: updateError } = await adminClient
      .from('users')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      if (updateError.code === '23505') {
        return { success: false, error: 'Nomor telepon ini sudah terdaftar.' }
      }
      throw updateError
    }

    revalidatePath('/user/profile')
    revalidatePath('/user/dashboard')

    return { success: true }
  } catch (err: any) {
    console.error('Update User Profile Error:', err)
    return { success: false, error: err.message || 'Gagal memperbarui profil.' }
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferencesAction(data: {
  language?: string
  notifications_email?: boolean
  notifications_whatsapp?: boolean
  notifications_order_update?: boolean
  notifications_review?: boolean
  theme_preference?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    const adminClient = createAdminClient()

    // Check if preferences exist
    const { data: existing } = await adminClient
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let error
    if (existing) {
      // Update existing
      const result = await adminClient
        .from('user_preferences')
        .update(data)
        .eq('user_id', user.id)
      error = result.error
    } else {
      // Create new
      const result = await adminClient
        .from('user_preferences')
        .insert({
          user_id: user.id,
          ...data
        })
      error = result.error
    }

    if (error) throw error

    revalidatePath('/user/profile')

    return { success: true }
  } catch (err: any) {
    console.error('Update User Preferences Error:', err)
    return { success: false, error: err.message || 'Gagal memperbarui preferensi.' }
  }
}

/**
 * Get user's favorite mitras
 */
export async function getUserFavoritesAction(limit: number = 10, offset: number = 0) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, data: null, error: 'Silakan login kembali.' }
    }

    const adminClient = createAdminClient()

    const { data: favorites, error, count } = await adminClient
      .from('user_favorites')
      .select(
        `
        id,
        mitra_id,
        added_at,
        notes,
        mitras:mitra_id (
          id,
          average_rating,
          users!mitras_user_id_fkey (full_name, phone)
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      success: true,
      data: {
        favorites: favorites || [],
        total: count || 0,
        limit,
        offset
      }
    }
  } catch (err: any) {
    console.error('Get User Favorites Error:', err)
    return { success: false, data: null, error: err.message }
  }
}

/**
 * Add mitra to favorites
 */
export async function addFavoriteMitraAction(mitraId: string, notes?: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    const adminClient = createAdminClient()

    // Validate that user is not trying to add themselves as favorite
    const { data: mitra, error: mitraError } = await adminClient
      .from('mitras')
      .select('user_id')
      .eq('id', mitraId)
      .single()

    if (mitraError || !mitra) {
      return { success: false, error: 'Mitra tidak ditemukan.' }
    }

    if (mitra.user_id === user.id) {
      return { success: false, error: 'Anda tidak dapat menambahkan diri sendiri sebagai favorit.' }
    }

    const { error } = await adminClient
      .from('user_favorites')
      .insert({
        user_id: user.id,
        mitra_id: mitraId,
        notes: notes || null
      })

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Mitra sudah ada dalam favorit Anda.' }
      }
      throw error
    }

    revalidatePath('/user/profile')

    return { success: true }
  } catch (err: any) {
    console.error('Add Favorite Mitra Error:', err)
    return { success: false, error: err.message || 'Gagal menambahkan favorit.' }
  }
}

/**
 * Remove mitra from favorites
 */
export async function removeFavoriteMitraAction(mitraId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('mitra_id', mitraId)

    if (error) throw error

    revalidatePath('/user/profile')

    return { success: true }
  } catch (err: any) {
    console.error('Remove Favorite Mitra Error:', err)
    return { success: false, error: err.message || 'Gagal menghapus favorit.' }
  }
}

/**
 * Delete user account (soft delete)
 */
export async function deleteUserAccountAction(password: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    // Verify password before deletion
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email || '',
      password: password
    })

    if (signInError) {
      return { success: false, error: 'Password tidak valid.' }
    }

    const adminClient = createAdminClient()

    // Soft delete: set deleted_at timestamp
    const { error: updateError } = await adminClient
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false
      })
      .eq('id', user.id)

    if (updateError) throw updateError

    // Sign out the user
    await supabase.auth.signOut()

    return { success: true }
  } catch (err: any) {
    console.error('Delete User Account Error:', err)
    return { success: false, error: err.message || 'Gagal menghapus akun.' }
  }
}

/**
 * Change user password
 */
export async function changePasswordAction(newPassword: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'Password minimal 6 karakter.' }
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
      data: { password_changed_at: new Date().toISOString() }
    })

    if (updateError) throw updateError

    return { success: true }
  } catch (err: any) {
    console.error('Change Password Error:', err)
    return { success: false, error: err.message || 'Gagal mengubah password.' }
  }
}

/**
 * Server action to upload user profile photo using adminClient
 * to bypass storage RLS policy restrictions.
 */
export async function uploadAvatarAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: "File tidak ditemukan." };
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Silakan login kembali." };
    }

    const adminClient = createAdminClient();
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    // Convert File object to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to 'avatars' bucket bypassing RLS
    const { error: uploadError } = await adminClient.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: publicUrlData } = adminClient.storage.from('avatars').getPublicUrl(fileName);
    const publicUrl = publicUrlData.publicUrl;

    // Update in database users table
    const { error: updateError } = await adminClient
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return { success: true, publicUrl };
  } catch (err: any) {
    console.error("uploadAvatarAction error:", err);
    return { success: false, error: err.message || "Gagal mengunggah foto profil." };
  }
}

