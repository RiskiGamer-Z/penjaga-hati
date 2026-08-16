import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Klien ini menggunakan Service Role Key, sehingga BISA MEMBYPASS RLS.
// PERINGATAN: Hanya gunakan ini di dalam Server Actions atau API Routes.
// Jangan pernah expose ini ke sisi klien.
export function createAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
