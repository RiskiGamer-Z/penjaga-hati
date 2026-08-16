"use client";

import { Plus, Edit, Trash2, Package, Loader2, X, CheckCircle2, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { addPackageAction, updatePackageAction, deletePackageAction, getPackagesAction } from "./actions";
import { toast } from "@/utils/toast";

// Default package templates
const DEFAULT_PACKAGES = [
  {
    name: "Paket 8 Jam",
    description: "Pendampingan selama 8 jam dengan dukungan penuh dari companion profesional kami.",
    duration_hours: 8,
    price_per_hour: 14875,
    base_price: 119000,
    bgGradient: "from-blue-400/40 to-cyan-400/40",
    iconBg: "from-blue-500/30 to-cyan-500/30",
    accentColor: "#06B6D4",
  },
  {
    name: "Paket 12 Jam",
    description: "Pendampingan sepanjang hari (12 jam) dengan layanan premium dan prioritas tinggi.",
    duration_hours: 12,
    price_per_hour: 12416,
    base_price: 149000,
    bgGradient: "from-purple-400/40 to-pink-400/40",
    iconBg: "from-purple-500/30 to-pink-500/30",
    accentColor: "#A855F7",
  },
  {
    name: "Paket 18 Jam",
    description: "Layanan premium dengan pendampingan maksimal hingga 18 jam untuk perawatan intensif.",
    duration_hours: 18,
    price_per_hour: 12166,
    base_price: 219000,
    bgGradient: "from-emerald-400/40 to-teal-400/40",
    iconBg: "from-emerald-500/30 to-teal-500/30",
    accentColor: "#10B981",
  },
];

export default function AdminPackagesPage() {
  const supabase = createClient();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_hours: 1,
    price_per_hour: 0,
    base_price: 0,
  });

  // Load Data
  const fetchPackages = async () => {
    setLoading(true);
    const result = await getPackagesAction();
      
    if (result.success && result.data) {
      setPackages(result.data);
    } else if (!result.success) {
      toast.error(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Handle Form Input with auto-calculate total
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? Number(value) : value;
    
    setFormData(prev => {
      const nextData = { ...prev, [name]: parsedValue };
      
      // Auto-calculate base_price if duration_hours or price_per_hour changes
      if (name === 'duration_hours' || name === 'price_per_hour') {
        const duration = name === 'duration_hours' ? (parsedValue as number) : prev.duration_hours;
        const priceHour = name === 'price_per_hour' ? (parsedValue as number) : prev.price_per_hour;
        nextData.base_price = duration * priceHour;
      }
      
      return nextData;
    });
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", duration_hours: 1, price_per_hour: 0, base_price: 0 });
    setIsModalOpen(true);
  };

  // Add Package from Template
  const handleAddFromTemplate = (template: any) => {
    setEditingId(null);
    setFormData({
      name: template.name,
      description: template.description,
      duration_hours: template.duration_hours,
      price_per_hour: template.price_per_hour,
      base_price: template.base_price,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (pkg: any) => {
    setEditingId(pkg.id);
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      duration_hours: pkg.duration_hours || 1,
      price_per_hour: pkg.price_per_hour || 0,
      base_price: pkg.base_price || 0,
    });
    setIsModalOpen(true);
  };

  // Delete
  const handleDelete = async (id: string) => {
    const isConfirmed = await toast.confirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus paket layanan ini?");
    if (!isConfirmed) return;
    const result = await deletePackageAction(id);
    if (result.success) {
      toast.success("Paket layanan berhasil dihapus");
      fetchPackages();
    } else {
      toast.error(result.error);
    }
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      name: formData.name,
      description: formData.description,
      duration_hours: Number(formData.duration_hours),
      price_per_hour: Number(formData.price_per_hour),
      base_price: Number(formData.base_price)
    };

    let result;
    if (editingId) {
      result = await updatePackageAction(editingId, payload);
    } else {
      result = await addPackageAction(payload);
    }

    if (result.success) {
      toast.success(`Paket layanan berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}`);
      setIsModalOpen(false);
      fetchPackages();
    } else {
      toast.error(result.error);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden gap-6 p-8 relative">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif font-bold text-brand-navy text-2xl">Daftar Paket Layanan</h1>
          <p className="text-gray-500 text-sm">Kelola paket pendampingan dan harga per jamnya</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded py-2 px-4 bg-brand-navy text-white font-medium text-sm hover:bg-blue-900 transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>Tambah Paket</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-brand-evergreen" />
          </div>
        ) : packages.length === 0 ? (
          <div className="space-y-8">
            {/* Empty State with Template Packages */}
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Package size={48} className="mb-4 opacity-30" />
              <p className="font-medium text-brand-navy text-lg">Belum ada data Paket</p>
              <p className="text-sm text-gray-500 mb-8">Mulai dengan template paket yang disediakan di bawah ini</p>
            </div>

            {/* Template Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
              {DEFAULT_PACKAGES.map((pkg, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-50 border border-slate-200 rounded p-5 flex flex-col gap-4 group hover:border-slate-300 transition-all shadow-sm"
                >
                  <div className="flex flex-col gap-4 h-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded flex items-center justify-center bg-white border border-slate-200 text-gray-500">
                        <Clock size={20} />
                      </div>
                      <h3 className="font-serif font-bold text-brand-navy text-base">{pkg.name}</h3>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <span className="text-2xl font-bold text-brand-navy">
                        Rp {pkg.base_price.toLocaleString('id-ID')}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock size={14} />
                        <span className="font-medium">{pkg.duration_hours} Jam</span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-3 flex-1 mt-2">
                      {pkg.description}
                    </p>

                    <button
                      onClick={() => handleAddFromTemplate(pkg)}
                      className="w-full mt-4 py-2 px-4 rounded font-medium text-brand-navy border border-brand-navy hover:bg-slate-100 text-sm transition-all cursor-pointer"
                    >
                      + Tambah dari Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
            {packages.map((pkg, idx) => (
              <div 
                key={pkg.id} 
                className="bg-white rounded border border-slate-200 shadow-sm p-5 flex flex-col gap-4 group hover:border-slate-300 transition-all hover:shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded flex items-center justify-center bg-slate-50 border border-slate-200 text-brand-navy">
                    <Package size={20} />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenEdit(pkg)} 
                      className="p-1.5 rounded text-gray-400 hover:text-brand-navy hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(pkg.id)} 
                      className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-200"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <h3 className="font-serif font-bold text-brand-navy text-base">{pkg.name}</h3>
                  <span className="text-2xl font-bold text-brand-navy">
                    Rp {pkg.base_price.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center gap-2 py-1.5 px-3 rounded bg-slate-50 border border-slate-200 w-fit">
                  <Clock size={14} className="text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">{pkg.duration_hours} Jam</span>
                </div>

                <p className="text-gray-600 text-sm line-clamp-3 flex-1 mt-1">
                  {pkg.description || "Tidak ada deskripsi"}
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
              <h2 className="font-serif font-bold text-brand-navy text-lg">{editingId ? 'Edit Paket' : 'Tambah Paket'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 rounded p-1 hover:bg-slate-200 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Paket <span className="text-red-500">*</span></label>
                <input 
                  required type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="Misal: Paket 12 Jam"
                  className="w-full rounded py-2 px-3 border border-slate-300 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Durasi (Jam) <span className="text-red-500">*</span></label>
                  <input 
                    required type="number" name="duration_hours" value={formData.duration_hours} onChange={handleChange} min="1"
                    className="w-full rounded py-2 px-3 border border-slate-300 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Harga / Jam (Rp) <span className="text-red-500">*</span></label>
                  <input 
                    required type="number" name="price_per_hour" value={formData.price_per_hour} onChange={handleChange} min="0"
                    className="w-full rounded py-2 px-3 border border-slate-300 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Harga Total Paket (Rp)</label>
                <input 
                  required type="number" name="base_price" value={formData.base_price} onChange={handleChange} min="0"
                  readOnly
                  className="w-full rounded py-2 px-3 border border-slate-200 bg-slate-50 text-gray-600 font-bold outline-none text-sm cursor-not-allowed"
                />
                <span className="text-xs text-gray-400 italic">Otomatis dihitung dari Durasi × Harga per Jam.</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deskripsi Paket <span className="text-red-500">*</span></label>
                <textarea 
                  required name="description" value={formData.description} onChange={handleChange} rows={3}
                  placeholder="Fasilitas dan penjelasan paket"
                  className="w-full rounded py-2 px-3 border border-slate-300 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-sm font-medium text-brand-navy bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors cursor-pointer">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-white bg-brand-navy rounded hover:bg-blue-900 transition-colors disabled:opacity-50 cursor-pointer">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Simpan Paket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
