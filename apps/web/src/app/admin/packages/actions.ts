'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getPackagesAction() {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('service_packages')
      .select('*')
      .order('duration_hours', { ascending: true })
      
    if (error) throw error
    return { success: true, data }
  } catch (err: any) {
    console.error("Get Packages Error:", err)
    return { success: false, error: err.message || 'Gagal mengambil paket layanan.' }
  }
}

export async function addPackageAction(data: { name: string, description: string, duration_hours: number, price_per_hour: number, base_price: number; tier?: string }) {
  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient.from('service_packages').insert({ ...data, price_per_unit: data.base_price })
    
    if (error) throw error
    
    revalidatePath('/admin/packages')
    revalidatePath('/booking')
    return { success: true }
  } catch (err: any) {
    console.error("Add Package Error:", err)
    return { success: false, error: err.message || 'Gagal menambahkan paket layanan.' }
  }
}

export async function updatePackageAction(id: string, data: { name: string, description: string, duration_hours: number, price_per_hour: number, base_price: number; tier?: string }) {
  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient.from('service_packages').update({ ...data, price_per_unit: data.base_price }).eq('id', id)
    
    if (error) throw error
    
    revalidatePath('/admin/packages')
    revalidatePath('/booking')
    return { success: true }
  } catch (err: any) {
    console.error("Update Package Error:", err)
    return { success: false, error: err.message || 'Gagal memperbarui paket layanan.' }
  }
}

export async function deletePackageAction(id: string) {
  try {
    const adminClient = createAdminClient()
    
    // First, get all orders that reference this package
    const { data: orders, error: ordersGetError } = await adminClient
      .from('orders')
      .select('id')
      .eq('package_id', id)
    
    if (ordersGetError) {
      console.warn("Warning getting related orders:", ordersGetError)
    }
    
    // Delete payments that reference these orders
    if (orders && orders.length > 0) {
      const orderIds = orders.map(o => o.id)
      
      const { error: paymentsError } = await adminClient
        .from('payments')
        .delete()
        .in('order_id', orderIds)
      
      if (paymentsError) {
        console.warn("Warning deleting related payments:", paymentsError)
      }
      
      // Then delete the orders
      const { error: ordersDeleteError } = await adminClient
        .from('orders')
        .delete()
        .in('id', orderIds)
      
      if (ordersDeleteError) {
        console.warn("Warning deleting related orders:", ordersDeleteError)
      }
    }
    
    // Finally, delete the package
    const { error } = await adminClient.from('service_packages').delete().eq('id', id)
    
    if (error) throw error
    
    revalidatePath('/admin/packages')
    revalidatePath('/booking')
    return { success: true }
  } catch (err: any) {
    console.error("Delete Package Error:", err)
    return { success: false, error: err.message || 'Gagal menghapus paket layanan.' }
  }
}
