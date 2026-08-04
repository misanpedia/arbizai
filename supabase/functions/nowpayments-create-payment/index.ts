import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NOWPAY_API = "https://api.nowpayments.io/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) throw new Error("Unauthorized");

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    if (!amount || amount <= 0) throw new Error("Invalid amount");

    const { data: cfg } = await supabase
      .from("payment_gateway_config")
      .select("*")
      .eq("provider", "nowpayments")
      .maybeSingle();

    if (!cfg?.is_enabled) throw new Error("NOWPayments is not enabled");
    if (!cfg.api_key) throw new Error("NOWPayments API key is not configured");
    if (amount < Number(cfg.min_amount)) throw new Error(`Minimum deposit is $${cfg.min_amount}`);

    // Create pending transaction first so we can use its id as order_id
    const { data: tx, error: txErr } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "deposit",
        amount,
        currency: "USDT",
        status: "pending",
        network: "BEP20",
        description: `NOWPayments deposit $${amount.toFixed(2)} USDT`,
      })
      .select()
      .single();
    if (txErr || !tx) throw new Error("Failed to create transaction");

    const res = await fetch(`${NOWPAY_API}/invoice`, {
      method: "POST",
      headers: { "x-api-key": cfg.api_key, "Content-Type": "application/json" },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: "usd",
        pay_currency: cfg.pay_currency || "usdtbsc",
        order_id: tx.id,
        order_description: `Deposit $${amount.toFixed(2)} USDT`,
        ipn_callback_url: `${supabaseUrl}/functions/v1/nowpayments-ipn`,
        success_url: body.success_url || null,
        cancel_url: body.cancel_url || null,
      }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.invoice_url) {
      await supabase.from("transactions").update({ status: "rejected", description: `NOWPayments error: ${payload?.message || res.status}` }).eq("id", tx.id);
      throw new Error(payload?.message || `NOWPayments API error [${res.status}]`);
    }

    await supabase.from("transactions").update({ tx_hash: String(payload.id) }).eq("id", tx.id);

    return new Response(
      JSON.stringify({ success: true, invoice_url: payload.invoice_url, invoice_id: payload.id, transaction_id: tx.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("nowpayments-create-payment error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});