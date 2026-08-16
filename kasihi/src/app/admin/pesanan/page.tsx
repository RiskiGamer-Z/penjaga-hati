import { createAdminClient } from "@/utils/supabase/admin";
import AdminOrdersTable from "./AdminOrdersTable";

export const revalidate = 0; // Fetch real-time data on every request

export default async function AdminPesananPage() {
  const adminClient = createAdminClient();

  // 1. Fetch Orders with all relations
  const { data: orders, error: ordersError } = await adminClient
    .from("orders")
    .select(`
      id,
      patient_name,
      patient_age,
      patient_condition,
      status,
      created_at,
      total_amount,
      mitra_id,
      users:user_id (id, full_name, email, phone),
      mitras:mitra_id (id, user_id, users!mitras_user_id_fkey(full_name, phone)),
      hospitals:hospital_id (name, address),
      service_packages:package_id (name, base_price),
      payments (id, status, amount, method:payment_method, proof_of_transfer_url, created_at)
    `)
    .order("created_at", { ascending: false });

  if (ordersError) {
    console.error("Gagal mengambil data pesanan admin:", ordersError);
  }

  // 2. Fetch Verified Mitras for assignment dropdown
  const { data: mitras, error: mitrasError } = await adminClient
    .from("mitras")
    .select(`
      id,
      users!mitras_user_id_fkey (
        full_name
      )
    `)
    .eq("is_verified", true);

  if (mitrasError) {
    console.error("Gagal mengambil data mitra terverifikasi untuk admin:", mitrasError);
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">Monitor Seluruh Pesanan</h1>
        <p className="text-slate-500 text-sm mt-1">
          Pantau status layanan pendampingan secara real-time, tetapkan mitra pendamping, dan selesaikan atau batalkan pesanan pelanggan.
        </p>
      </div>

      {/* Admin Orders Table Component */}
      <AdminOrdersTable
        initialOrders={orders || []}
        availableMitras={mitras || []}
      />
    </div>
  );
}
