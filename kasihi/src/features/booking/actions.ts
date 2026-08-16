'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { BookingInput, BookingSchema } from './schema'

export async function submitBookingAction(
  formData: BookingInput,
  paymentProofUrl: string | null
) {
  try {
    const validatedData = BookingSchema.parse(formData);
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Silakan login kembali.' }
    }

    const adminClient = createAdminClient()

    const { data: existingUser } = await adminClient
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingUser) {
      const { error: insertUserError } = await adminClient
        .from('users')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          phone: user.user_metadata?.phone || user.phone || '-',
          role: user.user_metadata?.role || 'user'
        })

      if (insertUserError) {
        return { success: false, error: 'Gagal memvalidasi akun pengguna.' }
      }
    }

    const { data: packageData, error: pkgError } = await adminClient
      .from('service_packages')
      .select('base_price, duration_hours')
      .eq('id', validatedData.packageId)
      .single()

    if (pkgError || !packageData) {
      return { success: false, error: 'Paket layanan tidak ditemukan.' }
    }

    const totalAmount = packageData.base_price;
    const orderNumber = `KSH-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;

    const conditionParts = [
      validatedData.diagnosis,
      validatedData.roomNumber ? `Ruangan: ${validatedData.roomNumber}` : '',
      validatedData.specialNotes ? `Catatan: ${validatedData.specialNotes}` : '',
      validatedData.startDate ? `Mulai: ${validatedData.startDate}` : '',
      validatedData.startTime ? `Jam: ${validatedData.startTime}` : '',
    ].filter(Boolean).join(' | ');

    const { data: orderData, error: orderError } = await adminClient
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        mitra_id: validatedData.mitraId,
        hospital_id: validatedData.hospitalId,
        package_id: validatedData.packageId,
        patient_name: validatedData.patientName,
        patient_age: validatedData.patientAge,
        patient_condition: conditionParts,
        status: 'pending_payment',
        total_amount: totalAmount,
        mitra_earnings: totalAmount * 0.85,
        start_date: validatedData.startDate,
        start_time: validatedData.startTime,
        duration_hours: validatedData.durationHours,
        room_number: validatedData.roomNumber || null,
        special_notes: validatedData.specialNotes || null
      })
      .select()
      .single()

    if (orderError) {
      return { success: false, error: 'Gagal membuat pesanan: ' + orderError.message }
    }

    const { error: paymentError } = await adminClient
      .from('payments')
      .insert({
        order_id: orderData.id,
        amount: totalAmount,
        proof_of_transfer_url: paymentProofUrl,
        status: 'pending'
      });

    if (paymentError) {
      return { success: false, error: 'Gagal menyimpan pembayaran: ' + paymentError.message }
    }

    // Send WhatsApp Notifications (CS & Mitra)
    try {
      const { data: hospitalData } = await adminClient
        .from('hospitals')
        .select('name')
        .eq('id', validatedData.hospitalId)
        .single();
      
      const { data: rawMitraData } = await adminClient
        .from('mitras')
        .select('users:user_id (full_name, phone)')
        .eq('id', validatedData.mitraId)
        .single();
      
      const mitraProfile = rawMitraData?.users ? (Array.isArray(rawMitraData.users) ? rawMitraData.users[0] : rawMitraData.users) : null;
      const hospitalName = hospitalData?.name || 'Rumah Sakit Terkait';
      const clientName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Klien Kasihi';
      const clientPhone = user.user_metadata?.phone || user.phone || '-';

      const csMessage = `🔔 *PESANAN BARU KASIHI* 🔔\n\nHalo CS Kasihi,\nAda pesanan pendampingan baru:\n\n*No. Pesanan:* ${orderNumber}\n*Pasien:* ${validatedData.patientName} (${validatedData.patientAge} th)\n*RS:* ${hospitalName}\n*Klien:* ${clientName} (${clientPhone})\n*Total:* Rp ${totalAmount.toLocaleString('id-ID')}\n\nSilakan periksa dashboard Admin.`;
      
      const { sendWhatsAppNotification, WHATSAPP_CONTACTS } = await import('@/utils/whatsapp');
      await sendWhatsAppNotification(WHATSAPP_CONTACTS.CS_NUMBERS, csMessage);

      if (mitraProfile?.phone) {
        const mitraMessage = `👋 *TAWARAN PENDAMPINGAN KASIHI* 👋\n\nHalo *${mitraProfile.full_name}*,\nAnda menerima pesanan pendampingan baru:\n\n*No. Pesanan:* ${orderNumber}\n*Pasien:* ${validatedData.patientName} (${validatedData.patientAge} th)\n*RS:* ${hospitalName}\n*Waktu:* ${validatedData.startDate} jam ${validatedData.startTime}\n\nSilakan buka Portal Mitra Kasihi untuk merespon tugas ini.`;
        await sendWhatsAppNotification(mitraProfile.phone, mitraMessage);
      }
    } catch (notifyErr) {
      console.error('WhatsApp notification error:', notifyErr);
    }

    revalidatePath('/user')
    revalidatePath('/admin')
    return { success: true, orderId: orderData.id }

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { success: false, error: 'Validasi data gagal: ' + error.errors.map((e: any) => e.message).join(', ') };
    }
    return { success: false, error: error?.message || 'Terjadi kesalahan sistem saat memproses pesanan.' }
  }
}
