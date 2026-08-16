"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function checkAndAutoCompleteOrders(adminClient: any) {
  try {
    const limitTime = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    
    // Find service_done orders completed more than 5 hours ago
    const { data: expiredOrders, error: fetchErr } = await adminClient
      .from('orders')
      .select('id, mitra_id')
      .eq('status', 'service_done')
      .lte('actual_completion_time', limitTime);

    if (fetchErr) {
      console.error("Error fetching expired service_done orders:", fetchErr);
      return;
    }

    if (expiredOrders && expiredOrders.length > 0) {
      console.log(`Found ${expiredOrders.length} service_done orders expired for more than 5 hours. Auto-completing...`);
      for (const order of expiredOrders) {
        // 1. Update order status to completed via RPC (this also adds to mitra balance)
        const { error: updateErr } = await adminClient.rpc('complete_order_transaction', {
          p_order_id: order.id
        });

        if (updateErr) {
          console.error(`Failed to auto-complete order ${order.id}:`, updateErr);
          continue;
        }

        // 2. Increment Mitra's total_orders_completed count
        if (order.mitra_id) {
          const { data: mitraData } = await adminClient
            .from('mitras')
            .select('total_orders_completed')
            .eq('id', order.mitra_id)
            .single();

          if (mitraData) {
            const currentCount = mitraData.total_orders_completed || 0;
            await adminClient
              .from('mitras')
              .update({ total_orders_completed: currentCount + 1 })
              .eq('id', order.mitra_id);
          }
        }

        // 3. Log to order timeline
        await adminClient.from('order_timeline').insert({
          order_id: order.id,
          event_type: 'completed',
          status_before: 'service_done',
          status_after: 'completed',
          details: { note: 'Auto-completed by system after 5 hours' },
          triggered_by: 'system'
        });
      }
    }
  } catch (err) {
    console.error("autoCompleteServiceDoneOrders error:", err);
  }
}

export async function assignMitraAction(orderId: string, mitraId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const adminClient = createAdminClient();

    // Verify admin role
    const { data: adminUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'admin' && adminUser?.role !== 'owner') {
      return { success: false, error: "Unauthorized" };
    }

    // Get old order data for audit
    const { data: oldOrder } = await adminClient
      .from('orders')
      .select('mitra_id, status')
      .eq('id', orderId)
      .single();

    // Update order: assign mitra and set status to 'waiting_mitra'
    const { error } = await adminClient
      .from('orders')
      .update({ 
        mitra_id: mitraId, 
        status: 'waiting_mitra'
      })
      .eq('id', orderId);

    if (error) throw error;

    // Log to audit trail
    await adminClient.from('admin_activity_log').insert({
      admin_id: user.id,
      action: 'assign_mitra',
      resource_type: 'order',
      resource_id: orderId,
      old_values: { mitra_id: oldOrder?.mitra_id, status: oldOrder?.status },
      new_values: { mitra_id: mitraId, status: 'waiting_mitra' }
    });

    // Log to order timeline
    await adminClient.from('order_timeline').insert({
      order_id: orderId,
      event_type: 'mitra_assigned',
      status_before: oldOrder?.status,
      status_after: 'waiting_mitra',
      details: { mitra_id: mitraId },
      triggered_by: 'admin',
      created_by: user.id
    });

    revalidatePath(`/admin/pesanan/${orderId}`);
    revalidatePath('/admin/pesanan');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error("Assign Mitra Error:", err);
    return { success: false, error: err.message || "Gagal menetapkan mitra." };
  }
}

export async function updateOrderStatusAction(orderId: string, status: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const adminClient = createAdminClient();

    // Verify admin role
    const { data: adminUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'admin' && adminUser?.role !== 'owner') {
      return { success: false, error: "Unauthorized" };
    }

    // Get old order data for audit & checks
    const { data: oldOrder } = await adminClient
      .from('orders')
      .select('status, mitra_id')
      .eq('id', orderId)
      .single();

    if (!oldOrder) {
      return { success: false, error: "Pesanan tidak ditemukan" };
    }

    // Enforce logic: Admin can only mark order as completed if it is currently 'service_done'
    if (status === 'completed' && oldOrder.status !== 'service_done') {
      return { success: false, error: "Pesanan hanya dapat diselesaikan jika mitra sudah menandainya selesai terlebih dahulu." };
    }

    const { error } = await adminClient
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) throw error;

    // Increment Mitra's total_orders_completed count on completion
    if (status === 'completed' && oldOrder.mitra_id) {
      const { data: mitraData, error: mitraFetchError } = await adminClient
        .from('mitras')
        .select('total_orders_completed')
        .eq('id', oldOrder.mitra_id)
        .single();

      if (!mitraFetchError && mitraData) {
        const currentCount = mitraData.total_orders_completed || 0;
        await adminClient
          .from('mitras')
          .update({ total_orders_completed: currentCount + 1 })
          .eq('id', oldOrder.mitra_id);
      }
    }

    // Log to audit trail
    await adminClient.from('admin_activity_log').insert({
      admin_id: user.id,
      action: 'update_order_status',
      resource_type: 'order',
      resource_id: orderId,
      old_values: { status: oldOrder?.status },
      new_values: { status }
    });

    // Log to order timeline
    await adminClient.from('order_timeline').insert({
      order_id: orderId,
      event_type: status === 'completed' ? 'completed' : 'admin_status_change',
      status_before: oldOrder?.status,
      status_after: status,
      details: status === 'completed' ? { confirmation_by: 'admin' } : null,
      triggered_by: 'admin',
      created_by: user.id
    });

    revalidatePath(`/admin/pesanan/${orderId}`);
    revalidatePath('/admin/pesanan');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error("Update Order Status Error:", err);
    return { success: false, error: err.message || "Gagal memperbarui status pesanan." };
  }
}

