import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
// @ts-ignore
import midtransClient from 'midtrans-client'

/**
 * POST /api/midtrans/create-token
 * Creates a Midtrans Snap transaction token for an order.
 * Called when user wants to pay for a booking.
 * Body: { orderId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Fetch order details with user & package info
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select(`
        id,
        user_id,
        status,
        service_packages:package_id (id, name, base_price),
        users:user_id (full_name, email, phone)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
    }

    // Only the order owner can pay
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const pkg = Array.isArray(order.service_packages) ? order.service_packages[0] : order.service_packages
    const userData = Array.isArray(order.users) ? order.users[0] : order.users

    if (!pkg?.base_price) {
      return NextResponse.json({ error: 'Harga paket tidak ditemukan' }, { status: 400 })
    }

    // Init Midtrans Snap
    const snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    })

    const midtransOrderId = `PH-${orderId.slice(0, 8).toUpperCase()}-${Date.now()}`
    const grossAmount = Math.round(Number(pkg.base_price))

    const parameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: userData?.full_name || 'Customer',
        email: userData?.email || user.email,
        phone: userData?.phone || '',
      },
      item_details: [
        {
          id: pkg.id,
          price: grossAmount,
          quantity: 1,
          name: `Layanan: ${pkg.name}`.substring(0, 50),
        },
      ],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${orderId}?payment=success`,
        error: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${orderId}?payment=error`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${orderId}?payment=pending`,
      },
    }

    const transaction = await snap.createTransaction(parameter)

    // Save snap_token & midtrans_order_id to payments table
    await adminClient
      .from('payments')
      .upsert({
        order_id: orderId,
        amount: grossAmount,
        status: 'pending',
        midtrans_order_id: midtransOrderId,
        snap_token: transaction.token,
        payment_url: transaction.redirect_url,
        created_at: new Date().toISOString(),
      }, { onConflict: 'order_id' })

    return NextResponse.json({
      success: true,
      snap_token: transaction.token,
      payment_url: transaction.redirect_url,
      midtrans_order_id: midtransOrderId,
    })
  } catch (err: any) {
    console.error('Midtrans Create Token Error:', err)
    return NextResponse.json(
      { error: err.message || 'Gagal membuat transaksi' },
      { status: 500 }
    )
  }
}
