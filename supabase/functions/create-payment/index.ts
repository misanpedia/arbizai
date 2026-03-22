import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RAZCRYPTO_API = "https://razcryptogateway.com/api/v2";

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

    const { amount, chain = "BSC", currency = "USDT" } = await req.json();
    if (!amount || amount <= 0) throw new Error("Invalid amount");

    const RAZ_PUBLIC_KEY = Deno.env.get("RAZ_PUBLIC_KEY");
    if (!RAZ_PUBLIC_KEY) throw new Error("RazCrypto Public Key not configured");

    // Create RazCrypto payment
    const response = await fetch(`${RAZCRYPTO_API}/payments/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Public-Key-Id": RAZ_PUBLIC_KEY,
      },
      body: JSON.stringify({
        amount,
        chain,
        currency,
        email: user.email || "",
        callback_url: `${supabaseUrl}/functions/v1/razcrypto-webhook`,
        return_json: "true",
        custom_data: {
          user_id: user.id,
          timestamp: Date.now(),
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`RazCrypto API error [${response.status}]: ${errBody}`);
    }

    const data = await response.json();

    if (data.status !== "success") {
      throw new Error(data.message || "Failed to create payment");
    }

    // Create pending transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "deposit",
      amount: data.amount || amount,
      currency: currency,
      status: "pending",
      description: `Deposit ${amount} ${currency} via RazCrypto (${chain})`,
      tx_hash: data.payment_id || null,
      network: chain,
    });

    return new Response(
      JSON.stringify({
        checkout_url: data.checkout_page || data.hosted_page || data.payment_page,
        payment_id: data.payment_id,
        amount: data.amount,
        address: data.address,
        qr_code: data.qr_code || data.qr_url,
        expiry_minutes: data.expiry_minutes,
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
