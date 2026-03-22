import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp, Calendar, Coins } from "lucide-react";
import { motion } from "framer-motion";

const ProfitCalculator = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [amount, setAmount] = useState("1000");
  const [days, setDays] = useState("30");
  const [compound, setCompound] = useState(true);

  useEffect(() => {
    supabase.from("investment_plans").select("*").eq("is_active", true).order("min_amount").then(({ data }) => {
      if (data && data.length > 0) {
        setPlans(data);
        setSelectedPlan(data[0]);
      }
    });
  }, []);

  const amt = parseFloat(amount) || 0;
  const d = parseInt(days) || 0;
  const minRate = selectedPlan ? Number(selectedPlan.daily_profit_min) / 100 : 0;
  const maxRate = selectedPlan ? Number(selectedPlan.daily_profit_max) / 100 : 0;
  const avgRate = (minRate + maxRate) / 2;

  const calcProfit = (rate: number) => {
    if (compound) {
      return amt * Math.pow(1 + rate, d) - amt;
    }
    return amt * rate * d;
  };

  const minProfit = calcProfit(minRate);
  const avgProfit = calcProfit(avgRate);
  const maxProfit = calcProfit(maxRate);

  return (
    <DashboardLayout title="Profit Calculator">
      <div className="max-w-lg mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 text-center">
          <Calculator className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Estimate your potential earnings</p>
        </motion.div>

        {/* Plan Selection */}
        <div className="grid grid-cols-2 gap-2">
          {plans.map((plan) => (
            <button key={plan.id} onClick={() => setSelectedPlan(plan)}
              className={`rounded-xl p-3 text-center text-sm font-medium transition ${selectedPlan?.id === plan.id ? "gradient-primary text-primary-foreground" : "glass-strong text-foreground hover:bg-muted/50"}`}>
              {plan.display_name}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-primary" /> Investment Amount ($)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="glass font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary" /> Duration (days)</Label>
            <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} className="glass font-mono" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Auto-Compound</span>
            <button onClick={() => setCompound(!compound)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${compound ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
              {compound ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Results */}
        {selectedPlan && amt > 0 && d > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 space-y-4">
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Estimated Returns
            </h3>
            <div className="space-y-3">
              {[
                { label: "Conservative", profit: minProfit, rate: `${(minRate * 100).toFixed(1)}%`, color: "text-muted-foreground" },
                { label: "Average", profit: avgProfit, rate: `${(avgRate * 100).toFixed(1)}%`, color: "text-primary" },
                { label: "Optimistic", profit: maxProfit, rate: `${(maxRate * 100).toFixed(1)}%`, color: "text-success" },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <p className={`text-sm font-medium ${r.color}`}>{r.label}</p>
                    <p className="text-[10px] text-muted-foreground">{r.rate}/day · {d} days</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-display font-bold ${r.color}`}>+${r.profit.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">Total: ${(amt + r.profit).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              * Estimates only. Actual returns may vary based on market conditions.
            </p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfitCalculator;
