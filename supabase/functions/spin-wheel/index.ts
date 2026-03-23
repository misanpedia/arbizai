import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const today = new Date().toISOString().split("T")[0];

    // Check if already spun today
    const { data: todaySpins } = await supabase
      .from("user_spins")
      .select("id")
      .eq("user_id", user.id)
      .eq("spin_date", today);

    if (todaySpins && todaySpins.length >= 1) {
      return new Response(
        JSON.stringify({ success: false, error: "Already spun today" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get active rewards
    const { data: rewards, error: rewardsError } = await supabase
      .from("spin_rewards")
      .select("*")
      .eq("is_active", true);

    if (rewardsError || !rewards || rewards.length === 0) {
      throw new Error("No spin rewards configured");
    }

    // Weighted random selection
    const totalWeight = rewards.reduce((sum, r) => sum + Number(r.probability), 0);
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;

    for (let i = 0; i < rewards.length; i++) {
      random -= Number(rewards[i].probability);
      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }

    const selected = rewards[selectedIndex];

    // Record the spin
    await supabase.from("user_spins").insert({
      user_id: user.id,
      reward_id: selected.id,
      reward_label: selected.label,
      reward_value: Number(selected.reward_value),
      spin_date: today,
    });

    // Credit the reward based on type
    if (selected.reward_type === "reward") {
      await supabase.rpc("atomic_reward_credit", {
        p_user_id: user.id,
        p_amount: Number(selected.reward_value),
        p_description: `Lucky Spin: ${selected.label}`,
      });
    } else if (selected.reward_type === "bonus") {
      // Credit to bonus_balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("bonus_balance")
        .eq("user_id", user.id)
        .eq("currency", "USDT")
        .maybeSingle();

      if (wallet) {
        await supabase
          .from("wallets")
          .update({ bonus_balance: Number(wallet.bonus_balance) + Number(selected.reward_value) })
          .eq("user_id", user.id)
          .eq("currency", "USDT");
      }
    } else if (selected.reward_type === "arbiz") {
      // Credit to arbiz_balances
      const { data: arbiz } = await supabase
        .from("arbiz_balances")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (arbiz) {
        await supabase
          .from("arbiz_balances")
          .update({ balance: Number(arbiz.balance) + Number(selected.reward_value) })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("arbiz_balances")
          .insert({ user_id: user.id, balance: Number(selected.reward_value) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        selectedIndex,
        rewardCount: rewards.length,
        reward: {
          label: selected.label,
          reward_type: selected.reward_type,
          reward_value: Number(selected.reward_value),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Spin wheel error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
