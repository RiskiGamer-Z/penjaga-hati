import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { verifyAndGetUserRole } from '@/app/auth/actions'
import { createAdminClient } from '@/utils/supabase/admin'
import crypto from 'crypto'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    let user = null
    
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data?.user) {
      user = data.user
    } else {
      // Fallback: check if we already have a session/user (e.g. from a parallel request)
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        user = currentUser
      } else {
        console.error('OAuth exchange error:', error)
      }
    }
    
    if (user) {
      const adminClient = createAdminClient()
      const securityToken = crypto.randomUUID()

      // 1. Check and ensure profile is synced/created
      const result = await verifyAndGetUserRole()
      const role = result.role || 'user'

      // 2. Try to update token in database (public.users)
      try {
        await adminClient.from('users').update({ security_token: securityToken }).eq('id', user.id)
      } catch (dbErr) {
        console.warn("Could not save security_token to public.users table in callback:", dbErr)
      }

      // 3. Save token to auth user metadata
      try {
        await adminClient.auth.admin.updateUserById(user.id, {
          user_metadata: { ...user.user_metadata, security_token: securityToken }
        })
      } catch (authErr) {
        console.warn("Could not save security_token to auth metadata in callback:", authErr)
      }

      // Redirect to correct dashboard based on role
      if (role === 'admin') {
        return NextResponse.redirect(`${origin}/admin/dashboard`)
      } else if (role === 'mitra') {
        return NextResponse.redirect(`${origin}/mitra/dashboard`)
      } else if (role === 'owner') {
        return NextResponse.redirect(`${origin}/owner/dashboard`)
      } else {
        // Untuk user biasa: hormati tujuan awal (mis. /booking) bila aman.
        if (next && next.startsWith('/') && !next.startsWith('//')) {
          return NextResponse.redirect(`${origin}${next}`)
        }
        return NextResponse.redirect(`${origin}/user/dashboard`)
      }
    }
  }

  // Redirect to login page on failure with error query param
  return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent('Autentikasi gagal atau sesi tidak dapat dibuat.')}`)
}
