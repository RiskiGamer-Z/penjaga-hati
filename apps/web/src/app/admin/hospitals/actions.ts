'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addHospitalAction(data: { name: string, city: string, address: string }) {
  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient.from('hospitals').insert(data)
    
    if (error) throw error
    
    revalidatePath('/admin/hospitals')
    revalidatePath('/booking') // revalidate booking page to show new hospital
    return { success: true }
  } catch (err: any) {
    console.error("Add Hospital Error:", err)
    return { success: false, error: err.message || 'Gagal menambahkan rumah sakit.' }
  }
}

export async function updateHospitalAction(id: string, data: { name: string, city: string, address: string }) {
  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient.from('hospitals').update(data).eq('id', id)
    
    if (error) throw error
    
    revalidatePath('/admin/hospitals')
    revalidatePath('/booking')
    return { success: true }
  } catch (err: any) {
    console.error("Update Hospital Error:", err)
    return { success: false, error: err.message || 'Gagal memperbarui rumah sakit.' }
  }
}

export async function deleteHospitalAction(id: string) {
  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient.from('hospitals').delete().eq('id', id)
    
    if (error) throw error
    
    revalidatePath('/admin/hospitals')
    revalidatePath('/booking')
    return { success: true }
  } catch (err: any) {
    console.error("Delete Hospital Error:", err)
    return { success: false, error: err.message || 'Gagal menghapus rumah sakit.' }
  }
}
