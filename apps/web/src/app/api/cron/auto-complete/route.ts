import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { checkAndAutoCompleteOrders } from '@/app/admin/pesanan/actions';

export async function GET(request: Request) {
  try {
    // Basic security check to ensure this is called by Vercel Cron
    // In production, Vercel sets the CRON_SECRET which you should check
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const adminClient = createAdminClient();
    await checkAndAutoCompleteOrders(adminClient);

    return NextResponse.json({ success: true, message: 'Auto-complete executed successfully' });
  } catch (error: any) {
    console.error('Cron auto-complete error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
