'use client'

import SettingsForm from './components/SettingsForm'

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto gap-6 p-8">
      {/* Header */}
      <div className="flex flex-col gap-1 shrink-0 mb-2">
        <h1 className="font-serif font-bold text-brand-navy text-2xl">Pengaturan Sistem</h1>
        <p className="text-gray-500 text-sm">Kelola konfigurasi sistem dan parameter bisnis aplikasi</p>
      </div>

      {/* Settings Form */}
      <div className="flex-1 overflow-y-auto">
        <SettingsForm />
      </div>
    </div>
  )
}
