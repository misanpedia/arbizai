import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OXAPAY_API = "https://api.oxapay.com/v1";

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

    const OXAPAY_KEY = Deno.env.get("OXAPAY_MERCHANT_KEY");
    if (!OXAPAY_KEY) throw new Error("OxaPay Merchant Key not configured");

    const { amount, currency = "USDT", network = "BSC" } = await req.json();
    if (!amount || amount <= 0) throw new Error("Invalid amount");

    // Create OxaPay invoice
    const response = await fetch(`${OXAPAY_API}/payment/invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "merchant_api_key": OXAPAY_KEY,
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        currency: currency,
        network: network,
        callback_url: `${supabaseUrl}/functions/v1/oxapay-webhook`,
        description: `Deposit ${amount} ${currency} for user`,
        order_id: `${user.id}_${Date.now()}`,
        auto_withdrawal: 0,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OxaPay API error [${response.status}]: ${errBody}`);
    }

    const rawData = await response.json();
    console.log("OxaPay invoice response:", JSON.stringify(rawData));

    const payload = rawData.data || rawData;

    if (!payload.track_id) {
      throw new Error(rawData.message || "Failed to create payment invoice");
    }

    // Create pending transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "deposit",
      amount: parseFloat(amount),
      currency: currency,
      status: "pending",
      description: `Deposit ${amount} ${currency} via OxaPay (${network})`,
      tx_hash: payload.track_id,
      network: network,
    });

    return new Response(
      JSON.stringify({
        track_id: payload.track_id,
        payment_url: payload.payment_url,
        address: payload.address,
        expired_at: payload.expired_at,
      }),
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
