import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import KeuanganClient from "./KeuanganClient";

export const revalidate = 0;

export default async function OwnerKeuanganPage() {
  const adminClient = createAdminClient();
  const supabase = await createClient();

  // 1. Get logged in Owner ID
  const { data: { user: owner } } = await supabase.auth.getUser();
  const ownerId = owner?.id || '';

  // 2. Fetch System settings (commissions)
  const { data: settingData } = await adminClient
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "commission_percentage")
    .single();
  const commPercent = settingData ? parseFloat(settingData.setting_value) : 15;

  // 3. Fetch withdrawals
  const { data: withdrawals, error: withdrawalsErr } = await adminClient
    .from("mitra_withdrawals")
    .select(`
      id,
      amount,
      bank_name,
      bank_account_number,
      bank_account_name,
      status,
      requested_at,
      completed_at,
      rejection_reason,
      mitras (
        id,
        users!mitras_user_id_fkey (
          full_name,
          email,
          phone
        )
      )
    `)
    .order("requested_at", { ascending: false });

  if (withdrawalsErr) {
    console.error("Gagal mengambil data penarikan:", withdrawalsErr);
  }

  // 4. Fetch payments
  const { data: payments, error: paymentsErr } = await adminClient
    .from("payments")
    .select(`
      id,
      amount,
      status,
      method:payment_method,
      created_at,
      orders (
        users:user_id (
          full_name
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (paymentsErr) {
    console.error("Gagal mengambil data pembayaran:", paymentsErr);
  }

  // Map orders.users to users so KeuanganClient receives the expected shape
  const mappedPayments = (payments || []).map((p: any) => ({
    ...p,
    users: p.orders?.users || null
  }));

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-brand-navy tracking-tight">Manajemen Keuangan</h1>
        <p className="text-slate-500 text-sm mt-1">
          Pantau omzet platform, kelola pengajuan pencairan dana (withdrawals) mitra pendamping, dan pantau histori pembayaran pelanggan.
        </p>
      </div>

      {/* Keuangan Client view */}
      <KeuanganClient
        withdrawals={withdrawals || []}
        payments={mappedPayments}
        commPercent={commPercent}
        ownerId={ownerId}
      />
    </div>
  );
}
