import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) throw new Error("Unauthorized");

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { transaction_id, action } = await req.json();
    if (!transaction_id || !["approved", "rejected"].includes(action)) {
      throw new Error("Invalid request");
    }

    const { data: tx } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transaction_id)
      .eq("type", "withdraw")
      .eq("status", "pending")
      .maybeSingle();
    if (!tx) throw new Error("Withdrawal not found or already processed");

    const netAmount = Number(tx.amount);
    const fee = Number(tx.fee || 0);
    const grossAmount = netAmount + fee;

    if (action === "rejected") {
      // Refund the full debited amount back to wallet
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", tx.user_id)
        .eq("currency", tx.currency)
        .maybeSingle();
      if (wallet) {
        await supabase
          .from("wallets")
          .update({ balance: Number(wallet.balance) + grossAmount })
          .eq("id", wallet.id);
      } else {
        await supabase.from("wallets").insert({
          user_id: tx.user_id,
          currency: tx.currency,
          balance: grossAmount,
        });
      }

      await supabase.from("transactions").update({ status: "rejected" }).eq("id", tx.id);

      await supabase.from("notifications").insert({
        user_id: tx.user_id,
        title: "❌ Withdrawal Rejected",
        message: `Your withdrawal of $${netAmount.toFixed(2)} ${tx.currency} was rejected. $${grossAmount.toFixed(2)} has been refunded to your balance.`,
        type: "error",
      });
    } else {
      // Approve: balance was already debited at request time. Just mark approved.
      await supabase.from("transactions").update({ status: "approved" }).eq("id", tx.id);

      await supabase.from("notifications").insert({
        user_id: tx.user_id,
        title: "✅ Withdrawal Approved",
        message: `Your withdrawal of $${netAmount.toFixed(2)} ${tx.currency} has been approved and is being processed.`,
        type: "success",
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("process-withdrawal error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});