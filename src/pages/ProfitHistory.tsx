import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const ProfitHistory = () => {
  const { user } = useAuth();
  const [profits, setProfits] = useState<any[]>([]);
  const [tab, setTab] = useState<"all" | "7d" | "30d">("7d");

  useEffect(() => {
    if (!user) return;
    let query = supabase.from("profits").select("*, investments(amount, investment_plans(display_name))").eq("user_id", user.id).order("profit_date", { ascending: false });

    if (tab === "7d") {
      const d = new Date(); d.setDate(d.getDate() - 7);
      query = query.gte("profit_date", d.toISOString().split("T")[0]);
    } else if (tab === "30d") {
      const d = new Date(); d.setDate(d.getDate() - 30);
      query = query.gte("profit_date", d.toISOString().split("T")[0]);
    }

    query.limit(100).then(({ data }) => {
      if (data) setProfits(data);
    });
  }, [user, tab]);

  const total = profits.reduce((s, p) => s + Number(p.amount), 0);
  const avgDaily = profits.length > 0 ? total / profits.length : 0;

  return (
    <DashboardLayout title="Profit History">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-strong rounded-xl p-4 text-center">
            <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Total Profit</p>
            <p className="font-display font-bold text-success">${total.toFixed(2)}</p>
          </div>
          <div className="glass-strong rounded-xl p-4 text-center">
            <BarChart3 className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Avg Daily</p>
            <p className="font-display font-bold text-foreground">${avgDaily.toFixed(2)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["7d", "30d", "all"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${tab === t ? "gradient-primary text-primary-foreground" : "glass-strong text-muted-foreground hover:text-foreground"}`}>
              {t === "all" ? "All" : t === "7d" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>

        {/* List */}
        {profits.length === 0 ? (
          <div className="glass-strong rounded-2xl p-8 text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No profit records yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {profits.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="glass-strong rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{(p.investments as any)?.investment_plans?.display_name || "AI Bot"}</p>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(p.profit_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-success">+${Number(p.amount).toFixed(2)}</p>
                  {p.spread_volume && (
                    <p className="text-[10px] text-muted-foreground">Vol: {Number(p.spread_volume).toFixed(1)}%</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfitHistory;
