import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { data: investments, error: invError } = await supabase
      .from("investments")
      .select("id, user_id, amount, plan_id, auto_compound, total_profit, max_roi, investment_plans(daily_profit_min, daily_profit_max)")
      .eq("status", "active");

    if (invError) throw invError;

    let processed = 0;
    let totalDistributed = 0;
    let completed = 0;

    // Get rebate commission settings
    const { data: ratesData } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "commission_rates")
      .maybeSingle();

    const commRates: Record<number, number> = { ...DEFAULT_REBATE_RATES };
    if (ratesData?.value && Array.isArray(ratesData.value)) {
      (ratesData.value as number[]).forEach((rate, i) => {
        commRates[i + 1] = Number(rate);
      });
    }

    for (const inv of investments || []) {
      const plan = (inv as any).investment_plans;
      if (!plan) continue;

      const currentTotalProfit = Number(inv.total_profit || 0);
      const maxRoi = Number(inv.max_roi || inv.amount * 3);

      // Check if 300% ROI already reached
      if (currentTotalProfit >= maxRoi) {
        // Mark as completed
        await supabase.from("investments").update({ status: "completed" }).eq("id", inv.id);
        completed++;
        continue;
      }

      // Check if profit already generated today
      const { data: existing } = await supabase
        .from("profits")
        .select("id")
        .eq("investment_id", inv.id)
        .eq("profit_date", today)
        .maybeSingle();

      if (existing) continue;

      const minRate = Number(plan.daily_profit_min) / 100;
      const maxRate = Number(plan.daily_profit_max) / 100;
      const rate = minRate + Math.random() * (maxRate - minRate);
      let profitAmount = Number(inv.amount) * rate;

      // Cap profit to not exceed 300% ROI
      const remaining = maxRoi - currentTotalProfit;
      if (profitAmount > remaining) {
        profitAmount = remaining;
      }

      // Insert profit record
      await supabase.from("profits").insert({
        user_id: inv.user_id,
        investment_id: inv.id,
        amount: profitAmount,
        profit_date: today,
      });

      // Update total_profit on investment
      const newTotal = currentTotalProfit + profitAmount;
      const updateData: any = { total_profit: newTotal };
      if (newTotal >= maxRoi) {
        updateData.status = "completed";
        completed++;
      }
      await supabase.from("investments").update(updateData).eq("id", inv.id);

      // Credit to wallet (no auto-compound to investment amount anymore since no principal withdrawal)
      if (inv.auto_compound && newTotal < maxRoi) {
        // Auto-compound adds to investment amount (increases daily profit base)
        await supabase
          .from("investments")
          .update({ amount: Number(inv.amount) + profitAmount, max_roi: (Number(inv.amount) + profitAmount) * 3 })
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

      // Distribute 20-level rebate commissions
      const { data: profile } = await supabase
        .from("profiles")
        .select("referred_by")
        .eq("user_id", inv.user_id)
        .maybeSingle();

      if (profile?.referred_by) {
        let currentReferralCode = profile.referred_by;
        for (let level = 1; level <= 20; level++) {
          const rebatePercent = commRates[level];
          if (!rebatePercent || rebatePercent <= 0) continue;

          const { data: upline } = await supabase
            .from("profiles")
            .select("user_id, referred_by, referral_code")
            .eq("referral_code", currentReferralCode)
            .maybeSingle();

          if (!upline) break;

          const commission = profitAmount * (rebatePercent / 100);

          await supabase.from("commissions").insert({
            user_id: upline.user_id,
            from_user_id: inv.user_id,
            amount: commission,
            level,
            type: "rebate",
            description: `L${level} rebate (${rebatePercent}%) from daily profit`,
          });

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

    await supabase.from("profit_engine_logs").insert({
      run_date: today,
      status: "completed",
      total_users: processed,
      total_profit_distributed: totalDistributed,
      details: { processed, total: investments?.length || 0, completed_roi: completed },
    });

    return new Response(
      JSON.stringify({ success: true, processed, total: investments?.length || 0, totalDistributed, completed_roi: completed }),
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
