import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    const { amount, currency = "usd" } = await req.json();
    if (!amount || amount <= 0) throw new Error("Invalid amount");

    const NOWPAYMENTS_API_KEY = Deno.env.get("NOWPAYMENTS_API_KEY");
    if (!NOWPAYMENTS_API_KEY) throw new Error("NOWPayments API key not configured");

    // Create NOWPayments invoice
    const response = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: currency,
        order_id: `deposit_${user.id}_${Date.now()}`,
        order_description: `Deposit $${amount} USDT`,
        ipn_callback_url: `${supabaseUrl}/functions/v1/nowpayments-webhook`,
        success_url: `${req.headers.get("origin") || supabaseUrl}/dashboard`,
        cancel_url: `${req.headers.get("origin") || supabaseUrl}/deposit`,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`NOWPayments API error [${response.status}]: ${errBody}`);
    }

    const data = await response.json();

    // Create pending transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "deposit",
      amount,
      currency: "USDT",
      status: "pending",
      description: `Auto deposit $${amount} via NOWPayments`,
      tx_hash: data.id?.toString() || null,
    });

    return new Response(
      JSON.stringify({ invoice_url: data.invoice_url, id: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Create payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});