"use client";

import { Search, Plus, MapPin, Edit, Trash2, Hospital, Loader2, X, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/utils/toast";
import { addHospitalAction, updateHospitalAction, deleteHospitalAction } from "./actions";

export default function AdminHospitalsPage() {
  const supabase = createClient();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: ""
  });

  // Load Data
  const fetchHospitals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('hospitals')
      .select('*')
      .order('name', { ascending: true });
      
    if (data && !error) {
      setHospitals(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  // Handle Form Input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: "", address: "", city: "" });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (rs: any) => {
    setEditingId(rs.id);
    setFormData({
      name: rs.name,
      address: rs.address || "",
      city: rs.city || ""
    });
    setIsModalOpen(true);
  };

  // Delete
  const handleDelete = async (id: string) => {
    const isConfirmed = await toast.confirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus rumah sakit ini?");
    if (!isConfirmed) return;
    try {
      const result = await deleteHospitalAction(id);
      if (result.success) {
        toast.success("Rumah sakit berhasil dihapus");
        fetchHospitals();
      } else {
        toast.error(result.error);
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan sistem.");
    }
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        // Update
        const result = await updateHospitalAction(editingId, formData);
        if (result.success) {
          toast.success("Data rumah sakit berhasil diperbarui");
          setIsModalOpen(false);
          fetchHospitals();
        } else {
          toast.error(result.error);
        }
      } else {
        // Insert
        const result = await addHospitalAction(formData);
        if (result.success) {
          toast.success("Rumah sakit baru berhasil ditambahkan");
          setIsModalOpen(false);
          fetchHospitals();
        } else {
          toast.error(result.error);
        }
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden gap-6 p-8 relative">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif font-bold text-brand-navy text-2xl">Daftar Rumah Sakit</h1>
          <p className="text-gray-500 text-sm">Kelola lokasi rumah sakit yang terdaftar dalam jangkauan layanan</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded py-2 px-4 bg-brand-navy text-white font-medium text-sm hover:bg-blue-900 transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>Tambah RS</span>
        </button>
      </div>

      {/* Hospital Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-brand-evergreen" />
          </div>
        ) : hospitals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Hospital size={48} className="mb-4 opacity-50" />
            <p className="font-medium text-brand-navy">Belum ada data Rumah Sakit</p>
            <p className="text-sm">Klik "Tambah RS" untuk memasukkan data master.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
            {hospitals.map((rs) => (
              <div key={rs.id} className="bg-white rounded border border-slate-200 shadow-sm p-5 flex flex-col gap-4 group hover:border-slate-300 transition-all hover:shadow">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded flex items-center justify-center bg-slate-50 text-brand-navy border border-slate-200">
                    <Hospital size={20} />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(rs)} className="p-1.5 text-gray-400 hover:text-brand-navy transition-colors cursor-pointer rounded hover:bg-slate-50 border border-transparent hover:border-slate-200">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(rs.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer rounded hover:bg-red-50 border border-transparent hover:border-red-200">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-brand-navy text-base">{rs.name}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <MapPin size={12} />
                    <span className="text-xs">{rs.city || "-"}</span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm line-clamp-2 min-h-[40px]">
                  {rs.address || "Alamat belum diisi"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <h2 className="font-serif font-bold text-brand-navy text-lg">{editingId ? 'Edit Rumah Sakit' : 'Tambah Rumah Sakit'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 rounded p-1 cursor-pointer hover:bg-slate-200">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Rumah Sakit <span className="text-red-500">*</span></label>
                <input 
                  required type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="Misal: RS Siloam Kebon Jeruk"
                  className="w-full rounded py-2 px-3 border border-slate-300 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kota / Wilayah <span className="text-red-500">*</span></label>
                <input 
                  required type="text" name="city" value={formData.city} onChange={handleChange}
                  placeholder="Misal: Jakarta Barat"
                  className="w-full rounded py-2 px-3 border border-slate-300 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Alamat Lengkap</label>
                <textarea 
                  name="address" value={formData.address} onChange={handleChange} rows={3}
                  placeholder="Alamat detail rumah sakit"
                  className="w-full rounded py-2 px-3 border border-slate-300 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-sm font-medium text-brand-navy bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors cursor-pointer">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-white bg-brand-navy border border-brand-navy rounded hover:bg-blue-900 transition-colors disabled:opacity-50 cursor-pointer">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
