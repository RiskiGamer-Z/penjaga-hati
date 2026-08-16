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
      .select('base_price, price_per_unit, duration_hours')
      .eq('id', validatedData.packageId)
      .single()

    if (pkgError || !packageData) {
      return { success: false, error: 'Paket layanan tidak ditemukan.' }
    }

    // Harga: paket lama pakai base_price, paket tier pakai price_per_unit
    const totalAmount = Number(packageData.base_price ?? packageData.price_per_unit ?? 0);
    if (totalAmount <= 0) {
      return { success: false, error: 'Harga paket tidak valid. Silakan pilih paket lain.' }
    }
    const orderNumber = `PGH-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;

    // Gabungkan diagnosa + info tambahan sebagai kondisi pasien
    const patientCondition = [
      validatedData.diagnosis,
      validatedData.roomNumber ? `Ruangan: ${validatedData.roomNumber}` : '',
    ].filter(Boolean).join(' | ');

    // Catatan tambahan pesanan (durasi, catatan khusus)
    const orderNotes = [
      validatedData.durationHours ? `Durasi: ${validatedData.durationHours} jam` : '',
      validatedData.specialNotes ? `Catatan: ${validatedData.specialNotes}` : '',
    ].filter(Boolean).join(' | ') || null;

    // Kolom orders yang benar memakai start_datetime (timestamptz)
    const startDatetime = validatedData.startDate && validatedData.startTime
      ? `${validatedData.startDate}T${validatedData.startTime}:00`
      : validatedData.startDate
        ? `${validatedData.startDate}T00:00:00`
        : null;

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
        patient_condition: patientCondition,
        status: 'pending_payment',
        total_amount: totalAmount,
        mitra_earnings: totalAmount * 0.85,
        start_datetime: startDatetime,
        order_notes: orderNotes
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
      const clientName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Klien Penjaga Hati';
      const clientPhone = user.user_metadata?.phone || user.phone || '-';

      const csMessage = `🔔 *PESANAN BARU MASUK* 🔔\n\nHalo Admin Penjaga Hati,\nAda pesanan pendampingan baru:\n\n*No. Pesanan:* ${orderNumber}\n*Pasien:* ${validatedData.patientName} (${validatedData.patientAge} th)\n*RS:* ${hospitalName}\n*Klien:* ${clientName} (${clientPhone})\n*Total:* Rp ${totalAmount.toLocaleString('id-ID')}\n\nSilakan periksa dashboard Admin.`;
      
      const { sendWhatsAppNotification, WHATSAPP_CONTACTS } = await import('@/utils/whatsapp');
      await sendWhatsAppNotification(WHATSAPP_CONTACTS.CS_NUMBERS, csMessage);

      if (mitraProfile?.phone) {
        const mitraMessage = `👋 *TAWARAN TUGAS PENDAMPINGAN* 👋\n\nHalo *${mitraProfile.full_name}*,\nAnda menerima pesanan pendampingan baru:\n\n*No. Pesanan:* ${orderNumber}\n*Pasien:* ${validatedData.patientName} (${validatedData.patientAge} th)\n*RS:* ${hospitalName}\n*Waktu:* ${validatedData.startDate} jam ${validatedData.startTime}\n\nSilakan buka Portal Mitra Penjaga Hati untuk merespon tugas ini.`;
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
