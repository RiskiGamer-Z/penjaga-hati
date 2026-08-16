import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database.types'

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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // refresh the auth session
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Protected paths definitions
  const isOwnerPath = pathname.startsWith('/owner')
  const isAdminPath = pathname.startsWith('/admin')
  const isMitraPath = pathname.startsWith('/mitra')
  const isUserPath = pathname.startsWith('/user') || pathname.startsWith('/booking') || pathname.startsWith('/diagnose')
  const isAuthPath = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register')

  if (isOwnerPath || isAdminPath || isMitraPath || isUserPath) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }

    // Get user role strictly from database
    let role = 'user'
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (userData?.role) {
      role = userData.role.toLowerCase()
    }

    // Role-based restrictions
    if (isOwnerPath && role !== 'owner') {
      const url = request.nextUrl.clone()
      if (role === 'admin') {
        url.pathname = '/admin/dashboard'
      } else if (role === 'mitra') {
        url.pathname = '/mitra/dashboard'
      } else {
        url.pathname = '/user/dashboard'
      }
      return NextResponse.redirect(url)
    }

    if (isAdminPath && role !== 'admin') {
      const url = request.nextUrl.clone()
      if (role === 'owner') {
        url.pathname = '/owner/dashboard'
      } else if (role === 'mitra') {
        url.pathname = '/mitra/dashboard'
      } else {
        url.pathname = '/user/dashboard'
      }
      return NextResponse.redirect(url)
    }

    if (isMitraPath && role !== 'mitra') {
      const url = request.nextUrl.clone()
      if (role === 'owner') {
        url.pathname = '/owner/dashboard'
      } else if (role === 'admin') {
        url.pathname = '/admin/dashboard'
      } else {
        url.pathname = '/user/dashboard'
      }
      return NextResponse.redirect(url)
    }

    if (isUserPath && role !== 'user') {
      const url = request.nextUrl.clone()
      if (role === 'owner') {
        url.pathname = '/owner/dashboard'
      } else if (role === 'admin') {
        url.pathname = '/admin/dashboard'
      } else {
        url.pathname = '/mitra/dashboard'
      }
      return NextResponse.redirect(url)
    }
  }

  // If logged in and trying to access auth pages, redirect to their dashboard
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
    if (role === 'owner') {
      url.pathname = '/owner/dashboard'
    } else if (role === 'admin') {
      url.pathname = '/admin/dashboard'
    } else if (role === 'mitra') {
      url.pathname = '/mitra/dashboard'
    } else {
      url.pathname = '/user/dashboard'
    }
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
