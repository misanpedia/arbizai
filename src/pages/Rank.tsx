import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Award, Star } from "lucide-react";
import { motion } from "framer-motion";

interface RankInfo {
  name: string;
  label: string;
  color: string;
  referrals: number;
  volume: number;
  bonus: number;
}

const DEFAULT_RANKS: RankInfo[] = [
  { name: "bronze", label: "Bronze", color: "text-orange-400", referrals: 0, volume: 0, bonus: 0 },
  { name: "silver", label: "Silver", color: "text-gray-400", referrals: 5, volume: 1000, bonus: 2 },
  { name: "gold", label: "Gold", color: "text-yellow-400", referrals: 15, volume: 10000, bonus: 5 },
  { name: "platinum", label: "Platinum", color: "text-cyan-400", referrals: 30, volume: 50000, bonus: 8 },
  { name: "diamond", label: "Diamond", color: "text-purple-400", referrals: 50, volume: 200000, bonus: 12 },
];

const Rank = () => {
  const { user } = useAuth();
  const [currentRank, setCurrentRank] = useState("bronze");
  const [ranks, setRanks] = useState<RankInfo[]>(DEFAULT_RANKS);
  const [userStats, setUserStats] = useState({ referrals: 0, teamVolume: 0 });

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      // Fetch rank settings from admin
      const { data: settings } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", [
          "rank_bronze_referrals", "rank_bronze_volume", "rank_bronze_bonus",
          "rank_silver_referrals", "rank_silver_volume", "rank_silver_bonus",
          "rank_gold_referrals", "rank_gold_volume", "rank_gold_bonus",
          "rank_platinum_referrals", "rank_platinum_volume", "rank_platinum_bonus",
          "rank_diamond_referrals", "rank_diamond_volume", "rank_diamond_bonus",
        ]);

      if (settings && settings.length > 0) {
        const s: Record<string, string> = {};
        settings.forEach(row => { s[row.key] = String(row.value).replace(/"/g, ""); });

        const updated = DEFAULT_RANKS.map(r => ({
          ...r,
          referrals: Number(s[`rank_${r.name}_referrals`]) || r.referrals,
          volume: Number(s[`rank_${r.name}_volume`]) || r.volume,
          bonus: Number(s[`rank_${r.name}_bonus`]) || r.bonus,
        }));
        setRanks(updated);
      }

      // Fetch user profile & referral count
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, rank, referral_code, referred_by")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setCurrentRank(profile.rank);

        // Count active direct referrals
        const { count: refCount } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("referred_by", profile.referral_code)
          .eq("is_active", true);

        // Calculate team volume (sum of all downline investments)
        // Get all downline user_ids recursively would be complex,
        // so we use direct referrals' investment totals as team volume
        const { data: downlineProfiles } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("referred_by", profile.id);

        let teamVol = 0;
        if (downlineProfiles && downlineProfiles.length > 0) {
          const downlineIds = downlineProfiles.map(p => p.user_id);
          const { data: investments } = await supabase
            .from("investments")
            .select("amount")
            .in("user_id", downlineIds)
            .eq("status", "active");
          if (investments) {
            teamVol = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
          }
        }

        setUserStats({ referrals: refCount || 0, teamVolume: teamVol });
      }
    };

    fetchAll();
  }, [user]);

  const currentIdx = ranks.findIndex(r => r.name === currentRank);

  const formatVolume = (v: number) => {
    if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
    return `$${v}`;
  };

  return (
    <DashboardLayout title="Rank">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Current Rank */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-2xl p-6 text-center">
          <Award className={`w-12 h-12 mx-auto mb-3 ${ranks[currentIdx]?.color || "text-primary"}`} />
          <h2 className="text-2xl font-display font-bold text-foreground capitalize">{currentRank}</h2>
          <p className="text-sm text-muted-foreground mt-1">Your Current Rank</p>
          
          {/* User stats */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-muted/50 rounded-xl p-2">
              <p className="text-[10px] text-muted-foreground">Active Referrals</p>
              <p className="text-lg font-bold text-foreground">{userStats.referrals}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-2">
              <p className="text-[10px] text-muted-foreground">Team Volume</p>
              <p className="text-lg font-bold text-foreground">{formatVolume(userStats.teamVolume)}</p>
            </div>
          </div>

          {currentIdx < ranks.length - 1 && (
            <div className="mt-4">
              <div className="w-full bg-muted rounded-full h-2">
                <div className="gradient-primary h-2 rounded-full" style={{ width: `${((currentIdx + 1) / ranks.length) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Next: {ranks[currentIdx + 1]?.label}</p>
            </div>
          )}
        </motion.div>

        {/* All Ranks */}
        <div className="space-y-2">
          {ranks.map((rank, i) => {
            const isCurrent = rank.name === currentRank;
            const isAchieved = i <= currentIdx;
            const requirement = rank.referrals === 0 && rank.volume === 0
              ? "Default rank"
              : `${rank.referrals} active referrals, ${formatVolume(rank.volume)} team volume`;
            return (
              <motion.div key={rank.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className={`rounded-2xl p-4 flex items-center gap-3 ${isCurrent ? "gradient-primary text-primary-foreground glow-primary" : "glass-strong"}`}>
                <div className={`p-2 rounded-xl ${isCurrent ? "bg-primary-foreground/20" : isAchieved ? "bg-success/10" : "bg-muted"}`}>
                  <Star className={`w-5 h-5 ${isCurrent ? "text-primary-foreground" : isAchieved ? "text-success" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-display font-semibold ${isCurrent ? "" : "text-foreground"}`}>{rank.label}</h3>
                  <p className={`text-xs ${isCurrent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{requirement}</p>
                  {rank.bonus > 0 && (
                    <p className={`text-[10px] ${isCurrent ? "text-primary-foreground/60" : "text-muted-foreground"}`}>+{rank.bonus}% bonus from daily profit</p>
                  )}
                </div>
                {isAchieved && !isCurrent && <span className="text-xs text-success font-medium">✓ Achieved</span>}
                {isCurrent && <span className="text-xs font-medium">Current</span>}
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Rank;
