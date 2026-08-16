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

  const adminClient = createAdminClient()

  let { data: profile, error: dbError } = await adminClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const emailLower = user.email?.toLowerCase() || ''
  let autoRole = 'user'
  if (emailLower.includes('admin')) {
    autoRole = 'admin'
  } else if (emailLower.includes('owner')) {
    autoRole = 'owner'
  }

  if (dbError || !profile) {
    const securityToken = user.user_metadata?.security_token || crypto.randomUUID()
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna Baru'
    const phone = user.user_metadata?.phone || null
    let userRole = autoRole !== 'user' ? autoRole : (user.user_metadata?.role || 'user')

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
      profile = { id: user.id, email: user.email, full_name: fullName, role: userRole }
    } else {
      profile = newProfile
    }
  } else {
    // If profile exists but email contains admin/owner and role is still 'user', update it automatically
    if (autoRole !== 'user' && profile.role === 'user') {
      await adminClient.from('users').update({ role: autoRole }).eq('id', user.id)
      profile.role = autoRole
    }
  }

  const role = profile?.role?.toLowerCase() || autoRole
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

  const { data: { user } } = await supabase.auth.getUser()
  revalidatePath('/', 'layout')
  
  if (user) {
    const result = await verifyAndGetUserRole()
    const role = result.role || 'user'
    
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
  
  const emailLower = email.toLowerCase()
  let role = (formData.get('role') as string) || 'user'
  if (emailLower.includes('admin')) {
    role = 'admin'
  } else if (emailLower.includes('owner')) {
    role = 'owner'
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
        role: role
      }
    }
  })

  if (authError) {
    let errorMessage = "Terjadi kesalahan saat mendaftar";
    if (authError.message.includes("User already registered")) {
      errorMessage = "Email ini sudah terdaftar. Silakan login.";
    } else if (authError.message.includes("Password should be at least")) {
      errorMessage = "Password terlalu pendek. Minimal 6 karakter.";
    } else {
      errorMessage = authError.message;
    }
    redirect('/auth/register?error=' + encodeURIComponent(errorMessage))
  }

  if (authData.user) {
    const securityToken = crypto.randomUUID()
    const adminClient = createAdminClient()
    
    const insertPayload: any = {
      id: authData.user.id,
      email: email,
      full_name: fullName,
      phone: phone,
      role: role,
      security_token: securityToken,
      is_active: true
    }

    try {
      await adminClient.from('users').insert(insertPayload)
      if (role === 'mitra') {
        await adminClient.from('mitras').insert({
          user_id: authData.user.id,
          is_verified: false,
          is_available: true
        })
      }
    } catch (err) {
      console.error("Gagal insert profile/mitra:", err)
    }
  }

  revalidatePath('/', 'layout')
  if (role === 'admin') {
    redirect('/admin/dashboard')
  } else if (role === 'owner') {
    redirect('/owner/dashboard')
  } else if (role === 'mitra') {
    redirect('/mitra/dashboard')
  } else {
    redirect('/user/dashboard')
  }
}
