import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RankDef {
  name: string;
  weeklyCommission: number;
}

const DEFAULT_RANKS: RankDef[] = [
  { name: "bronze",  weeklyCommission: 10 },
  { name: "silver",  weeklyCommission: 20 },
  { name: "gold",    weeklyCommission: 50 },
  { name: "diamond", weeklyCommission: 100 },
  { name: "emerald", weeklyCommission: 250 },
  { name: "ruby",    weeklyCommission: 500 },
  { name: "crown",   weeklyCommission: 1000 },
  { name: "legend",  weeklyCommission: 5000 },
];

async function loadRankWeekly(supabase: any): Promise<Record<string, number>> {
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "rank_config")
    .maybeSingle();

  const ranks = (data?.value && Array.isArray(data.value)) ? data.value as RankDef[] : DEFAULT_RANKS;
  const map: Record<string, number> = {};
  ranks.forEach(r => { map[r.name] = r.weeklyCommission; });
  return map;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const RANK_WEEKLY = await loadRankWeekly(supabase);
    const today = new Date().toISOString().split("T")[0];

    // Get all active profiles with a rank
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, rank")
      .eq("is_active", true);

    if (error) throw error;

    let paid = 0;
    let totalPaid = 0;

    for (const profile of profiles || []) {
      const weeklyAmount = RANK_WEEKLY[profile.rank || ""];
      if (!weeklyAmount) continue;

      // Check if already paid this week
      const { data: existing } = await supabase
        .from("commissions")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("type", "rank_weekly")
        .gte("created_at", getWeekStart())
        .maybeSingle();

      if (existing) continue;

      // Insert commission record
      await supabase.from("commissions").insert({
        user_id: profile.user_id,
        amount: weeklyAmount,
        type: "rank_weekly",
        description: `${(profile.rank || "").charAt(0).toUpperCase() + (profile.rank || "").slice(1)} rank weekly commission`,
        level: 0,
      });

      // Credit to wallet
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", profile.user_id)
        .eq("currency", "USDT")
        .maybeSingle();

      if (wallet) {
        await supabase
          .from("wallets")
          .update({ balance: Number(wallet.balance) + weeklyAmount })
          .eq("user_id", profile.user_id)
          .eq("currency", "USDT");
      }

      paid++;
      totalPaid += weeklyAmount;
    }

    return new Response(
      JSON.stringify({ success: true, paid, totalPaid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Weekly rank commission error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setUTCDate(diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString();
}
