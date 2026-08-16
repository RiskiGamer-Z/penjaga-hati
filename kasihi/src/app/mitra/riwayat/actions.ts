"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function getMitraHistoryAction() {
  try {
    const supabase = await createClient();
    
    // 1. Dapatkan user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const adminClient = createAdminClient();

    // 2. Ambil data mitra berdasarkan user_id
    const { data: mitra, error: mitraErr } = await adminClient
      .from('mitras')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (mitraErr || !mitra) {
      return { success: false, error: "Mitra profile not found" };
    }

    // 3. Ambil completed orders untuk mitra ini
    const { data: orders, error: ordersError } = await adminClient
      .from('orders')
      .select(`
        id,
        patient_name,
        patient_age,
        created_at,
        status,
        hospitals:hospital_id (name),
        service_packages:package_id (name),
        reviews (rating, comment)
      `)
      .eq('mitra_id', mitra.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // 4. Ambil all reviews untuk mitra ini (untuk kalkulasi rating)
    const { data: reviews, error: reviewsError } = await adminClient
      .from('reviews')
      .select('rating')
      .eq('mitra_id', mitra.id);

    if (reviewsError) throw reviewsError;

    return { 
      success: true, 
      orders: orders || [], 
      reviews: reviews || [] 
    };
  } catch (err: any) {
    console.error("Fetch Mitra History Action Error:", err);
    return { success: false, error: err.message || "Gagal mengambil riwayat pendampingan." };
  }
}
