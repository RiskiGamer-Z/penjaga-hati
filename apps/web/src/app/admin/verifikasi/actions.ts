"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function fetchPaymentsAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, data: [], error: "Not authenticated" };
    }

    const adminClient = createAdminClient();

    // Verify admin role
    const { data: adminUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['admin', 'owner', 'keuangan'].includes(adminUser?.role)) {
      return { success: false, data: [], error: "Unauthorized" };
    }

    const { data, error } = await adminClient
      .from('payments')
      .select(`
        id,
        order_id,
        amount,
        proof_of_transfer_url,
        status,
        created_at,
        verified_by:verified_by_admin_id,
        orders:order_id (
          id,
          order_number,
          patient_name,
          service_packages:package_id (name),
          users:user_id (full_name, phone)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err: any) {
    console.error("Fetch Payments Error:", err);
    return { success: false, data: [], error: err.message };
  }
}

export async function verifyPaymentAction(paymentId: string, orderId: string) {
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

    if (!['admin', 'owner', 'keuangan'].includes(adminUser?.role)) {
      return { success: false, error: "Unauthorized" };
    }

    // 1. Update payment status → 'verified'
    const { error: pErr } = await adminClient
      .from('payments')
      .update({
        status: 'verified',
        verified_by_admin_id: user.id
      })
      .eq('id', paymentId);
    if (pErr) throw pErr;

    // 2. Update order status → 'waiting_mitra'
    const { error: oErr } = await adminClient
      .from('orders')
      .update({ status: 'waiting_mitra' })
      .eq('id', orderId);
    if (oErr) throw oErr;

    // 3. Log to audit trail
    await adminClient.from('admin_activity_log').insert({
      admin_id: user.id,
      action: 'verify_payment',
      resource_type: 'payment',
      resource_id: paymentId,
      changes: { status: 'verified', verified_by: user.id }
    });

    // 4. Log to order timeline
    await adminClient.from('order_timeline').insert({
      order_id: orderId,
      event_type: 'payment_verified',
      status_before: 'pending_payment',
      status_after: 'waiting_mitra',
      triggered_by: 'admin',
      created_by: user.id
    });

    // 🔐 Send WhatsApp Notifications (Client & Mitra)
    try {
      const { data: orderDetails } = await adminClient
        .from('orders')
        .select(`
          order_number,
          patient_name,
          total_amount,
          hospitals:hospital_id (name),
          users:user_id (full_name, phone),
          mitras:mitra_id (
            users:user_id (full_name, phone)
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderDetails) {
        const clientProfile = orderDetails.users ? (Array.isArray(orderDetails.users) ? orderDetails.users[0] : orderDetails.users) : null;
        const rawMitra = orderDetails.mitras ? (Array.isArray(orderDetails.mitras) ? orderDetails.mitras[0] : orderDetails.mitras) : null;
        const mitraProfile = rawMitra?.users ? (Array.isArray(rawMitra.users) ? rawMitra.users[0] : rawMitra.users) : null;
        const rawHospital: any = orderDetails.hospitals;
        const hospitalName = (Array.isArray(rawHospital) ? rawHospital[0]?.name : rawHospital?.name) || 'Rumah Sakit Terkait';

        const { sendWhatsAppNotification } = await import('@/utils/whatsapp');

        // 1. Notify Client (User)
        if (clientProfile?.phone) {
          const clientMessage = `💳 *PEMBAYARAN DIVERIFIKASI* 💳\n\nHalo *${clientProfile.full_name}*,\nPembayaran Anda untuk pesanan *#${orderDetails.order_number}* sebesar Rp ${orderDetails.total_amount?.toLocaleString('id-ID')} telah berhasil diverifikasi.\n\nMitra pendamping Anda *${mitraProfile?.full_name || 'Mitra Penjaga Hati'}* sedang bersiap-siap. Terima kasih telah mempercayai kami!`;
          await sendWhatsAppNotification(clientProfile.phone, clientMessage);
        }

        // 2. Notify Mitra
        if (mitraProfile?.phone) {
          const mitraMessage = `✅ *PEMBAYARAN TUGAS TERKONFIRMASI* ✅\n\nHalo *${mitraProfile.full_name}*,\nTugas pendampingan *#${orderDetails.order_number}* untuk pasien *${orderDetails.patient_name}* di *${hospitalName}* telah dibayar oleh klien.\n\nSilakan bersiap-siap dan berangkat menuju lokasi sesuai jadwal. Terima kasih!`;
          await sendWhatsAppNotification(mitraProfile.phone, mitraMessage);
        }
      }
    } catch (notifyErr) {
      console.error('WhatsApp notification error during payment verification:', notifyErr);
    }

    revalidatePath('/admin/verifikasi');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/pesanan');
    return { success: true };
  } catch (err: any) {
    console.error("Verify Payment Error:", err);
    return { success: false, error: err.message || "Gagal memverifikasi pembayaran." };
  }
}

export async function rejectPaymentAction(paymentId: string, rejectionReason: string, refundUser: boolean = false) {
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

    if (!['admin', 'owner', 'keuangan'].includes(adminUser?.role)) {
      return { success: false, error: "Unauthorized" };
    }

    if (!rejectionReason || rejectionReason.length < 5) {
      return { success: false, error: "Reason required (min 5 characters)" };
    }

    // Get payment and order info
    const { data: payment, error: paymentError } = await adminClient
      .from('payments')
      .select('id, order_id, amount, status')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment not found');
    }

    // 1. Update payment: status = 'rejected'
    const { error: updatePaymentError } = await adminClient
      .from('payments')
      .update({
        status: 'rejected',
        verified_by_admin_id: user.id
      })
      .eq('id', paymentId);

    if (updatePaymentError) throw updatePaymentError;

    // 2. Reset order status back to pending_payment (allow retry)
    const { error: updateOrderError } = await adminClient
      .from('orders')
      .update({ status: 'pending_payment' })
      .eq('id', payment.order_id);

    if (updateOrderError) throw updateOrderError;

    // 3. Log to audit trail
    await adminClient.from('admin_activity_log').insert({
      admin_id: user.id,
      action: 'reject_payment',
      resource_type: 'payment',
      resource_id: paymentId,
      changes: {
        rejection_reason: rejectionReason,
        refund_requested: refundUser
      }
    });

    // 4. Log to order timeline
    await adminClient.from('order_timeline').insert({
      order_id: payment.order_id,
      event_type: 'payment_rejected',
      status_before: 'pending_payment',
      status_after: 'pending_payment',
      details: { rejection_reason: rejectionReason },
      triggered_by: 'admin',
      created_by: user.id
    });

    revalidatePath('/admin/verifikasi');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/pesanan');

    return { success: true };
  } catch (err: any) {
    console.error("Reject Payment Error:", err);
    return { success: false, error: err.message || "Gagal menolak pembayaran." };
  }
}
