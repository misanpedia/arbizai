import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, TrendingUp, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const Commissions = () => {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("commissions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setCommissions(data);
    });
  }, [user]);

  const total = commissions.reduce((s, c) => s + Number(c.amount), 0);
  const referralTotal = commissions.filter(c => c.type === "referral").reduce((s, c) => s + Number(c.amount), 0);
  const rebateTotal = commissions.filter(c => c.type === "rebate").reduce((s, c) => s + Number(c.amount), 0);
  const rankTotal = commissions.filter(c => c.type === "rank_weekly").reduce((s, c) => s + Number(c.amount), 0);

  return (
    <DashboardLayout title="Commissions">
      <div className="max-w-lg mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-6 text-center">
          <Wallet className="w-8 h-8 text-success mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Total Commission Earned</p>
          <p className="text-3xl font-display font-bold text-success">${total.toFixed(2)}</p>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-muted/50 rounded-xl p-2">
              <p className="text-[10px] text-muted-foreground">Referral (Deposit)</p>
              <p className="text-sm font-bold text-foreground">${referralTotal.toFixed(2)}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-2">
              <p className="text-[10px] text-muted-foreground">Rebate (Profit)</p>
              <p className="text-sm font-bold text-foreground">${rebateTotal.toFixed(2)}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-2">
              <p className="text-[10px] text-muted-foreground">Rank Weekly</p>
              <p className="text-sm font-bold text-foreground">${rankTotal.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>

        {/* Level Breakdown (20 levels) */}
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 20 }, (_, i) => i + 1).map(level => {
            const levelTotal = commissions.filter(c => c.level === level).reduce((s, c) => s + Number(c.amount), 0);
            return (
              <div key={level} className="glass-strong rounded-xl p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Lv.{level}</p>
                <p className="text-xs font-bold text-foreground">${levelTotal.toFixed(0)}</p>
              </div>
            );
          })}
        </div>

        {commissions.length === 0 ? (
          <div className="glass-strong rounded-2xl p-8 text-center">
            <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No commissions yet</p>
            <p className="text-xs text-muted-foreground mt-1">Invite friends and earn from their investments</p>
          </div>
        ) : (
          <div className="space-y-2">
            {commissions.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-strong rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.description || c.type || "Commission"}</p>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(c.created_at).toLocaleDateString()}
                    {c.type && <span className="ml-1 px-1 py-0.5 rounded bg-muted text-[9px]">{c.type}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-success">+${Number(c.amount).toFixed(2)}</p>
                  {c.level > 0 && <p className="text-[10px] text-muted-foreground">Level {c.level}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Commissions;
