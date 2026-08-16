'use server'

import { createAdminClient } from '@/utils/supabase/admin'

export async function getHomePackagesAction() {
  try {
    const adminClient = createAdminClient()
    const { data: pkgData, error } = await adminClient
      .from('service_packages')
      .select('*')
      .order('base_price', { ascending: true });

    if (error) throw error;
    return { success: true, packages: pkgData || [] };
  } catch (err: any) {
    console.error('getHomePackagesAction Error:', err);
    return { success: false, error: err.message, packages: [] };
  }
}
