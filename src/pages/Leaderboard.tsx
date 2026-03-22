import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Users, Medal } from "lucide-react";

interface LeaderEntry {
  user_id: string;
  full_name: string;
  rank: string;
  value: number;
}

const MEDAL_COLORS = ["text-yellow-400", "text-slate-400", "text-amber-600"];

const Leaderboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"profit" | "referral">("profit");
  const [profitLeaders, setProfitLeaders] = useState<LeaderEntry[]>([]);
  const [referralLeaders, setReferralLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      setLoading(true);
      
      // Fetch profit leaderboard - get all profits grouped by user
      const { data: profits } = await supabase
        .from("profits")
        .select("user_id, amount");
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, rank");

      if (profits && profiles) {
        const profitMap: Record<string, number> = {};
        profits.forEach(p => {
          profitMap[p.user_id] = (profitMap[p.user_id] || 0) + Number(p.amount);
        });

        const profitList: LeaderEntry[] = Object.entries(profitMap)
          .map(([uid, val]) => {
            const prof = profiles.find(p => p.user_id === uid);
            return { user_id: uid, full_name: prof?.full_name || "User", rank: prof?.rank || "bronze", value: val };
          })
          .sort((a, b) => b.value - a.value)
          .slice(0, 20);
        setProfitLeaders(profitList);
      }

      // Fetch referral leaderboard - count referrals per user
      if (profiles) {
        const refMap: Record<string, number> = {};
        profiles.forEach(p => {
          if (p.user_id) {
            // Count how many profiles have referred_by pointing to this profile's id
          }
        });

        // Get commissions as referral metric
        const { data: commissions } = await supabase
          .from("commissions")
          .select("user_id, amount");

        if (commissions) {
          const commMap: Record<string, number> = {};
          commissions.forEach(c => {
            commMap[c.user_id] = (commMap[c.user_id] || 0) + Number(c.amount);
          });

          const refList: LeaderEntry[] = Object.entries(commMap)
            .map(([uid, val]) => {
              const prof = profiles.find(p => p.user_id === uid);
              return { user_id: uid, full_name: prof?.full_name || "User", rank: prof?.rank || "bronze", value: val };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 20);
          setReferralLeaders(refList);
        }
      }

      setLoading(false);
    };

    fetchLeaderboards();
  }, []);

  const leaders = tab === "profit" ? profitLeaders : referralLeaders;

  return (
    <DashboardLayout title="Leaderboard">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab("profit")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${tab === "profit" ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
            <TrendingUp className="w-4 h-4" /> Top Profit
          </button>
          <button onClick={() => setTab("referral")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${tab === "referral" ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
            <Users className="w-4 h-4" /> Top Referral
          </button>
        </div>

        {/* Top 3 Podium */}
        {leaders.length >= 3 && (
          <div className="flex items-end justify-center gap-3 py-4">
            {[1, 0, 2].map((idx) => {
              const entry = leaders[idx];
              const isCenter = idx === 0;
              return (
                <motion.div key={idx} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }}
                  className={`flex flex-col items-center ${isCenter ? "order-2" : idx === 1 ? "order-1" : "order-3"}`}>
                  <div className={`w-${isCenter ? "16" : "12"} h-${isCenter ? "16" : "12"} rounded-full bg-primary/10 flex items-center justify-center mb-2 ${isCenter ? "ring-2 ring-primary" : ""}`}>
                    <span className="text-lg font-bold text-foreground">{(entry.full_name || "U")[0].toUpperCase()}</span>
                  </div>
                  <Medal className={`w-5 h-5 ${MEDAL_COLORS[idx]} mb-1`} />
                  <p className="text-xs font-medium text-foreground text-center truncate max-w-[80px]">{entry.full_name}</p>
                  <p className="text-xs font-bold text-primary">${entry.value.toFixed(2)}</p>
                  <div className={`mt-2 rounded-t-lg bg-primary/10 ${isCenter ? "w-20 h-20" : idx === 1 ? "w-16 h-14" : "w-16 h-10"}`} />
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full List */}
        <div className="glass-strong rounded-2xl p-5 space-y-2">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-warning" /> Rankings
          </h3>
          {loading && <p className="text-muted-foreground text-center py-4 text-sm">Loading...</p>}
          {!loading && leaders.length === 0 && <p className="text-muted-foreground text-center py-4 text-sm">No data yet</p>}
          {leaders.map((entry, i) => (
            <motion.div key={entry.user_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition ${entry.user_id === user?.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/30"}`}>
              <div className="w-7 text-center">
                {i < 3 ? (
                  <Medal className={`w-5 h-5 mx-auto ${MEDAL_COLORS[i]}`} />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{(entry.full_name || "U")[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {entry.full_name}
                  {entry.user_id === user?.id && <span className="text-[10px] text-primary ml-1">(You)</span>}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize">{entry.rank}</p>
              </div>
              <p className="text-sm font-bold text-primary font-mono">${entry.value.toFixed(2)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Leaderboard;
