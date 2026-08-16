"use client";

import { Plus, Edit, Trash2, Package, Loader2, X, CheckCircle2, Clock, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { addPackageAction, updatePackageAction, deletePackageAction, getPackagesAction } from "./actions";
import { toast } from "@/utils/toast";

const TIER_CONFIG: Record<string, { label: string; badge: string; color: string; bg: string; border: string; icon: string }> = {
  bronze: { label: "Bronze", badge: "BRONZE", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: "🥉" },
  silver: { label: "Silver", badge: "SILVER", color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-300", icon: "🥈" },
  gold: { label: "Gold", badge: "GOLD", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-300", icon: "🥇" },
};

export default function AdminPackagesPage() {
  const supabase = createClient();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_hours: 1,
    price_per_hour: 0,
    base_price: 0,
    tier: "bronze",
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === "number" ? Number(value) : value;

    setFormData((prev) => {
      const nextData = { ...prev, [name]: parsedValue };
      if (name === "duration_hours" || name === "price_per_hour") {
        const duration = name === "duration_hours" ? (parsedValue as number) : prev.duration_hours;
        const priceHour = name === "price_per_hour" ? (parsedValue as number) : prev.price_per_hour;
        nextData.base_price = duration * priceHour;
      }
      return nextData;
    });
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", duration_hours: 1, price_per_hour: 0, base_price: 0, tier: "bronze" });
    setIsModalOpen(true);
  };

  const handleAddFromTemplate = (template: any) => {
    setEditingId(null);
    setFormData({
      name: template.name,
      description: template.description,
      duration_hours: template.duration_hours,
      price_per_hour: template.price_per_hour,
      base_price: template.base_price,
      tier: template.tier || "bronze",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: any) => {
    setEditingId(pkg.id);
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      duration_hours: pkg.duration_hours || 1,
      price_per_hour: pkg.price_per_hour || 0,
      base_price: pkg.base_price || 0,
      tier: pkg.tier || "bronze",
    });
    setIsModalOpen(true);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name: formData.name,
      description: formData.description,
      duration_hours: Number(formData.duration_hours),
      price_per_hour: Number(formData.price_per_hour),
      base_price: Number(formData.base_price),
      tier: formData.tier,
    };

    let result;
    if (editingId) {
      result = await updatePackageAction(editingId, payload);
    } else {
      result = await addPackageAction(payload);
    }

    if (result.success) {
      toast.success(`Paket layanan berhasil ${editingId ? "diperbarui" : "ditambahkan"}`);
      setIsModalOpen(false);
      fetchPackages();
    } else {
      toast.error(result.error);
    }

    setIsSubmitting(false);
  };

  const getTierStyle = (tier: string) => {
    return TIER_CONFIG[tier] || TIER_CONFIG.bronze;
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
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Package size={48} className="mb-4 opacity-30" />
              <p className="font-medium text-brand-navy text-lg">Belum ada data Paket</p>
              <p className="text-sm text-gray-500 mb-8">Mulai dengan template paket yang disediakan di bawah ini</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
              {[
                { name: "Bronze - 12 Jam", description: "Pendampingan dasar 12 jam untuk kunjungan medis atau keperluan sehari-hari", duration_hours: 12, price_per_hour: 15000, base_price: 150000, tier: "bronze" },
                { name: "Bronze - 24 Jam", description: "Pendampingan penuh 24 jam dengan absensi berkala setiap 6 jam", duration_hours: 24, price_per_hour: 280000, base_price: 280000, tier: "bronze" },
                { name: "Silver - 1 Hari", description: "Pendampingan intensif 24 jam dengan laporan harian lengkap", duration_hours: 1, price_per_hour: 350000, base_price: 350000, tier: "silver" },
                { name: "Silver - 3 Hari", description: "Pendampingan intensif 3 hari dengan laporan harian", duration_hours: 3, price_per_hour: 950000, base_price: 950000, tier: "silver" },
                { name: "Silver - 7 Hari", description: "Pendampingan intensif 7 hari dengan laporan harian lengkap", duration_hours: 7, price_per_hour: 2000000, base_price: 2000000, tier: "silver" },
                { name: "Gold - 1 Minggu", description: "Pendampingan premium 7 hari dengan laporan komprehensif", duration_hours: 1, price_per_hour: 2100000, base_price: 2100000, tier: "gold" },
                { name: "Gold - 4 Minggu", description: "Pendampingan premium 28 hari dengan laporan komprehensif lengkap", duration_hours: 4, price_per_hour: 7500000, base_price: 7500000, tier: "gold" },
              ].map((pkg, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-5 flex flex-col gap-4 group transition-all ${TIER_CONFIG[pkg.tier].bg} border ${TIER_CONFIG[pkg.tier].border} hover:shadow-md`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award size={16} className={TIER_CONFIG[pkg.tier].color} />
                      <span className={`text-xs font-bold ${TIER_CONFIG[pkg.tier].color}`}>
                        {TIER_CONFIG[pkg.tier].badge}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="font-serif font-bold text-brand-navy text-base">{pkg.name}</h3>
                    <span className="text-2xl font-bold text-brand-navy">
                      Rp {pkg.base_price.toLocaleString("id-ID")}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock size={14} />
                      <span className="font-medium">{pkg.duration_hours} {pkg.duration_hours > 1 && pkg.duration_hours < 7 ? "Hari" : pkg.duration_hours >= 7 ? "Minggu" : "Jam"}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-3 flex-1 mt-2">{pkg.description}</p>

                  <button
                    onClick={() => handleAddFromTemplate(pkg)}
                    className={`w-full mt-4 py-2 px-4 rounded font-medium text-sm transition-all cursor-pointer ${TIER_CONFIG[pkg.tier].bg} ${TIER_CONFIG[pkg.tier].color} border ${TIER_CONFIG[pkg.tier].border} hover:opacity-80`}
                  >
                    + Tambah dari Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
            {packages.map((pkg, idx) => {
              const tierStyle = getTierStyle(pkg.tier);
              return (
                <div
                  key={pkg.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4 group hover:border-slate-300 transition-all hover:shadow-md relative overflow-hidden"
                >
                  {/* Tier Badge */}
                  <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold ${tierStyle.bg} ${tierStyle.color} border-b ${tierStyle.border} border-r rounded-bl-lg`}>
                    {tierStyle.icon} {tierStyle.badge}
                  </div>

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
                      Rp {(Number(pkg.base_price) || Number(pkg.price_per_unit) || 0).toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 py-1.5 px-3 rounded bg-slate-50 border border-slate-200 w-fit">
                    <Clock size={14} className="text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">
                      {pkg.duration_hours} {pkg.duration_hours > 1 && pkg.duration_hours < 7 ? "Hari" : pkg.duration_hours >= 7 ? "Minggu" : "Jam"}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-3 flex-1 mt-1">
                    {pkg.description || "Tidak ada deskripsi"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <h2 className="font-serif font-bold text-brand-navy text-lg">
                {editingId ? "Edit Paket" : "Tambah Paket"}
              </h2>
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

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier <span className="text-red-500">*</span></label>
                <select
                  required name="tier" value={formData.tier} onChange={handleChange}
                  className="w-full rounded py-2 px-3 border border-slate-300 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none text-sm"
                >
                  <option value="bronze">🥉 Bronze (12-24 Jam)</option>
                  <option value="silver">🥈 Silver (1-7 Hari)</option>
                  <option value="gold">🥇 Gold (1-4 Minggu)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Durasi (Jam/Hari/Minggu) <span className="text-red-500">*</span></label>
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
                <span className="text-xs text-gray-400 italic">Otomatis dihitung dari Durasi x Harga per Jam.</span>
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
