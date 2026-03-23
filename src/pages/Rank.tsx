import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Award, Star } from "lucide-react";
import { motion } from "framer-motion";

interface RankInfo {
  name: string;
  label: string;
  personalInvestment: number;
  referrals: number;
  volume: number;
  weeklyCommission: number;
}

const DEFAULT_RANKS: RankInfo[] = [
  { name: "bronze",  label: "Bronze",  personalInvestment: 100,  referrals: 5,   volume: 1000,    weeklyCommission: 10 },
  { name: "silver",  label: "Silver",  personalInvestment: 200,  referrals: 10,  volume: 2500,    weeklyCommission: 20 },
  { name: "gold",    label: "Gold",    personalInvestment: 250,  referrals: 15,  volume: 5000,    weeklyCommission: 50 },
  { name: "diamond", label: "Diamond", personalInvestment: 500,  referrals: 30,  volume: 10000,   weeklyCommission: 100 },
  { name: "emerald", label: "Emerald", personalInvestment: 1000, referrals: 60,  volume: 25000,   weeklyCommission: 250 },
  { name: "ruby",    label: "Ruby",    personalInvestment: 1500, referrals: 100, volume: 50000,   weeklyCommission: 500 },
  { name: "crown",   label: "Crown",   personalInvestment: 2000, referrals: 200, volume: 100000,  weeklyCommission: 1000 },
  { name: "legend",  label: "Legend",  personalInvestment: 2500, referrals: 500, volume: 500000,  weeklyCommission: 5000 },
];

const Rank = () => {
  const { user } = useAuth();
  const [currentRank, setCurrentRank] = useState("unranked");
  const [ranks, setRanks] = useState<RankInfo[]>(DEFAULT_RANKS);
  const [userStats, setUserStats] = useState({ referrals: 0, teamVolume: 0, personalInvestment: 0 });

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      // Load rank config from DB
      const { data: configData } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "rank_config")
        .maybeSingle();

      if (configData?.value && Array.isArray(configData.value)) {
        setRanks(configData.value as unknown as RankInfo[]);
      }
        .from("profiles")
        .select("id, rank, referral_code")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setCurrentRank(profile.rank || "unranked");

        const [refRes, downlineRes, personalRes] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("referred_by", profile.referral_code).eq("is_active", true),
          supabase.from("profiles").select("user_id").eq("referred_by", profile.referral_code),
          supabase.from("investments").select("amount").eq("user_id", user.id).eq("status", "active"),
        ]);

        let teamVol = 0;
        if (downlineRes.data && downlineRes.data.length > 0) {
          const ids = downlineRes.data.map(p => p.user_id);
          const { data: invs } = await supabase.from("investments").select("amount").in("user_id", ids).eq("status", "active");
          if (invs) teamVol = invs.reduce((sum, inv) => sum + Number(inv.amount), 0);
        }

        const personalTotal = personalRes.data ? personalRes.data.reduce((sum, inv) => sum + Number(inv.amount), 0) : 0;

        setUserStats({ referrals: refRes.count || 0, teamVolume: teamVol, personalInvestment: personalTotal });
      }
    };

    fetchAll();
  }, [user]);

  const currentIdx = RANKS.findIndex(r => r.name === currentRank);
  const formatVolume = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`;

  return (
    <DashboardLayout title="Rank">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Current Rank */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-2xl p-6 text-center">
          <Award className={`w-12 h-12 mx-auto mb-3 ${currentIdx >= 0 ? RANKS[currentIdx].color : "text-muted-foreground"}`} />
          <h2 className="text-2xl font-display font-bold text-foreground capitalize">{currentRank === "unranked" ? "No Rank" : currentRank}</h2>
          <p className="text-sm text-muted-foreground mt-1">Your Current Rank</p>
          {currentIdx >= 0 && (
            <p className="text-xs text-success mt-2 font-medium">${RANKS[currentIdx].weeklyCommission}/week commission</p>
          )}

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-muted/50 rounded-xl p-2">
              <p className="text-[10px] text-muted-foreground">Personal Bot</p>
              <p className="text-sm font-bold text-foreground">{formatVolume(userStats.personalInvestment)}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-2">
              <p className="text-[10px] text-muted-foreground">Referrals</p>
              <p className="text-sm font-bold text-foreground">{userStats.referrals}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-2">
              <p className="text-[10px] text-muted-foreground">Team Volume</p>
              <p className="text-sm font-bold text-foreground">{formatVolume(userStats.teamVolume)}</p>
            </div>
          </div>

          {currentIdx < RANKS.length - 1 && (
            <div className="mt-4">
              <div className="w-full bg-muted rounded-full h-2">
                <div className="gradient-primary h-2 rounded-full" style={{ width: `${((currentIdx + 1) / RANKS.length) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Next: {RANKS[currentIdx + 1]?.label}</p>
            </div>
          )}
        </motion.div>

        {/* All Ranks */}
        <div className="space-y-2">
          {RANKS.map((rank, i) => {
            const isCurrent = rank.name === currentRank;
            const isAchieved = currentIdx >= 0 && i <= currentIdx;
            return (
              <motion.div key={rank.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className={`rounded-2xl p-4 ${isCurrent ? "gradient-primary text-primary-foreground glow-primary" : "glass-strong"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isCurrent ? "bg-primary-foreground/20" : isAchieved ? "bg-success/10" : "bg-muted"}`}>
                    <Star className={`w-5 h-5 ${isCurrent ? "text-primary-foreground" : isAchieved ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-display font-semibold ${isCurrent ? "" : "text-foreground"}`}>{rank.label}</h3>
                      {isAchieved && !isCurrent && <span className="text-[10px] text-success font-medium">✓</span>}
                      {isCurrent && <span className="text-[10px] font-medium">Current</span>}
                    </div>
                    <p className={`text-[10px] ${isCurrent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      Bot ${rank.personalInvestment} · {rank.referrals} refs · {formatVolume(rank.volume)} vol
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold font-mono ${isCurrent ? "text-primary-foreground" : "text-success"}`}>
                      ${rank.weeklyCommission}
                    </p>
                    <p className={`text-[10px] ${isCurrent ? "text-primary-foreground/60" : "text-muted-foreground"}`}>/week</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Rank;
