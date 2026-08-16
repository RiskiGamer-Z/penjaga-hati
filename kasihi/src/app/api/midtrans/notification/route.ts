import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import crypto from 'crypto'

/**
 * POST /api/midtrans/notification
 * Webhook handler for Midtrans payment notifications.
 * Midtrans will POST here when a transaction status changes.
 * 
 * Configure the webhook URL in Midtrans Dashboard:
 * Settings > Configuration > Payment Notification URL
 * URL: https://yourdomain.com/api/midtrans/notification
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      order_id: midtransOrderId,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = body

    // 🔐 Verify signature to prevent spoofing
    const serverKey = process.env.MIDTRANS_SERVER_KEY || ''
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${midtransOrderId}${status_code}${gross_amount}${serverKey}`)
      .digest('hex')

    if (signature_key !== expectedSignature) {
      console.error('Invalid Midtrans signature!')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Find the payment by midtrans_order_id
    const { data: payment, error: paymentError } = await adminClient
      .from('payments')
      .select('id, order_id, status')
      .eq('midtrans_order_id', midtransOrderId)
      .single()

    if (paymentError || !payment) {
      console.error('Payment not found for midtrans_order_id:', midtransOrderId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Determine new payment status based on Midtrans notification
    let newPaymentStatus = payment.status
    let newOrderStatus: string | null = null

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept' || !fraud_status) {
        newPaymentStatus = 'verified'
        newOrderStatus = 'waiting_mitra' // Order is paid, now waiting for mitra
      }
    } else if (transaction_status === 'pending') {
      newPaymentStatus = 'pending'
    } else if (['cancel', 'deny', 'expire', 'failure'].includes(transaction_status)) {
      newPaymentStatus = 'cancelled'
      newOrderStatus = 'cancelled'
    }

    // Update payment status
    await adminClient
      .from('payments')
      .update({
        status: newPaymentStatus,
        payment_type: payment_type || null,
        verified_at: newPaymentStatus === 'verified' ? new Date().toISOString() : null,
      })
      .eq('id', payment.id)

    // Update order status if needed
    if (newOrderStatus && payment.order_id) {
      await adminClient
        .from('orders')
        .update({
          status: newOrderStatus,
        })
        .eq('id', payment.order_id)
    }

    console.log(`✅ Midtrans webhook processed: ${midtransOrderId} → ${newPaymentStatus}`)

    return NextResponse.json({ success: true, status: newPaymentStatus })
  } catch (err: any) {
    console.error('Midtrans Notification Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
