"use client";

import { Search, Star, ShieldAlert, Loader2, CheckCircle, XCircle, Users, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/utils/toast";
import { registerMitraAction, getMitrasAction } from "./actions";

export default function AdminMitraPage() {
  const supabase = createClient();
  const [mitras, setMitras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    gender: "Perempuan",
    skills: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_name: ""
  });

  const fetchMitras = async () => {
    setLoading(true);
    try {
      const data = await getMitrasAction();
      setMitras(data);
    } catch (error) {
      console.error("Failed to fetch mitras:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMitras();
  }, []);

  const handleVerify = async (mitraId: string) => {
    const isConfirmed = await toast.confirm("Konfirmasi Verifikasi", "Apakah Anda yakin ingin memverifikasi mitra ini?");
    if (!isConfirmed) return;
    try {
      const { error } = await supabase
        .from('mitras')
        .update({ is_verified: true })
        .eq('id', mitraId);

      if (error) throw error;
      fetchMitras();
    } catch (err: any) {
      alert("Gagal memverifikasi: " + err.message);
    }
  };

  const handleSuspend = async (mitraId: string) => {
    const isConfirmed = await toast.confirm("Konfirmasi Suspend", "Apakah Anda yakin ingin menangguhkan (suspend) mitra ini?");
    if (!isConfirmed) return;
    try {
      const { error } = await supabase
        .from('mitras')
        .update({ is_verified: false })
        .eq('id', mitraId);

      if (error) throw error;
      toast.success("Mitra berhasil ditangguhkan");
      fetchMitras();
    } catch (err: any) {
      toast.error("Gagal menangguhkan: " + err.message);
    }
  };

  const handleAddMitra = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      
      const result = await registerMitraAction(formData);
      if (result.success) {
        toast.success("Mitra baru berhasil didaftarkan (Password default: PenjagaHati123).");
        setIsModalOpen(false);
        setFormData({
          full_name: "",
          email: "",
          phone: "",
          gender: "Perempuan",
          skills: "",
          bank_name: "",
          bank_account_number: "",
          bank_account_name: ""
        });
        fetchMitras();
      } else {
        toast.error(result.error || "Gagal mendaftarkan mitra.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMitras = mitras.filter(m => {
    if (!searchTerm) return true;
    const user = Array.isArray(m.users) ? m.users[0] : m.users;
    if (!user) return false;
    return (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone?.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const getInitials = (name: string) => {
    if (!name) return "M";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden gap-6 p-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif font-bold text-brand-navy text-2xl">Manajemen Mitra</h1>
          <p className="text-gray-500 text-sm">Kelola dan verifikasi mitra pendamping profesional</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded py-2 px-4 bg-brand-navy text-white font-medium text-sm hover:bg-blue-900 transition-colors shadow-sm cursor-pointer w-full sm:w-auto shrink-0"
        >
          <Plus size={16} />
          <span>Tambah Mitra</span>
        </button>
      </div>

      {/* Tabs / Filters */}
      <div className="flex border-b border-slate-200 shrink-0">
        <div className="py-3 px-6 border-b-2 border-brand-navy text-brand-navy font-medium text-sm cursor-pointer">
          Semua Mitra ({mitras.length})
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center flex-1 rounded py-2 px-3 gap-2 bg-white border border-slate-300 shadow-sm focus-within:border-brand-navy focus-within:ring-1 focus-within:ring-brand-navy transition-all">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau email mitra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none text-sm text-brand-navy placeholder:text-gray-400 w-full"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex flex-col flex-1 overflow-hidden rounded bg-white border border-slate-200 shadow-sm">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse relative min-w-[800px]">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
              <tr>
                <th className="py-3 px-4 uppercase tracking-wider font-medium text-gray-500 text-[11px] w-64">Mitra</th>
                <th className="py-3 px-4 uppercase tracking-wider font-medium text-gray-500 text-[11px] w-32">Rating</th>
                <th className="py-3 px-4 uppercase tracking-wider font-medium text-gray-500 text-[11px]">Keahlian</th>
                <th className="py-3 px-4 uppercase tracking-wider font-medium text-gray-500 text-[11px] w-32">Status</th>
                <th className="py-3 px-4 uppercase tracking-wider font-medium text-gray-500 text-[11px] w-48 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 overflow-y-auto">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-evergreen mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">Memuat data mitra...</p>
                  </td>
                </tr>
              ) : filteredMitras.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={32} className="text-gray-300" />
                      <p className="text-sm font-medium text-brand-navy">Tidak ada data mitra</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMitras.map((mitra) => {
                  const user = Array.isArray(mitra.users) ? mitra.users[0] : mitra.users;
                  return (
                  <tr key={mitra.id} className={`${mitra.is_verified ? 'hover:bg-slate-50' : 'bg-amber-50/30 hover:bg-amber-50'} transition-colors`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded flex items-center justify-center text-white font-bold text-xs shadow-sm ${mitra.is_verified ? 'bg-brand-navy' : 'bg-slate-400'}`}>
                          {getInitials(user?.full_name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-brand-navy text-sm">{user?.full_name || 'Tanpa Nama'}</span>
                          <span className="text-gray-500 text-[11px]">{user?.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {mitra.average_rating ? (
                        <div className="flex items-center gap-1">
                          <Star size={14} fill="#F59E0B" className="text-amber-500" />
                          <span className="font-bold text-brand-navy text-xs">{mitra.average_rating}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px] italic">Belum ada</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {mitra.specializations && mitra.specializations.length > 0 ? (
                          mitra.specializations.slice(0, 3).map((skill: string, idx: number) => (
                            <span key={idx} className="rounded-sm py-0.5 px-1.5 bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-[11px] italic">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {mitra.is_verified ? (
                        <div className="flex items-center w-fit rounded-sm py-0.5 px-2 gap-1.5 bg-green-50 border border-green-200">
                          <div className="rounded-full bg-green-600 w-1.5 h-1.5" />
                          <span className="font-medium text-green-700 text-[11px]">Aktif</span>
                        </div>
                      ) : (
                        <div className="flex items-center w-fit rounded-sm py-0.5 px-2 gap-1.5 bg-amber-50 border border-amber-200">
                          <div className="rounded-full bg-amber-600 w-1.5 h-1.5" />
                          <span className="font-medium text-amber-700 text-[11px]">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/mitra/${mitra.id}`} className="rounded py-1.5 px-3 border border-slate-300 bg-white text-brand-navy font-medium text-xs hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1">
                          Lihat Detail
                        </Link>
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Mitra */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <h2 className="font-serif font-bold text-brand-navy text-lg">Daftar Mitra Internal</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 rounded p-1 hover:bg-slate-200 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddMitra} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input
                    required type="text" name="full_name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Nama lengkap mitra"
                    className="w-full rounded py-2 px-3 border border-slate-300 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email <span className="text-red-500">*</span></label>
                  <input
                    required type="email" name="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="mitra@email.com"
                    className="w-full rounded py-2 px-3 border border-slate-300 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">No. WhatsApp <span className="text-red-500">*</span></label>
                  <input
                    required type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="w-full rounded py-2 px-3 border border-slate-300 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Jenis Kelamin <span className="text-red-500">*</span></label>
                  <select
                    required name="gender" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full rounded py-2 px-3 border border-slate-300 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none text-sm bg-white"
                  >
                    <option value="Perempuan">Perempuan</option>
                    <option value="Laki-laki">Laki-laki</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Keahlian Khusus / Spesialisasi</label>
                  <input
                    type="text" name="skills" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="Misal: Lansia, Fisioterapi (pisahkan koma)"
                    className="w-full rounded py-2 px-3 border border-slate-300 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2 mt-2">
                  <h3 className="text-sm font-bold text-brand-navy border-b border-slate-200 pb-1">Informasi Rekening Bank</h3>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Bank <span className="text-red-500">*</span></label>
                  <select
                    required name="bank_name" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full rounded py-2 px-3 border border-slate-300 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none text-sm bg-white"
                  >
                    <option value="" disabled>Pilih Bank</option>
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BRI">BRI</option>
                    <option value="BNI">BNI</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">No. Rekening <span className="text-red-500">*</span></label>
                  <input
                    required type="text" name="bank_account_number" value={formData.bank_account_number} onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                    placeholder="Nomor Rekening"
                    className="w-full rounded py-2 px-3 border border-slate-300 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Pemilik Rekening <span className="text-red-500">*</span></label>
                  <input
                    required type="text" name="bank_account_name" value={formData.bank_account_name} onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
                    placeholder="Atas Nama"
                    className="w-full rounded py-2 px-3 border border-slate-300 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-sm font-medium text-brand-navy bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors cursor-pointer">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-white bg-brand-navy rounded hover:bg-blue-900 transition-colors disabled:opacity-50 cursor-pointer">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Daftarkan Mitra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
