'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

/**
 * Get all active system settings
 */
export async function getSystemSettingsAction() {
  try {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from('system_settings')
      .select('*')
      .eq('is_active', true)
      .order('category')

    if (error) throw error

    // Transform to object for easy access
    const settings: Record<string, string> = {}
    data?.forEach(s => {
      settings[s.setting_key] = s.setting_value
    })

    return { success: true, data: settings, raw: data }
  } catch (err: any) {
    console.error('Get System Settings Error:', err)
    return { success: false, error: err.message, data: {} }
  }
}

/**
 * Update a system setting
 */
export async function updateSystemSettingAction(settingKey: string, settingValue: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify admin role
    const adminClient = createAdminClient()
    const { data: adminUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminUser?.role !== 'admin' && adminUser?.role !== 'owner') {
      return { success: false, error: 'Unauthorized - admin or owner only' }
    }

    // Validate based on key
    const validations: Record<string, (v: string) => boolean> = {
      'commission_percentage': (v) => {
        const n = parseFloat(v)
        return n >= 0 && n <= 100
      },
      'min_order_amount': (v) => parseFloat(v) > 0,
      'max_order_amount': (v) => parseFloat(v) > 0,
      'min_withdrawal_amount': (v) => parseFloat(v) > 0,
      'max_withdrawal_amount': (v) => parseFloat(v) > 0,
      'order_acceptance_timeout_minutes': (v) => parseInt(v) > 0,
      'mitra_active_orders_limit': (v) => parseInt(v) > 0,
      'cancellation_refund_percentage': (v) => {
        const n = parseFloat(v)
        return n >= 0 && n <= 100
      }
    }

    if (validations[settingKey] && !validations[settingKey](settingValue)) {
      return { success: false, error: `Invalid value for ${settingKey}` }
    }

    // Get old value for audit
    const { data: oldData } = await adminClient
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', settingKey)
      .single()

    const oldValue = oldData?.setting_value

    // Update setting
    const { error } = await adminClient
      .from('system_settings')
      .update({
        setting_value: settingValue,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('setting_key', settingKey)

    if (error) throw error

    // Log to audit trail
    await adminClient.from('admin_activity_log').insert({
      admin_id: user.id,
      action: 'system_setting_update',
      resource_type: 'system_settings',
      resource_id: settingKey,
      old_values: { [settingKey]: oldValue },
      new_values: { [settingKey]: settingValue }
    })

    return { success: true }
  } catch (err: any) {
    console.error('Update System Setting Error:', err)
    return { success: false, error: err.message }
  }
}
