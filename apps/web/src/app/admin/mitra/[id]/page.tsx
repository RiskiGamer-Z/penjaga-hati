"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Star, User, Phone, Mail, Key,
  MapPin, CheckCircle, ShieldAlert, Award,
  CreditCard, Loader2, Calendar, Activity, Edit2, X, Eye, EyeOff
} from "lucide-react";
import { toast } from "@/utils/toast";
import { getMitraDetailAction, adminEditMitraAction } from "../actions";
import ApproveMitraButton from "@/components/actions/admin/ApproveMitraButton";
import RejectMitraButton from "@/components/actions/admin/RejectMitraButton";
import SuspendMitraButton from "@/components/actions/admin/SuspendMitraButton";

export default function MitraDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mitraId = params.id as string;
  
  const [mitraData, setMitraData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    new_password: '',
    gender: 'Perempuan',
    specializations: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: ''
  });

  const fetchDetail = async () => {
    setLoading(true);
    const result = await getMitraDetailAction(mitraId);
    if (result.success && result.data) {
      setMitraData(result.data.mitra);
      setOrders(result.data.orders);
    } else {
      toast.error("Gagal Memuat Detail", result.error || "Gagal memuat detail mitra");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (mitraId) fetchDetail();
  }, [mitraId]);

  useEffect(() => {
    if (mitraData) {
      const user = Array.isArray(mitraData.users) ? mitraData.users[0] : mitraData.users;
      setEditForm({
        full_name: user?.full_name || '',
        phone: user?.phone || '',
        email: user?.email || '',
        new_password: '',
        gender: mitraData.gender || 'Perempuan',
        specializations: mitraData.specializations ? mitraData.specializations.join(', ') : '',
        bank_name: mitraData.bank_name || '',
        bank_account_number: mitraData.bank_account_number || '',
        bank_account_name: mitraData.bank_account_name || ''
      });
    }
  }, [mitraData]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const payload: any = {
      ...editForm,
      specializations: editForm.specializations.split(',').map(s => s.trim()).filter(Boolean)
    };
    
    // Hapus password jika kosong
    if (!payload.new_password) {
      delete payload.new_password;
    }
    
    const result = await adminEditMitraAction(mitraId, payload);
    if (result.success) {
      toast.success(result.message || "Profil Berhasil Diubah", "Data profil mitra telah diperbarui.");
      setShowEditModal(false);
      fetchDetail();
    } else {
      toast.error("Gagal Mengubah Profil", result.error || "Terjadi kesalahan.");
    }
    setIsProcessing(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-brand-evergreen" />
        <p className="mt-4 text-gray-500 font-medium">Memuat detail mitra...</p>
      </div>
    );
  }

  if (!mitraData) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-8">
        <p className="text-gray-500 font-medium text-lg">Mitra tidak ditemukan.</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-brand-evergreen text-white rounded-lg">
          Kembali
        </button>
      </div>
    );
  }

  const user = Array.isArray(mitraData.users) ? mitraData.users[0] : mitraData.users;

  return (
    <div className="flex flex-col flex-1 overflow-y-auto bg-gray-50/50 p-6 gap-6 relative">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/mitra" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-brand-navy flex items-center gap-2">
              Detail Mitra
              {mitraData.is_verified ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-brand-evergreen text-[10px] font-bold uppercase tracking-wider">
                  Verified
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-wider">
                  Pending
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500">Kelola dan tinjau profil lengkap mitra.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowEditModal(true)} 
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Edit2 size={16} /> Edit Profil
          </button>
          {!mitraData.is_verified ? (
            <>
              <ApproveMitraButton
                mitraId={mitraId}
                onSuccess={fetchDetail}
              />
              <RejectMitraButton
                mitraId={mitraId}
                onSuccess={fetchDetail}
              />
            </>
          ) : (
            <SuspendMitraButton
              mitraId={mitraId}
              onSuccess={fetchDetail}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Profil Singkat & Info Kontak */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-brand-evergreen/10 flex items-center justify-center text-brand-evergreen font-bold text-3xl mb-4">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'M'}
            </div>
            <h2 className="text-xl font-bold text-brand-navy">{user?.full_name || 'Tanpa Nama'}</h2>
            <p className="text-sm text-gray-500 mt-1">{mitraData.gender || 'Perempuan'}</p>
            
            <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
              <Star size={16} className="text-amber-500 fill-amber-500" />
              <span className="font-bold text-brand-navy">{mitraData.average_rating || 0}</span>
              <span className="text-sm text-gray-500">Rating</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
            <h3 className="font-bold text-brand-navy flex items-center gap-2">
              <User size={18} className="text-brand-evergreen" /> Informasi Kontak
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-50 text-gray-500">
                  <Phone size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">No. WhatsApp</span>
                  <span className="text-sm font-medium text-brand-navy">{user?.phone || '-'}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-50 text-gray-500">
                  <Mail size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</span>
                  <span className="text-sm font-medium text-brand-navy">{user?.email || '-'}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-50 text-gray-500">
                  <Key size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password (Sistem)</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-medium text-brand-navy bg-gray-50 px-2 py-0.5 rounded border border-gray-100">PenjagaHati123</span>
                    <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 uppercase tracking-wider">Default</span>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 italic leading-tight">Gunakan password ini jika mitra lupa akses akun mereka.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-50 text-gray-500">
                  <Calendar size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tanggal Bergabung</span>
                  <span className="text-sm font-medium text-brand-navy">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Detail & Riwayat Pesanan */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
              <h3 className="font-bold text-brand-navy flex items-center gap-2">
                <Award size={18} className="text-brand-evergreen" /> Keahlian & Spesialisasi
              </h3>
              <div className="flex flex-wrap gap-2">
                {mitraData.specializations && mitraData.specializations.length > 0 ? (
                  mitraData.specializations.map((spec: string, idx: number) => (
                    <span key={idx} className="px-3 py-1.5 bg-emerald-50 text-brand-evergreen rounded-lg text-sm font-medium border border-emerald-100">
                      {spec}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 italic">Belum ada data keahlian.</span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
              <h3 className="font-bold text-brand-navy flex items-center gap-2">
                <CreditCard size={18} className="text-brand-evergreen" /> Informasi Bank
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Nama Bank</span>
                  <span className="text-sm font-bold text-brand-navy">{mitraData.bank_name || '-'}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">No. Rekening</span>
                  <span className="text-sm font-bold text-brand-navy">{mitraData.bank_account_number || '-'}</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-sm text-gray-500">Atas Nama</span>
                  <span className="text-sm font-bold text-brand-navy">{mitraData.bank_account_name || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col flex-1 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-brand-navy flex items-center gap-2">
                <Activity size={18} className="text-brand-evergreen" /> Riwayat Penugasan & Pesanan
              </h3>
              <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                Total: {orders.length} Pesanan
              </span>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-gray-500">ID Pesanan</th>
                    <th className="py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Pasien</th>
                    <th className="py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Layanan & RS</th>
                    <th className="py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-gray-500 italic">
                        Belum ada riwayat pesanan untuk mitra ini.
                      </td>
                    </tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-6">
                          <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium text-brand-evergreen hover:underline">
                            #{order.id.substring(0, 8)}
                          </Link>
                          <div className="text-[11px] text-gray-400 mt-1">
                            {new Date(order.created_at).toLocaleDateString('id-ID')}
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="text-sm font-semibold text-brand-navy">{order.users?.full_name || 'Unknown'}</div>
                          <div className="text-[11px] text-gray-500">{order.users?.phone || '-'}</div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="text-sm font-medium text-brand-navy">{order.service_packages?.name || 'Paket Custom'}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5 max-w-[200px] truncate">{order.hospitals?.name || '-'}</div>
                        </td>
                        <td className="py-3 px-6">
                          <span className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                            order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'pending_payment' ? 'bg-orange-100 text-orange-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Reason Modal removed as it is now internally handled by RejectMitraButton and SuspendMitraButton */}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8 relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-evergreen/10 text-brand-evergreen rounded-lg">
                  <Edit2 size={20} />
                </div>
                <h3 className="text-xl font-bold text-brand-navy">
                  Edit Profil Mitra
                </h3>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="editMitraForm" onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Informasi Dasar */}
                <div className="col-span-1 md:col-span-2">
                  <h4 className="font-semibold text-brand-navy mb-4 border-b border-gray-100 pb-2">Informasi Dasar</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                      <input 
                        type="text" 
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-evergreen focus:border-brand-evergreen outline-none"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Jenis Kelamin</label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-evergreen focus:border-brand-evergreen outline-none"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">Keahlian (pisahkan dengan koma)</label>
                      <input 
                        type="text" 
                        value={editForm.specializations}
                        onChange={(e) => setEditForm({...editForm, specializations: e.target.value})}
                        placeholder="Contoh: Perawatan Luka, Terapi Stroke"
                        className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-evergreen focus:border-brand-evergreen outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Info Akun & Kontak */}
                <div className="col-span-1 md:col-span-2">
                  <h4 className="font-semibold text-brand-navy mb-4 border-b border-gray-100 pb-2">Akun & Kontak</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <input 
                        type="email" 
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-evergreen focus:border-brand-evergreen outline-none"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">No. Telepon / WA</label>
                      <input 
                        type="tel" 
                        value={editForm.phone}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-evergreen focus:border-brand-evergreen outline-none"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2 relative">
                      <label className="text-sm font-medium text-gray-700">Password Baru <span className="text-xs text-orange-500 font-normal">(Opsional)</span></label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          value={editForm.new_password}
                          onChange={(e) => setEditForm({...editForm, new_password: e.target.value})}
                          placeholder="Isi jika ingin mereset password (min 6 karakter)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-evergreen focus:border-brand-evergreen outline-none pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Rekening */}
                <div className="col-span-1 md:col-span-2">
                  <h4 className="font-semibold text-brand-navy mb-4 border-b border-gray-100 pb-2">Informasi Rekening Bank</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Nama Bank</label>
                      <select
                        value={editForm.bank_name}
                        onChange={(e) => setEditForm({...editForm, bank_name: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-evergreen focus:border-brand-evergreen outline-none"
                      >
                        <option value="">Pilih Bank...</option>
                        <option value="BCA">BCA</option>
                        <option value="Mandiri">Mandiri</option>
                        <option value="BRI">BRI</option>
                        <option value="BNI">BNI</option>
                        <option value="BSI">BSI</option>
                        <option value="CIMB Niaga">CIMB Niaga</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">Nomor Rekening</label>
                      <input 
                        type="text" 
                        value={editForm.bank_account_number}
                        onChange={(e) => setEditForm({...editForm, bank_account_number: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-evergreen focus:border-brand-evergreen outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-3">
                      <label className="text-sm font-medium text-gray-700">Nama Pemilik Rekening</label>
                      <input 
                        type="text" 
                        value={editForm.bank_account_name}
                        onChange={(e) => setEditForm({...editForm, bank_account_name: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-evergreen focus:border-brand-evergreen outline-none"
                      />
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="editMitraForm"
                disabled={isProcessing || (editForm.new_password.length > 0 && editForm.new_password.length < 6)}
                className="px-5 py-2.5 bg-brand-evergreen text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing && <Loader2 size={16} className="animate-spin" />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
