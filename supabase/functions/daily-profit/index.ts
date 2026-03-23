import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 20-level rebate rates (percentage of downline's daily profit)
const DEFAULT_REBATE_RATES: Record<number, number> = {
  1: 10,
  2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2,
  11: 1, 12: 1, 13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 18: 1, 19: 1, 20: 1,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split("T")[0];

    // Get all active investments with plan details
    const { data: investments, error: invError } = await supabase
      .from("investments")
      .select("id, user_id, amount, plan_id, auto_compound, investment_plans(daily_profit_min, daily_profit_max)")
      .eq("status", "active");

    if (invError) throw invError;

    let processed = 0;
    let totalDistributed = 0;

    // Get commission settings (overrides)
    const { data: settingsData } = await supabase
      .from("system_settings")
      .select("key, value")
      .like("key", "commission_l%");

    const commRates: Record<number, number> = { ...DEFAULT_REBATE_RATES };
    settingsData?.forEach((s: any) => {
      const level = parseInt(s.key.replace("commission_l", ""));
      const val = typeof s.value === "string" ? parseFloat(s.value.replace(/"/g, "")) : Number(s.value);
      if (!isNaN(level) && !isNaN(val)) commRates[level] = val;
    });

    for (const inv of investments || []) {
      const plan = (inv as any).investment_plans;
      if (!plan) continue;

      // Check if profit already generated today for this investment
      const { data: existing } = await supabase
        .from("profits")
        .select("id")
        .eq("investment_id", inv.id)
        .eq("profit_date", today)
        .maybeSingle();

      if (existing) continue;

      // Random daily rate between min and max
      const minRate = Number(plan.daily_profit_min) / 100;
      const maxRate = Number(plan.daily_profit_max) / 100;
      const rate = minRate + Math.random() * (maxRate - minRate);
      const profitAmount = Number(inv.amount) * rate;

      // Insert profit record
      await supabase.from("profits").insert({
        user_id: inv.user_id,
        investment_id: inv.id,
        amount: profitAmount,
        profit_date: today,
      });

      // Credit to wallet
      if (inv.auto_compound) {
        await supabase
          .from("investments")
          .update({ amount: Number(inv.amount) + profitAmount })
          .eq("id", inv.id);
      } else {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", inv.user_id)
          .eq("currency", "USDT")
          .maybeSingle();

        if (wallet) {
          await supabase
            .from("wallets")
            .update({ balance: Number(wallet.balance) + profitAmount })
            .eq("user_id", inv.user_id)
            .eq("currency", "USDT");
        }
      }

      // Distribute 20-level rebate commissions (based on downline's daily profit)
      const { data: profile } = await supabase
        .from("profiles")
        .select("referred_by")
        .eq("user_id", inv.user_id)
        .maybeSingle();

      if (profile?.referred_by) {
        let currentReferralCode = profile.referred_by;
        for (let level = 1; level <= 20; level++) {
          const rebatePercent = commRates[level];
          if (!rebatePercent || rebatePercent <= 0) {
            if (level > 20) break;
            continue;
          }

          const { data: upline } = await supabase
            .from("profiles")
            .select("user_id, referred_by, referral_code")
            .eq("referral_code", currentReferralCode)
            .maybeSingle();

          if (!upline) break;

          const commission = profitAmount * (rebatePercent / 100);

          // Insert commission record
          await supabase.from("commissions").insert({
            user_id: upline.user_id,
            from_user_id: inv.user_id,
            amount: commission,
            level,
            type: "rebate",
            description: `L${level} rebate (${rebatePercent}%) from daily profit`,
          });

          // Credit commission to upline wallet
          const { data: uplineWallet } = await supabase
            .from("wallets")
            .select("balance")
            .eq("user_id", upline.user_id)
            .eq("currency", "USDT")
            .maybeSingle();

          if (uplineWallet) {
            await supabase
              .from("wallets")
              .update({ balance: Number(uplineWallet.balance) + commission })
              .eq("user_id", upline.user_id)
              .eq("currency", "USDT");
          }

          currentReferralCode = upline.referred_by || "";
          if (!currentReferralCode) break;
        }
      }

      totalDistributed += profitAmount;
      processed++;
    }

    // Log the execution
    await supabase.from("profit_engine_logs").insert({
      run_date: today,
      status: "completed",
      total_users: processed,
      total_profit_distributed: totalDistributed,
      details: { processed, total: investments?.length || 0 },
    });

    return new Response(
      JSON.stringify({ success: true, processed, total: investments?.length || 0, totalDistributed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Daily profit error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
