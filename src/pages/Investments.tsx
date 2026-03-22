import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Calendar, DollarSign, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const Investments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [investments, setInvestments] = useState<any[]>([]);

  const fetchInvestments = () => {
    if (!user) return;
    supabase.from("investments").select("*, investment_plans(display_name, daily_profit_min, daily_profit_max)").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setInvestments(data as any[]);
    });
  };

  useEffect(() => { fetchInvestments(); }, [user]);

  const toggleAutoCompound = async (investmentId: string, current: boolean) => {
    const { error } = await supabase.from("investments").update({ auto_compound: !current } as any).eq("id", investmentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: !current ? "Auto-Compound ON 🔄" : "Auto-Compound OFF", description: !current ? "Profits will be reinvested automatically" : "Profits will go to your wallet" });
    fetchInvestments();
  };

  const totalActive = investments.filter(i => i.status === "active").reduce((s, i) => s + Number(i.amount), 0);
  const totalProfit = investments.reduce((s, i) => s + Number(i.total_profit), 0);

  return (
    <DashboardLayout title="My AI Bot">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-strong rounded-xl p-4 text-center">
            <DollarSign className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Active Capital</p>
            <p className="font-display font-bold text-foreground">${totalActive.toFixed(2)}</p>
          </div>
          <div className="glass-strong rounded-xl p-4 text-center">
            <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Total Profit</p>
            <p className="font-display font-bold text-success">${totalProfit.toFixed(2)}</p>
          </div>
        </div>

        {/* List */}
        {investments.length === 0 ? (
          <div className="glass-strong rounded-2xl p-8 text-center">
            <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No investments yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start investing to grow your portfolio</p>
          </div>
        ) : (
          <div className="space-y-3">
            {investments.map((inv, i) => (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-strong rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-semibold text-foreground">{inv.investment_plans?.display_name || "Plan"}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inv.status === "active" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>{inv.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-sm font-bold text-foreground">${Number(inv.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Daily %</p>
                    <p className="text-sm font-bold text-primary">{Number(inv.investment_plans?.daily_profit_min)}–{Number(inv.investment_plans?.daily_profit_max)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Earned</p>
                    <p className="text-sm font-bold text-success">${Number(inv.total_profit).toFixed(2)}</p>
                  </div>
                </div>

                {/* Auto-Compound Toggle */}
                {inv.status === "active" && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <RefreshCw className={`w-4 h-4 ${inv.auto_compound ? "text-primary animate-spin" : "text-muted-foreground"}`} style={inv.auto_compound ? { animationDuration: '3s' } : {}} />
                      <div>
                        <p className="text-xs font-medium text-foreground">Auto-Compound</p>
                        <p className="text-[10px] text-muted-foreground">{inv.auto_compound ? "Profits reinvested" : "Profits to wallet"}</p>
                      </div>
                    </div>
                    <Switch checked={inv.auto_compound || false} onCheckedChange={() => toggleAutoCompound(inv.id, inv.auto_compound || false)} />
                  </div>
                )}

                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {new Date(inv.created_at).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Investments;
