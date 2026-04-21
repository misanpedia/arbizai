import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_REFERRAL_RATES = [5, 3, 2, 1, 0.5];

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

    // Check admin
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { transaction_id } = await req.json();
    if (!transaction_id) throw new Error("Missing transaction_id");

    const { data: tx } = await supabase.from("transactions").select("*").eq("id", transaction_id).eq("type", "deposit").eq("status", "pending").maybeSingle();
    if (!tx) throw new Error("Transaction not found or already processed");

    const depositAmount = Number(tx.amount);

    // Approve transaction
    await supabase.from("transactions").update({ status: "approved" }).eq("id", tx.id);

    // Credit wallet
    const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", tx.user_id).eq("currency", "USDT").maybeSingle();
    if (wallet) {
      await supabase.from("wallets").update({ balance: Number(wallet.balance) + depositAmount }).eq("id", wallet.id);
    } else {
      await supabase.from("wallets").insert({ user_id: tx.user_id, currency: "USDT", balance: depositAmount });
    }

    // Notification
    await supabase.from("notifications").insert({
      user_id: tx.user_id, title: "💰 Deposit Approved",
      message: `Your deposit of $${depositAmount.toFixed(2)} USDT has been approved.`, type: "success",
    });

    // Process 5-level referral commission from deposit
    const { data: ratesData } = await supabase.from("system_settings").select("value").eq("key", "referral_commission_rates").maybeSingle();
    const rates = (ratesData?.value && Array.isArray(ratesData.value)) ? (ratesData.value as number[]).map(Number) : DEFAULT_REFERRAL_RATES;

    const { data: profile } = await supabase.from("profiles").select("referred_by").eq("user_id", tx.user_id).maybeSingle();
    if (profile?.referred_by) {
      let currentCode = profile.referred_by;
      for (let level = 0; level < Math.min(rates.length, 5); level++) {
        const rate = rates[level];
        if (!rate || rate <= 0) continue;

        const { data: upline } = await supabase.from("profiles").select("user_id, referred_by").eq("referral_code", currentCode).maybeSingle();
        if (!upline) break;

        const commission = depositAmount * (rate / 100);

        await supabase.from("commissions").insert({
          user_id: upline.user_id, from_user_id: tx.user_id,
          amount: commission, level: level + 1, type: "referral",
          description: `L${level + 1} referral (${rate}%) from deposit $${depositAmount.toFixed(2)}`,
        });

        const { data: upWallet } = await supabase.from("wallets").select("balance").eq("user_id", upline.user_id).eq("currency", "USDT").maybeSingle();
        if (upWallet) {
          await supabase.from("wallets").update({ balance: Number(upWallet.balance) + commission }).eq("user_id", upline.user_id).eq("currency", "USDT");
        }

        currentCode = upline.referred_by || "";
        if (!currentCode) break;
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Approve deposit error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});