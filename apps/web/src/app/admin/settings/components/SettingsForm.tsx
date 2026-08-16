'use client'

import { useState, useEffect } from 'react'
import { getSystemSettingsAction, updateSystemSettingAction } from '../actions'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'

interface Setting {
  key: string
  label: string
  type: 'number' | 'text'
  unit?: string
  min?: number
  max?: number
  help?: string
}

const SETTINGS_CONFIG: Setting[] = [
  {
    key: 'commission_percentage',
    label: 'Persentase Komisi',
    type: 'number',
    unit: '%',
    min: 0,
    max: 100,
    help: 'Komisi yang diambil Penjaga Hati dari setiap order'
  },
  {
    key: 'min_order_amount',
    label: 'Jumlah Pesanan Minimum',
    type: 'number',
    unit: 'IDR',
    help: 'Jumlah minimum untuk membuat pesanan baru'
  },
  {
    key: 'max_order_amount',
    label: 'Jumlah Pesanan Maksimum',
    type: 'number',
    unit: 'IDR',
    help: 'Jumlah maksimum untuk membuat pesanan dalam satu kali'
  },
  {
    key: 'min_withdrawal_amount',
    label: 'Jumlah Penarikan Minimum',
    type: 'number',
    unit: 'IDR',
    help: 'Jumlah minimum untuk mitra melakukan penarikan dana'
  },
  {
    key: 'max_withdrawal_amount',
    label: 'Jumlah Penarikan Maksimum',
    type: 'number',
    unit: 'IDR',
    help: 'Jumlah maksimum per permintaan penarikan'
  },
  {
    key: 'order_acceptance_timeout_minutes',
    label: 'Waktu Penerimaan Pesanan',
    type: 'number',
    unit: 'menit',
    help: 'Waktu yang diberikan mitra untuk menerima atau menolak pesanan'
  },
  {
    key: 'mitra_active_orders_limit',
    label: 'Batas Pesanan Aktif per Mitra',
    type: 'number',
    unit: 'pesanan',
    help: 'Jumlah maksimum pesanan yang dapat ditangani mitra secara bersamaan'
  },
  {
    key: 'cancellation_refund_percentage',
    label: 'Persentase Refund Pembatalan',
    type: 'number',
    unit: '%',
    help: 'Persentase pengembalian dana jika user membatalkan sebelum mitra menerima'
  }
]

export default function SettingsForm() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [edited, setEdited] = useState<Set<string>>(new Set())

  // Load settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      const result = await getSystemSettingsAction()
      if (result.success) {
        setSettings(result.data)
      } else {
        toast.error('Gagal memuat pengaturan sistem')
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  // Handle change
  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setEdited(prev => new Set([...prev, key]))
  }

  // Save all changes
  const handleSaveAll = async () => {
    if (edited.size === 0) {
      toast.info('Tidak ada perubahan untuk disimpan')
      return
    }

    setSaving(true)
    let success = 0
    let failed = 0

    for (const key of edited) {
      const result = await updateSystemSettingAction(key, settings[key])
      if (result.success) {
        success++
      } else {
        failed++
        toast.error(`Gagal menyimpan ${key}: ${result.error}`)
      }
    }

    if (failed === 0) {
      toast.success(`${success} pengaturan berhasil disimpan`)
      setEdited(new Set())
    } else {
      toast.error(`${failed} pengaturan gagal disimpan`)
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded border border-slate-200 p-8 text-center shadow-sm">
        <Loader2 className="animate-spin mx-auto mb-3 text-brand-navy" size={32} />
        <p className="text-gray-500 text-sm">Memuat pengaturan sistem...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded border border-slate-200 shadow-sm p-8">
      <h2 className="font-serif font-bold text-2xl mb-6 text-brand-navy border-b border-slate-100 pb-4">Pengaturan Sistem</h2>

      <div className="space-y-6 max-w-2xl">
        {SETTINGS_CONFIG.map(config => (
          <div
            key={config.key}
            className={`pb-6 border-b border-slate-100 last:border-b-0 ${
              edited.has(config.key) ? 'bg-blue-50/50 p-4 rounded -mx-4 px-4 border border-blue-100' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-brand-navy tracking-wide">
                {config.label}
                {edited.has(config.key) && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-sm ml-2 font-medium">
                    Diubah
                  </span>
                )}
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type={config.type}
                value={settings[config.key] || ''}
                onChange={(e) => handleChange(config.key, e.target.value)}
                min={config.min}
                max={config.max}
                className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy disabled:bg-slate-50 transition-all"
                disabled={saving}
              />
              {config.unit && (
                <span className="text-gray-500 text-sm font-medium whitespace-nowrap">
                  {config.unit}
                </span>
              )}
            </div>

            {config.help && (
              <p className="text-[13px] text-gray-500 mt-1.5">{config.help}</p>
            )}
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
        <button
          onClick={handleSaveAll}
          disabled={saving || edited.size === 0}
          className="flex items-center gap-2 px-6 py-2 bg-brand-navy text-white rounded font-medium text-sm hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save size={16} />
              Simpan Perubahan {edited.size > 0 && `(${edited.size})`}
            </>
          )}
        </button>

        {edited.size > 0 && (
          <button
            onClick={() => {
              // Reset to original settings
              const fetchSettings = async () => {
                const result = await getSystemSettingsAction()
                if (result.success) {
                  setSettings(result.data)
                  setEdited(new Set())
                  toast.info('Perubahan dibatalkan')
                }
              }
              fetchSettings()
            }}
            disabled={saving}
            className="px-6 py-2 bg-white text-brand-navy border border-slate-300 rounded font-medium text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Batal
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded">
        <p className="text-sm text-blue-900">
          <strong>💡 Catatan:</strong> Semua perubahan pengaturan akan tercatat dalam audit trail dan dapat dipulihkan jika diperlukan.
        </p>
      </div>
    </div>
  )
}
