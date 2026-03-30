import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RankDef {
  name: string;
  label: string;
  personalInvestment: number;
  referrals: number;
  volume: number;
  weeklyCommission: number;
}

const DEFAULT_RANKS: RankDef[] = [
  { name: "bronze",  label: "Bronze",  personalInvestment: 100,  referrals: 5,   volume: 1000,    weeklyCommission: 10 },
  { name: "silver",  label: "Silver",  personalInvestment: 200,  referrals: 10,  volume: 2500,    weeklyCommission: 20 },
  { name: "gold",    label: "Gold",    personalInvestment: 250,  referrals: 15,  volume: 5000,    weeklyCommission: 50 },
  { name: "diamond", label: "Diamond", personalInvestment: 500,  referrals: 30,  volume: 10000,   weeklyCommission: 100 },
  { name: "emerald", label: "Emerald", personalInvestment: 1000, referrals: 60,  volume: 25000,   weeklyCommission: 250 },
  { name: "ruby",    label: "Ruby",    personalInvestment: 1500, referrals: 100, volume: 50000,   weeklyCommission: 500 },
  { name: "crown",   label: "Crown",   personalInvestment: 2000, referrals: 200, volume: 100000,  weeklyCommission: 1000 },
  { name: "legend",  label: "Legend",  personalInvestment: 2500, referrals: 500, volume: 500000,  weeklyCommission: 5000 },
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
    const RANK_ORDER = RANKS.map(r => r.name);

    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("user_id, referral_code, rank")
      .eq("is_active", true);

    if (profErr) throw profErr;

    let upgraded = 0;
    let downgraded = 0;

    for (const profile of profiles || []) {
      // 1. Personal active investment total
      const { data: personalInvs } = await supabase
        .from("investments")
        .select("amount")
        .eq("user_id", profile.user_id)
        .eq("status", "active");
      const personalInvestment = personalInvs
        ? personalInvs.reduce((sum: number, i: any) => sum + Number(i.amount), 0)
        : 0;

      // 2. Count direct active referrals
      const { count: refCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", profile.referral_code)
        .eq("is_active", true);

      // 3. Get team volume
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

      // Find highest qualifying rank (or null if none qualify)
      let newRank: string | null = null;
      for (const rank of RANKS) {
        if (
          personalInvestment >= rank.personalInvestment &&
          (refCount || 0) >= rank.referrals &&
          teamVolume >= rank.volume
        ) {
          newRank = rank.name;
        }
      }

      const currentRank = profile.rank || null;

      // Update if rank changed (both upgrade AND downgrade)
      if (newRank !== currentRank) {
        const currentIdx = currentRank ? RANK_ORDER.indexOf(currentRank) : -1;
        const newIdx = newRank ? RANK_ORDER.indexOf(newRank) : -1;

        await supabase
          .from("profiles")
          .update({ rank: newRank })
          .eq("user_id", profile.user_id);

        if (newIdx > currentIdx) {
          // Upgraded
          const rankLabel = RANKS.find(r => r.name === newRank)?.label || newRank;
          await supabase.from("notifications").insert({
            user_id: profile.user_id,
            title: "🎉 Rank Upgraded!",
            message: `Congratulations! You've been promoted to ${rankLabel} rank.`,
            type: "success",
          });
          upgraded++;
        } else {
          // Downgraded
          if (newRank) {
            const rankLabel = RANKS.find(r => r.name === newRank)?.label || newRank;
            await supabase.from("notifications").insert({
              user_id: profile.user_id,
              title: "📉 Rank Updated",
              message: `Your rank has been adjusted to ${rankLabel}. Keep building to rank up!`,
              type: "info",
            });
          } else {
            await supabase.from("notifications").insert({
              user_id: profile.user_id,
              title: "📉 Rank Removed",
              message: `You no longer meet the requirements for any rank. Keep building to earn a rank!`,
              type: "info",
            });
          }
          downgraded++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: profiles?.length || 0, upgraded, downgraded }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Auto rank upgrade error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
