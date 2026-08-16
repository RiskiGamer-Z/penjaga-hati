import { Camera, Loader2, Save, CheckCircle2 } from "lucide-react";
import React from "react";

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
}

interface ProfileTabProps {
  profileData: ProfileData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSaveProfile: () => Promise<void>;
  isSaving: boolean;
  saveSuccess: boolean;
  avatarUrl: string | null;
  handleAvatarClick: () => void;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export default function ProfileTab({
  profileData,
  handleChange,
  handleSaveProfile,
  isSaving,
  saveSuccess,
  avatarUrl,
  handleAvatarClick,
  isUploading,
  fileInputRef,
  handleAvatarChange,
}: ProfileTabProps) {
  return (
    <div className="flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-brand-navy text-lg">Informasi Pribadi</h2>
        {saveSuccess && (
          <span className="flex items-center gap-1.5 text-brand-evergreen text-sm font-medium animate-in fade-in">
            <CheckCircle2 size={16} /> Tersimpan
          </span>
        )}
      </div>

      {/* Photo Profile Section */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative cursor-pointer" onClick={handleAvatarClick}>
          {avatarUrl ? (
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden relative bg-emerald-50">
              <img src={avatarUrl} alt="Foto profil" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-brand-evergreen text-3xl font-bold border-4 border-white shadow-md">
              <span>{profileData.full_name ? profileData.full_name.charAt(0).toUpperCase() : 'U'}</span>
            </div>
          )}
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); handleAvatarClick(); }}
            disabled={isUploading}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-alpine text-white flex items-center justify-center border-2 border-white hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Camera size={14} />
            )}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            className="hidden" 
            accept="image/png, image/jpeg, image/gif" 
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="font-semibold text-brand-navy text-sm">Foto Profil</span>
          <span className="text-[#9CA3AF] text-xs">Pilih file JPG, PNG, atau GIF (Maks 2MB)</span>
        </div>
      </div>
      
      <div className="w-full h-px bg-gray-100 mb-6" />
      
      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <label className="font-medium text-brand-navy text-sm">Nama Lengkap</label>
          <input 
            type="text" 
            name="full_name"
            value={profileData.full_name}
            onChange={handleChange}
            className="w-full rounded-xl py-3 px-4 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-evergreen focus:border-brand-evergreen outline-none transition-all text-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-brand-navy text-sm">Email <span className="text-gray-400 text-xs font-normal">(Read Only)</span></label>
          <input 
            type="email" 
            name="email"
            value={profileData.email}
            readOnly
            className="w-full rounded-xl py-3 px-4 bg-gray-100 border border-gray-200 outline-none text-sm text-gray-500 cursor-not-allowed"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-brand-navy text-sm">Nomor Telepon</label>
          <input 
            type="tel" 
            name="phone"
            value={profileData.phone}
            onChange={handleChange}
            className="w-full rounded-xl py-3 px-4 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-evergreen focus:border-brand-evergreen outline-none transition-all text-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-brand-navy text-sm">Alamat Lengkap</label>
          <textarea 
            name="address"
            value={profileData.address}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-xl py-3 px-4 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-evergreen focus:border-brand-evergreen outline-none transition-all text-sm resize-none"
          />
        </div>
      </div>
      
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button 
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="flex items-center rounded-[10px] py-3 px-6 gap-2 bg-brand-evergreen hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={16} className="text-white animate-spin" /> : <Save size={16} className="text-white" />}
          <span className="font-semibold text-white text-sm">Simpan Perubahan</span>
        </button>
      </div>
    </div>
  );
}
