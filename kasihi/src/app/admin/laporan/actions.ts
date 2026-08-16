"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function getLaporanStatsAction(period: '7days' | 'this_month' | 'last_month' = '7days') {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const adminClient = createAdminClient();

    // Verify admin role
    const { data: adminUser, error: roleError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['admin', 'owner', 'keuangan'].includes(adminUser?.role)) {
      return { success: false, error: "Unauthorized" };
    }

    // In a real large-scale app, we would use an RPC call or view to calculate this.
    // However, since we might not be able to create an RPC via Supabase CLI right now,
    // we'll do the counting on the server side which is still better than sending
    // all rows to the client browser.
    
    // Fetch total orders and statuses
    const { data: orders, error: ordersError } = await adminClient
      .from("orders")
      .select("status, created_at, total_amount");

    if (ordersError) throw ordersError;

    // Fetch verified payments for total revenue
    const { data: payments, error: paymentsError } = await adminClient
      .from("payments")
      .select("amount, created_at")
      .eq("status", "verified");

    if (paymentsError) throw paymentsError;

    // Generate date range based on period
    const chartData = [];
    const today = new Date();
    let startDate: Date;
    let daysToGenerate: number;

    if (period === '7days') {
      daysToGenerate = 7;
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
    } else if (period === 'this_month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      daysToGenerate = today.getDate(); // Up to today
    } else if (period === 'last_month') {
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      daysToGenerate = lastDayOfLastMonth.getDate();
    } else {
      daysToGenerate = 7;
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
    }
    
    // Create chart data array
    for (let i = 0; i < daysToGenerate; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      
      const dayOrders = orders.filter(o => o.created_at?.startsWith(dateStr));
      const dayPayments = payments.filter(p => p.created_at?.startsWith(dateStr));
      
      const dayRevenue = dayPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      // Formatting date label based on period
      let label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      if (period === 'this_month' || period === 'last_month') {
         label = d.getDate().toString(); // Just numbers for monthly to save space
      }
      
      chartData.push({
        date: label,
        pesanan: dayOrders.length,
        pendapatan: dayRevenue,
      });
    }

    // Filter overall stats by period as well
    const endOfPeriod = new Date(startDate);
    endOfPeriod.setDate(startDate.getDate() + daysToGenerate);
    
    const isWithinPeriod = (dateStr: string) => {
       const d = new Date(dateStr);
       return d >= startDate && d < endOfPeriod;
    };

    const filteredOrders = orders.filter(o => o.created_at && isWithinPeriod(o.created_at));
    const filteredPayments = payments.filter(p => p.created_at && isWithinPeriod(p.created_at));

    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(o => o.status === "completed").length;
    const cancelledOrders = filteredOrders.filter(o => o.status === "cancelled").length;
    const totalRevenue = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      success: true,
      data: {
        stats: {
          totalOrders,
          completedOrders,
          cancelledOrders,
          totalRevenue,
        },
        chartData
      }
    };
  } catch (error: any) {
    console.error("Failed to fetch laporan stats:", error);
    return { success: false, error: error.message };
  }
}
