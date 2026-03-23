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

    // Get rank settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .like("key", "rank_%");

    const s: Record<string, string> = {};
    settings?.forEach((row: any) => {
      s[row.key] = String(row.value).replace(/"/g, "");
    });

    const ranks = [
      { name: "bronze", referrals: Number(s.rank_bronze_referrals) || 0, volume: Number(s.rank_bronze_volume) || 0 },
      { name: "silver", referrals: Number(s.rank_silver_referrals) || 5, volume: Number(s.rank_silver_volume) || 1000 },
      { name: "gold", referrals: Number(s.rank_gold_referrals) || 15, volume: Number(s.rank_gold_volume) || 10000 },
      { name: "platinum", referrals: Number(s.rank_platinum_referrals) || 30, volume: Number(s.rank_platinum_volume) || 50000 },
      { name: "diamond", referrals: Number(s.rank_diamond_referrals) || 50, volume: Number(s.rank_diamond_volume) || 200000 },
    ];

    // Get all active profiles
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("user_id, referral_code, rank")
      .eq("is_active", true);

    if (profErr) throw profErr;

    let upgraded = 0;

    for (const profile of profiles || []) {
      // Count direct referrals
      const { count: refCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", profile.referral_code)
        .eq("is_active", true);

      // Get team volume (direct referrals' active investments)
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

      // Find highest qualifying rank
      let newRank = "bronze";
      for (const rank of ranks) {
        if ((refCount || 0) >= rank.referrals && teamVolume >= rank.volume) {
          newRank = rank.name;
        }
      }

      // Upgrade if higher rank
      const rankOrder = ["bronze", "silver", "gold", "platinum", "diamond"];
      const currentIdx = rankOrder.indexOf(profile.rank || "bronze");
      const newIdx = rankOrder.indexOf(newRank);

      if (newIdx > currentIdx) {
        await supabase
          .from("profiles")
          .update({ rank: newRank })
          .eq("user_id", profile.user_id);

        // Notify user
        await supabase.from("notifications").insert({
          user_id: profile.user_id,
          title: "🎉 Rank Upgraded!",
          message: `Congratulations! You've been promoted to ${newRank.charAt(0).toUpperCase() + newRank.slice(1)} rank.`,
          type: "success",
        });

        upgraded++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: profiles?.length || 0, upgraded }),
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