export async function fetchAdminOrdersAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const adminClient = createAdminClient();

    // Verify admin role
    const { data: adminUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'admin' && adminUser?.role !== 'owner') {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await adminClient
      .from('orders')
      .select(`
        id,
        order_number,
        patient_name,
        patient_age,
        patient_condition,
        status,
        created_at,
        total_amount,
        users:user_id (full_name, phone),
        mitras:mitra_id (id, user_id, users!mitras_user_id_fkey(full_name)),
        hospitals:hospital_id (name),
        payments (id, status, method, amount)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (err: any) {
    console.error("Fetch Admin Orders Error:", err);
    return { success: false, error: err.message || "Gagal mengambil data pesanan." };
  }
}

export async function fetchAdminOrderDetailAction(orderId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const adminClient = createAdminClient();

    // Verify admin role
    const { data: adminUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'admin' && adminUser?.role !== 'owner') {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await adminClient
      .from('orders')
      .select(`
        id,
        order_number,
        patient_name,
        patient_age,
        patient_condition,
        status,
        created_at,
        user_id,
        mitra_id,
        total_amount,
        mitra_earnings,
        users:user_id (full_name, phone, email),
        mitras:mitra_id (id, user_id, users!mitras_user_id_fkey(full_name, phone)),
        hospitals:hospital_id (name, address),
        service_packages:package_id (name, description, duration_hours, base_price),
        payments (id, status, amount, proof_of_transfer_url, verified_by:verified_by_admin_id, created_at, bank_name_from, bank_account_name_from, reference_number)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (err: any) {
    console.error("Fetch Admin Order Detail Error:", err);
    return { success: false, error: err.message || "Gagal mengambil detail pesanan." };
  }
}

export async function fetchAvailableMitrasAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const adminClient = createAdminClient();

    // Verify admin role
    const { data: adminUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'admin' && adminUser?.role !== 'owner') {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await adminClient
      .from('mitras')
      .select('id, user_id, users!mitras_user_id_fkey(full_name, phone)')
      .eq('is_verified', true);

    if (error) throw error;

    return { success: true, data: data };
  } catch (err: any) {
    console.error("Fetch Available Mitras Error:", err);
    return { success: false, error: err.message || "Gagal mengambil data mitra." };
  }
}

export async function getAdminSidebarStatsAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const adminClient = createAdminClient();

    // Verify admin role
    const { data: adminUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'admin' && adminUser?.role !== 'owner') {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch only unviewed pending/waiting orders
    const { count: pendingOrdersCount, error: err1 } = await adminClient
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('admin_viewed', false)
      .in('status', ['pending_payment', 'waiting_mitra']);

    if (err1) throw err1;

    // Fetch payments that are pending AND have uploaded transfer proof
    const { count: pendingPaymentsCount, error: err2 } = await adminClient
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .not('proof_of_transfer_url', 'is', null);

    if (err2) throw err2;

    const { count: pendingMitraCount, error: err3 } = await adminClient
      .from('mitras')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', false);

    if (err3) throw err3;

    return {
      success: true,
      data: {
        pendingOrders: pendingOrdersCount || 0,
        pendingPayments: pendingPaymentsCount || 0,
        pendingMitra: pendingMitraCount || 0
      }
    };
  } catch (err: any) {
    console.error("Get Admin Sidebar Stats Error:", err);
    return { success: false, error: err.message || "Gagal mengambil statistik sidebar." };
  }
}

export async function getAdminDashboardDataAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const adminClient = createAdminClient();

    // Verify admin role
    const { data: adminUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'admin' && adminUser?.role !== 'owner') {
      return { success: false, error: "Unauthorized" };
    }

    // 1. Fetch Total Revenue (Payments that are verified)
    const { data: payments, error: err1 } = await adminClient
      .from('payments')
      .select('amount, status')
      .eq('status', 'verified');

    if (err1) throw err1;
      
    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // 2. Fetch New Orders (status = pending_payment or waiting_mitra)
    const { count: newOrders, error: err2 } = await adminClient
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending_payment', 'waiting_mitra']);

    if (err2) throw err2;

    // 3. Fetch Active Mitras (users with role = mitra)
    const { count: activeMitras, error: err3 } = await adminClient
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'mitra');

    if (err3) throw err3;

    // 4. Fetch Pending Verification payments
    const { count: pendingVerification, error: err4 } = await adminClient
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (err4) throw err4;

    // 5. Fetch Recent Orders
    const { data: recentOrdersData, error: err5 } = await adminClient
      .from('orders')
      .select(`
        id,
        status,
        patient_name,
        created_at,
        actual_completion_time,
        users:user_id (full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (err5) throw err5;

    return {
      success: true,
      data: {
        stats: {
          totalRevenue,
          newOrders: newOrders || 0,
          activeMitras: activeMitras || 0,
          pendingVerification: pendingVerification || 0
        },
        recentOrders: recentOrdersData || []
      }
    };
  } catch (err: any) {
    console.error("Get Admin Dashboard Data Error:", err);
    return { success: false, error: err.message || "Gagal mengambil data dashboard." };
  }
}

export async function markOrderAsViewedAction(orderId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const adminClient = createAdminClient();

    // Verify admin/owner role
    const { data: adminUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminUser?.role !== 'admin' && adminUser?.role !== 'owner') {
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await adminClient
      .from('orders')
      .update({ admin_viewed: true })
      .eq('id', orderId);

    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error("Mark Order As Viewed Error:", err);
    return { success: false, error: err.message || "Gagal menandai pesanan dibaca." };
  }
}
