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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    const { amount, currency = "USDT", wallet_address, withdraw_type = "profit", network = "BEP20" } = await req.json();

    if (!amount || amount <= 0) throw new Error("Invalid amount");
    if (!wallet_address) throw new Error("Wallet address required");

    // Get settings
    const { data: settingsData } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["withdrawal_fee_rate", "withdrawal_min_amount", "withdrawal_max_amount", "withdrawal_enabled", "withdrawal_cooldown_hours", "withdrawal_principal_penalty_rate"]);

    const settings: Record<string, any> = {};
    settingsData?.forEach((s: any) => { settings[s.key] = s.value; });

    if (settings.withdrawal_enabled === false) {
      throw new Error("Withdrawals are currently disabled");
    }

    const feeRate = Number(settings.withdrawal_fee_rate || 0.05);
    const minAmount = Number(settings.withdrawal_min_amount || 10);
    const maxAmount = Number(settings.withdrawal_max_amount || 50000);

    if (amount < minAmount) throw new Error(`Minimum withdrawal is $${minAmount}`);
    if (amount > maxAmount) throw new Error(`Maximum withdrawal is $${maxAmount}`);

    // Check wallet balance
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .eq("currency", currency)
      .maybeSingle();

    if (!wallet || Number(wallet.balance) < amount) {
      throw new Error("Insufficient balance");
    }

    // Calculate fees
    const fee = amount * feeRate;
    let penalty = 0;

    if (withdraw_type === "principal") {
      const penaltyRate = Number(settings.withdrawal_principal_penalty_rate || 0.10);
      penalty = amount * penaltyRate;
    }

    const totalDeduction = fee + penalty;
    const netAmount = amount - totalDeduction;

    // Debit wallet
    await supabase
      .from("wallets")
      .update({ balance: Number(wallet.balance) - amount })
      .eq("user_id", user.id)
      .eq("currency", currency);

    // Create transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "withdraw",
      amount: netAmount,
      fee,
      currency,
      wallet_address,
      network,
      status: "pending",
      description: `Withdraw ${withdraw_type} $${amount} (fee: $${fee.toFixed(2)}, penalty: $${penalty.toFixed(2)})`,
    });

    // Send notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "📤 Withdrawal Submitted",
      message: `Your withdrawal of $${netAmount.toFixed(2)} ${currency} has been submitted and is pending approval.`,
      type: "info",
    });

    return new Response(
      JSON.stringify({ success: true, netAmount, fee, penalty }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Withdraw error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});