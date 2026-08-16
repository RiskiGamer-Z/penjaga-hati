import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const isOwnerPath = pathname.startsWith('/owner')
  const isAdminPath = pathname.startsWith('/admin')
  const isMitraPath = pathname.startsWith('/mitra')
  const isUserPath = pathname.startsWith('/user') || pathname.startsWith('/booking')
  const isAuthPath = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register')

  if (isOwnerPath || isAdminPath || isMitraPath || isUserPath) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }

    let role = 'user'
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (userData?.role) {
      role = userData.role.toLowerCase()
    }

    if (isOwnerPath && role !== 'owner') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'admin' ? '/admin/dashboard' : role === 'mitra' ? '/mitra/dashboard' : '/user/dashboard'
      return NextResponse.redirect(url)
    }

    if (isAdminPath && role !== 'admin' && role !== 'owner') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'mitra' ? '/mitra/dashboard' : '/user/dashboard'
      return NextResponse.redirect(url)
    }

    if (isMitraPath && role !== 'mitra') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'owner' ? '/owner/dashboard' : role === 'admin' ? '/admin/dashboard' : '/user/dashboard'
      return NextResponse.redirect(url)
    }
  }

  if (isAuthPath && user) {
    let role = 'user'
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (userData?.role) {
      role = userData.role.toLowerCase()
    }

    const url = request.nextUrl.clone()
    url.pathname = role === 'owner' ? '/owner/dashboard' : role === 'admin' ? '/admin/dashboard' : role === 'mitra' ? '/mitra/dashboard' : '/user/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
