'use server'

import { createAdminClient } from '@/utils/supabase/admin'

export async function getBookingDataAction() {
  try {
    const adminClient = createAdminClient()

    const [hospRes, mitraRes, pkgRes] = await Promise.all([
      adminClient
        .from('hospitals')
        .select('*')
        .order('name', { ascending: true }),
      adminClient
        .from('mitras')
        .select('id, gender, specializations, is_available, is_verified, users!inner(full_name)')
        .eq('is_verified', true),
      adminClient
        .from('service_packages')
        .select('*')
        .order('base_price', { ascending: true })
    ])

    return {
      hospitals: hospRes.data || [],
      mitras: mitraRes.data || [],
      packages: pkgRes.data || []
    }
  } catch (err: any) {
    console.error('getBookingDataAction Error:', err)
    return { hospitals: [], mitras: [], packages: [] }
  }
}
