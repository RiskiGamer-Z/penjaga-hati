'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Apply seed test data directly to database
 * Inserts 5 customers, 5 mitra, 5 orders, and 5 payments
 */
export async function applySeedData() {
  try {
    console.log('=== Applying Test Data ===');
    const adminClient = createAdminClient();

    // Test data
    const testCustomers = [
      { id: '11111111-1111-1111-1111-111111111111', email: 'budi@test.com', full_name: 'Budi Santoso', phone: '081234567890' },
      { id: '22222222-2222-2222-2222-222222222222', email: 'siti@test.com', full_name: 'Siti Nurhaliza', phone: '081234567891' },
      { id: '33333333-3333-3333-3333-333333333333', email: 'ahmad@test.com', full_name: 'Ahmad Hidayat', phone: '081234567892' },
      { id: '44444444-4444-4444-4444-444444444444', email: 'rina@test.com', full_name: 'Rina Wijaya', phone: '081234567893' },
      { id: '55555555-5555-5555-5555-555555555555', email: 'yudi@test.com', full_name: 'Yudi Pratama', phone: '081234567894' }
    ];

    const testMitra = [
      { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', email: 'mitra1@test.com', full_name: 'Dr. Bambang Setiawan', phone: '081334567890', bio: 'Perawat profesional dengan 8 tahun pengalaman', exp: 8 },
      { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', email: 'mitra2@test.com', full_name: 'Ibu Nurdin Pratiwi', phone: '081334567891', bio: 'Ahli dalam perawatan ibu hamil & bayi', exp: 6 },
      { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', email: 'mitra3@test.com', full_name: 'Pak Suwarman Handoko', phone: '081334567892', bio: 'Spesialisasi perawatan lansia & rehabilitasi', exp: 10 },
      { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', email: 'mitra4@test.com', full_name: 'Dewi Kusumawati', phone: '081334567893', bio: 'Companion sehat berbasis ilmu keperawatan', exp: 4 },
      { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', email: 'mitra5@test.com', full_name: 'Hendra Wijaya', phone: '081334567894', bio: 'Terapis kesehatan dengan sertifikasi internasional', exp: 7 }
    ];

    const hospitals = [
      { name: 'Rumah Sakit Medistra', city: 'Jakarta Selatan', address: 'Jl. Gatot Subroto, Jakarta' },
      { name: 'RSUPN Cipto Mangunkusumo', city: 'Jakarta Pusat', address: 'Jl. Diponegoro, Jakarta' },
      { name: 'Rumah Sakit Advent', city: 'Bandung', address: 'Jl. Asia Afrika, Bandung' },
      { name: 'Rumah Sakit Karya Medika', city: 'Bogor', address: 'Jl. Ahmad Yani, Bogor' },
      { name: 'Rumah Sakit Pondok Gede', city: 'Tangerang', address: 'Jl. Melati, Tangerang' }
    ];

    // 1. Insert customers
    console.log('Inserting customers...');
    const { error: customerError } = await adminClient.from('users').upsert(
      testCustomers.map(c => ({
        id: c.id,
        email: c.email,
        full_name: c.full_name,
        phone: c.phone,
        role: 'user',
        is_active: true
      })),
      { onConflict: 'id' }
    );

    if (customerError) {
      console.error('Customer error:', customerError);
    } else {
      console.log('✓ Inserted 5 customers');
    }

    // 2. Insert mitra users
    console.log('Inserting mitra users...');
    const { error: mitraUserError } = await adminClient.from('users').upsert(
      testMitra.map(m => ({
        id: m.id,
        email: m.email,
        full_name: m.full_name,
        phone: m.phone,
        role: 'mitra',
        is_active: true
      })),
      { onConflict: 'id' }
    );

    if (mitraUserError) {
      console.error('Mitra user error:', mitraUserError);
    } else {
      console.log('✓ Inserted 5 mitra users');
    }

    // 3. Insert mitra profiles
    console.log('Inserting mitra profiles...');
    const { error: mitraProfileError } = await adminClient.from('mitras').upsert(
      testMitra.map((m, idx) => ({
        user_id: m.id,
        is_verified: true,
        bio: m.bio,
        experience: m.exp,
        rating: 4.5 + (Math.random() * 0.5),
        total_orders_completed: 20 + Math.floor(Math.random() * 40)
      })),
      { onConflict: 'user_id' }
    );

    if (mitraProfileError) {
      console.error('Mitra profile error:', mitraProfileError);
    } else {
      console.log('✓ Inserted 5 mitra profiles');
    }

    // 4. Insert hospitals
    console.log('Inserting hospitals...');
    const { data: hospitalData, error: hospitalError } = await adminClient.from('hospitals').upsert(
      hospitals.map(h => ({
        name: h.name,
        city: h.city,
        address: h.address,
        phone: '021-1234567'
      })),
      { onConflict: 'name' }
    ).select();

    if (hospitalError) {
      console.error('Hospital error:', hospitalError);
    } else {
      console.log('✓ Inserted/verified 5 hospitals');
    }

    // 5. Get packages for orders
    const { data: packages } = await adminClient
      .from('service_packages')
      .select('id, base_price')
      .limit(3);

    if (!packages || packages.length === 0) {
      throw new Error('No packages found');
    }

    // 6. Get hospitals for reference
    const { data: allHospitals } = await adminClient
      .from('hospitals')
      .select('id')
      .limit(5);

    const hospitalIds = allHospitals?.map(h => h.id) || [];
    const statuses = ['pending_payment', 'waiting_mitra', 'accepted', 'completed'];

    // 7. Insert orders - using CORRECT columns (no total_price, no created_at)
    console.log('Inserting orders...');
    const ordersToInsert = testCustomers.map((customer, idx) => ({
      order_number: `PH-${Date.now()}-${idx}`,
      user_id: customer.id,
      mitra_id: testMitra[idx]?.id,
      package_id: packages[idx % packages.length].id,
      hospital_id: hospitalIds[idx % hospitalIds.length],
      patient_name: `Pasien ${idx + 1}`,
      patient_age: 25 + (idx * 5),
      patient_condition: 'Pemulihan umum',
      status: statuses[idx % statuses.length]
    }));

    const { data: createdOrders, error: orderError } = await adminClient.from('orders').insert(ordersToInsert).select('id, user_id, status');

    if (orderError) {
      console.error('Order error:', orderError);
    } else {
      console.log('✓ Inserted 5 orders');
    }

    // 8. Create payments for each order
    if (createdOrders && createdOrders.length > 0) {
      console.log('Inserting payments...');
      const paymentsToInsert = createdOrders.map((order, idx) => ({
        order_id: order.id,
        amount: packages[idx % packages.length].base_price,
        status: order.status === 'pending_payment' ? 'pending' : 'completed',
        proof_of_transfer_url: null
      }));

      const { error: paymentError } = await adminClient.from('payments').insert(paymentsToInsert);

      if (paymentError) {
        console.error('Payment error:', paymentError);
      } else {
        console.log('✓ Inserted 5 payments');
      }
    }

    revalidatePath('/admin/pesanan');
    revalidatePath('/admin/pengguna');
    revalidatePath('/admin/mitra');

    console.log('=== Test Data Applied Successfully ===');
    return {
      success: true,
      message: '✓ Test data successfully applied: 5 customers, 5 mitra, 5 orders, 5 payments'
    };
  } catch (error: any) {
    console.error('=== Error Applying Test Data ===', error);
    return {
      success: false,
      error: error.message || 'Failed to apply test data'
    };
  }
}

