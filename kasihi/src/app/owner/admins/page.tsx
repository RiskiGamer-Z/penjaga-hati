import { getAdminAccountsAction, getAdminPerformanceMetricsAction } from "../actions";
import AdminsManagementClient from "./AdminsManagementClient";
import { ShieldCheck } from "lucide-react";

export const revalidate = 0; // Fresh load for audit logs and admin statuses

export default async function OwnerAdminsPage() {
  // Fetch admins
  const adminsRes = await getAdminAccountsAction();
  
  // Fetch activity logs
  const logsRes = await getAdminPerformanceMetricsAction();

  if (!adminsRes.success || !logsRes.success) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center flex flex-col items-center gap-4 py-20">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-2xl font-black text-brand-navy">Gagal memuat data administrasi</h2>
        <p className="text-slate-500 text-sm max-w-md">
          {adminsRes.error || logsRes.error || "Pastikan Anda masuk sebagai Owner dengan kredensial yang valid."}
        </p>
      </div>
    );
  }

  const admins = adminsRes.data || [];
  const logs = logsRes.data || [];

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-brand-navy tracking-tight">Kelola &amp; Kinerja Staf Admin</h1>
        <p className="text-slate-500 text-sm mt-1">
          Pantau kinerja operasional, verifikasi aktivitas, dan perbarui profil akses Admin 1 dan Admin 2.
        </p>
      </div>

      {/* Main Client UI */}
      <AdminsManagementClient admins={admins} logs={logs} />
    </div>
  );
}
