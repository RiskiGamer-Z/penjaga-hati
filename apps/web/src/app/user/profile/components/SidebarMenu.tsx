import { User, Lock, Bell } from "lucide-react";

interface SidebarMenuProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function SidebarMenu({ activeTab, setActiveTab }: SidebarMenuProps) {
  return (
    <div className="w-full lg:w-72 shrink-0">
      <div className="flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <button 
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-3 w-full p-4 text-left transition-colors border-l-4 ${
            activeTab === "profile" 
              ? "border-brand-evergreen bg-emerald-50 text-brand-evergreen" 
              : "border-transparent text-[#4A5568] hover:bg-gray-50"
          }`}
        >
          <User size={18} className={activeTab === "profile" ? "text-brand-evergreen" : "text-[#9CA3AF]"} />
          <span className="font-semibold text-sm">Profil Pengguna</span>
        </button>
        
        <div className="w-full h-px bg-gray-100" />
        
        <button 
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-3 w-full p-4 text-left transition-colors border-l-4 ${
            activeTab === "security" 
              ? "border-brand-evergreen bg-emerald-50 text-brand-evergreen" 
              : "border-transparent text-[#4A5568] hover:bg-gray-50"
          }`}
        >
          <Lock size={18} className={activeTab === "security" ? "text-brand-evergreen" : "text-[#9CA3AF]"} />
          <span className="font-semibold text-sm">Keamanan & Password</span>
        </button>
        
        <div className="w-full h-px bg-gray-100" />
        
        <button 
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-3 w-full p-4 text-left transition-colors border-l-4 ${
            activeTab === "notifications" 
              ? "border-brand-evergreen bg-emerald-50 text-brand-evergreen" 
              : "border-transparent text-[#4A5568] hover:bg-gray-50"
          }`}
        >
          <Bell size={18} className={activeTab === "notifications" ? "text-brand-evergreen" : "text-[#9CA3AF]"} />
          <span className="font-semibold text-sm">Notifikasi</span>
        </button>
      </div>
    </div>
  );
}
