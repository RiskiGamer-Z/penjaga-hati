// test.ts
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: orders, error: oError } = await supabase.from("orders").select("status, created_at, total_price");
  console.log("Orders:", orders?.length, oError);
  
  const { data: payments, error: pError } = await supabase.from("payments").select("amount, created_at").eq("status", "verified");
  console.log("Payments:", payments?.length, pError);
}

test();
