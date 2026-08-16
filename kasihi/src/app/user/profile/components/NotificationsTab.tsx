interface NotificationsTabProps {
  preferences: {
    notifications_email: boolean;
    notifications_whatsapp: boolean;
  };
  handleTogglePreference: (key: "notifications_email" | "notifications_whatsapp") => Promise<void>;
}

export default function NotificationsTab({
  preferences,
  handleTogglePreference,
}: NotificationsTabProps) {
  return (
    <div className="flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm p-6 md:p-8">
      <h2 className="font-bold text-brand-navy text-lg mb-6">Preferensi Notifikasi</h2>
      
      <div className="flex flex-col gap-6">
        {/* Email Notifications */}
        <div className="flex items-center justify-between py-2">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-brand-navy text-sm">Notifikasi Email</span>
            <span className="text-[#6B7B8D] text-[13px]">Terima pembaruan status pesanan via email</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={preferences.notifications_email}
              onChange={() => handleTogglePreference("notifications_email")}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-evergreen"></div>
          </label>
        </div>
        
        <div className="w-full h-px bg-gray-100" />
        
        {/* WhatsApp Notifications */}
        <div className="flex items-center justify-between py-2">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-brand-navy text-sm">Notifikasi WhatsApp</span>
            <span className="text-[#6B7B8D] text-[13px]">Terima pesan langsung dari mitra via WhatsApp</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={preferences.notifications_whatsapp}
              onChange={() => handleTogglePreference("notifications_whatsapp")}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-evergreen"></div>
          </label>
        </div>
      </div>
    </div>
  );
}
