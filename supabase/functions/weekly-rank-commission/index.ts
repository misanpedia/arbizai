import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RankDef {
  name: string;
  personalInvestment: number;
  referrals: number;
  volume: number;
  weeklyCommission: number;
}

const DEFAULT_RANKS: RankDef[] = [
  { name: "bronze",  personalInvestment: 100,  referrals: 5,   volume: 1000,    weeklyCommission: 10 },
  { name: "silver",  personalInvestment: 200,  referrals: 10,  volume: 2500,    weeklyCommission: 20 },
  { name: "gold",    personalInvestment: 250,  referrals: 15,  volume: 5000,    weeklyCommission: 50 },
  { name: "diamond", personalInvestment: 500,  referrals: 30,  volume: 10000,   weeklyCommission: 100 },
  { name: "emerald", personalInvestment: 1000, referrals: 60,  volume: 25000,   weeklyCommission: 250 },
  { name: "ruby",    personalInvestment: 1500, referrals: 100, volume: 50000,   weeklyCommission: 500 },
  { name: "crown",   personalInvestment: 2000, referrals: 200, volume: 100000,  weeklyCommission: 1000 },
  { name: "legend",  personalInvestment: 2500, referrals: 500, volume: 500000,  weeklyCommission: 5000 },
];

async function loadRanks(supabase: any): Promise<RankDef[]> {
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "rank_config")
    .maybeSingle();
  if (data?.value && Array.isArray(data.value)) return data.value as RankDef[];
  return DEFAULT_RANKS;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const RANKS = await loadRanks(supabase);
    const rankMap: Record<string, RankDef> = {};
    RANKS.forEach(r => { rankMap[r.name] = r; });

    // Get all active profiles with a non-null rank
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, rank, referral_code")
      .eq("is_active", true)
      .not("rank", "is", null);

    if (error) throw error;

    let paid = 0;
    let skipped = 0;
    let totalPaid = 0;

    for (const profile of profiles || []) {
      const rankDef = rankMap[profile.rank || ""];
      if (!rankDef) continue;

      // VALIDATE QUALIFICATION: check if user actually meets rank requirements
      // 1. Personal active investment
      const { data: personalInvs } = await supabase
        .from("investments")
        .select("amount")
        .eq("user_id", profile.user_id)
        .eq("status", "active");
      const personalInvestment = personalInvs
        ? personalInvs.reduce((sum: number, i: any) => sum + Number(i.amount), 0)
        : 0;

      if (personalInvestment < rankDef.personalInvestment) {
        skipped++;
        continue;
      }

      // 2. Direct active referrals
      const { count: refCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", profile.referral_code)
        .eq("is_active", true);

      if ((refCount || 0) < rankDef.referrals) {
        skipped++;
        continue;
      }

      // 3. Team volume
      const { data: downline } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("referred_by", profile.referral_code);

      let teamVolume = 0;
      if (downline && downline.length > 0) {
        const ids = downline.map((d: any) => d.user_id);
        const { data: invs } = await supabase
          .from("investments")
          .select("amount")
          .in("user_id", ids)
          .eq("status", "active");
        if (invs) teamVolume = invs.reduce((sum: number, i: any) => sum + Number(i.amount), 0);
      }

      if (teamVolume < rankDef.volume) {
        skipped++;
        continue;
      }

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
        amount: rankDef.weeklyCommission,
        type: "rank_weekly",
        description: `${rankDef.name.charAt(0).toUpperCase() + rankDef.name.slice(1)} rank weekly commission`,
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
          .update({ balance: Number(wallet.balance) + rankDef.weeklyCommission })
          .eq("user_id", profile.user_id)
          .eq("currency", "USDT");
      }

      paid++;
      totalPaid += rankDef.weeklyCommission;
    }

    return new Response(
      JSON.stringify({ success: true, paid, skipped, totalPaid }),
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
