'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import crypto from 'crypto'

export async function verifyAndGetUserRole() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Sesi telah berakhir. Silakan login kembali.' }
  }

  // Note: Hardcoded roles for 'admin@penjagahati.com' etc have been removed for security.
  // Real role assignment strictly depends on the 'users' table in database.

  const adminClient = createAdminClient()

  // Find user profile using admin client to bypass RLS/permission limitations
  let { data: profile, error: dbError } = await adminClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (dbError || !profile) {
    console.log(`Profile missing in public.users for user ${user.id} (${user.email}). Auto-creating on the fly...`)
    
    // Auto-create profile row
    const securityToken = user.user_metadata?.security_token || crypto.randomUUID()
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna Baru'
    const phone = user.user_metadata?.phone || null

    let userRole = 'user'
    if (user.user_metadata?.role) {
      userRole = user.user_metadata.role
    }

    const insertPayload = {
      id: user.id,
      email: user.email,
      full_name: fullName,
      phone: phone,
      role: userRole,
      security_token: securityToken,
      is_active: true
    }

    const { data: newProfile, error: insertError } = await adminClient
      .from('users')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) {
      console.error("Gagal auto-insert profile:", insertError)
      // Retry without email/security_token in case columns are missing
      const fallbackPayload = {
        id: user.id,
        full_name: fullName,
        phone: phone,
        role: userRole,
        is_active: true
      }
      const { data: retryProfile, error: retryError } = await adminClient
        .from('users')
        .insert(fallbackPayload)
        .select()
        .single()

      if (retryError) {
        console.error("Gagal retry auto-insert profile:", retryError)
        return { success: false, error: 'Sinkronisasi database gagal.' }
      }
      profile = retryProfile
    } else {
      profile = newProfile
    }

    // Sync security_token back to auth user metadata if needed
    try {
      await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, security_token: securityToken }
      })
    } catch (authErr) {
      console.warn("Could not save security_token to auth metadata during auto-creation:", authErr)
    }
  }

  const role = profile?.role?.toLowerCase() || 'user'
  return { success: true, role, user, profile }
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: (formData.get('email') as string).replace(/"/g, '').trim(),
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    let errorMessage = "Terjadi kesalahan saat login";
    if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Email belum terdaftar atau password salah";
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage = "Silakan konfirmasi email Anda terlebih dahulu";
    }
    redirect('/auth/login?error=' + encodeURIComponent(errorMessage))
  }

  // Sync / verify user session and profile
  const { data: { user } } = await supabase.auth.getUser()
  
  revalidatePath('/', 'layout')
  
  if (user) {
    const securityToken = crypto.randomUUID()
    const adminClient = createAdminClient()

    // 1. Check and ensure profile is synced/created
    const result = await verifyAndGetUserRole()
    const role = result.role || 'user'

    // 2. Try to update token in database (public.users)
    try {
      await adminClient.from('users').update({ security_token: securityToken }).eq('id', user.id)
    } catch (dbErr) {
      console.warn("Could not save security_token to public.users table:", dbErr)
    }

    // 3. Save token to auth user metadata
    try {
      await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, security_token: securityToken }
      })
    } catch (authErr) {
      console.warn("Could not save security_token to auth metadata:", authErr)
    }
    
    if (role === 'admin') {
      redirect('/admin/dashboard')
    } else if (role === 'mitra') {
      redirect('/mitra/dashboard')
    } else if (role === 'owner') {
      redirect('/owner/dashboard')
    } else {
      redirect('/user/dashboard')
    }
  } else {
    redirect('/user/dashboard')
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string).replace(/"/g, '').trim()
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const phone = formData.get('phone') as string

  // SECURITY CHECK: Block public registration for internal domains
  if (email.toLowerCase().endsWith('@penjagahati.com')) {
    redirect('/auth/register?error=' + encodeURIComponent('Registrasi dengan domain internal tidak diizinkan. Hubungi admin.'));
  }

  // 1. Daftar ke Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    let errorMessage = "Terjadi kesalahan saat mendaftar";
    if (authError.message.includes("User already registered")) {
      errorMessage = "Email ini sudah terdaftar. Silakan login.";
    } else if (authError.message.includes("Password should be at least")) {
      errorMessage = "Password terlalu pendek. Minimal 6 karakter.";
    } else {
      errorMessage = authError.message; // fallback
    }
    redirect('/auth/register?error=' + encodeURIComponent(errorMessage))
  }

  // 2. Insert ke tabel public.users
  if (authData.user) {
    const securityToken = crypto.randomUUID()
    const adminClient = createAdminClient()
    
    const insertPayload: any = {
      id: authData.user.id,
      email: email,
      full_name: fullName,
      phone: phone,
      role: 'user',
      is_active: true
    }

    try {
      insertPayload.security_token = securityToken
      const { error: dbError } = await adminClient.from('users').insert(insertPayload)
      if (dbError) {
        console.error("Gagal menyimpan data profile:", dbError)
        // Fallback insert without security_token if column doesn't exist
        if (dbError.message.includes("column") || dbError.code === 'PGRST102') {
          delete insertPayload.security_token
          await adminClient.from('users').insert(insertPayload)
        }
      }
    } catch (err) {
      console.error("Gagal insert profile:", err)
      // Fallback insert
      try {
        delete insertPayload.security_token
        await adminClient.from('users').insert(insertPayload)
      } catch (fallbackErr) {
        console.error("Gagal insert profile fallback:", fallbackErr)
      }
    }

    // Save token to auth user metadata
    try {
      await adminClient.auth.admin.updateUserById(authData.user.id, {
        user_metadata: { security_token: securityToken }
      })
    } catch (authErr) {
      console.warn("Gagal menyimpan security_token ke auth metadata:", authErr)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/user/dashboard')
}
