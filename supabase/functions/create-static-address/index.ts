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

    const { network = "BSC", currency = "USDT" } = await req.json();

    // Check if user already has a static address for this network
    const { data: existing } = await supabase
      .from("user_static_addresses")
      .select("*")
      .eq("user_id", user.id)
      .eq("network", network)
      .eq("currency", currency)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          address: existing.address,
          network: existing.network,
          currency: existing.currency,
          track_id: existing.track_id,
          already_exists: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create static address via OxaPay
    const response = await fetch(`${OXAPAY_API}/payment/static-address`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "merchant_api_key": OXAPAY_KEY,
      },
      body: JSON.stringify({
        network: network,
        currency: currency,
        callback_url: `${supabaseUrl}/functions/v1/oxapay-webhook`,
        auto_withdrawal: 0,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OxaPay API error [${response.status}]: ${errBody}`);
    }

    const data = await response.json();
    console.log("OxaPay static address response:", JSON.stringify(data));

    if (!data.address) {
      throw new Error(data.message || "Failed to create static address");
    }

    // Save the static address
    await supabase.from("user_static_addresses").insert({
      user_id: user.id,
      address: data.address,
      network: network,
      currency: currency,
      track_id: data.track_id || null,
    });

    return new Response(
      JSON.stringify({
        address: data.address,
        network: data.network || network,
        currency: currency,
        track_id: data.track_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Create static address error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
