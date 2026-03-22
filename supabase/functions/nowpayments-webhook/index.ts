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

    const body = await req.json();
    console.log("NOWPayments webhook received:", JSON.stringify(body));

    const { payment_status, order_id, actually_paid, pay_amount, payment_id } = body;

    if (!order_id || !payment_status) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract user_id from order_id format: deposit_{user_id}_{timestamp}
    const parts = order_id.split("_");
    if (parts.length < 3 || parts[0] !== "deposit") {
      return new Response(JSON.stringify({ error: "Invalid order_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = parts[1];

    if (payment_status === "finished" || payment_status === "confirmed") {
      const amount = actually_paid || pay_amount;

      // Find the pending transaction
      const { data: tx } = await supabase
        .from("transactions")
        .select("id, status")
        .eq("user_id", userId)
        .eq("type", "deposit")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tx && tx.status === "pending") {
        // Update transaction to completed
        await supabase
          .from("transactions")
          .update({
            status: "completed",
            tx_hash: payment_id?.toString(),
            description: `Auto deposit confirmed via NOWPayments`,
          })
          .eq("id", tx.id);

        // Credit wallet
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", userId)
          .eq("currency", "USDT")
          .maybeSingle();

        if (wallet) {
          await supabase
            .from("wallets")
            .update({ balance: Number(wallet.balance) + Number(amount) })
            .eq("user_id", userId)
            .eq("currency", "USDT");
        }

        // Send notification
        await supabase.from("notifications").insert({
          user_id: userId,
          title: "💰 Deposit Confirmed",
          message: `Your deposit of $${Number(amount).toFixed(2)} has been confirmed and credited to your wallet.`,
          type: "success",
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});