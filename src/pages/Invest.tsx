import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Zap, Star, Crown, Gem, Gift } from "lucide-react";
import { motion } from "framer-motion";

const PLAN_ICONS = { basic: Zap, advance: Star, business: Crown, elite: Gem };

const Invest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const totalAvailable = balance + bonusBalance;

  useEffect(() => {
    supabase.from("investment_plans").select("*").eq("is_active", true).order("min_amount").then(({ data }) => {
      if (data) setPlans(data);
    });
    if (user) {
      supabase.from("wallets").select("balance, bonus_balance").eq("user_id", user.id).eq("currency", "USDT").maybeSingle().then(({ data }) => {
        setBalance(data ? Number(data.balance) : 0);
        setBonusBalance(data ? Number((data as any).bonus_balance) : 0);
      });
    }
  }, [user]);

  const handleInvest = async () => {
    if (!user || !selectedPlan || !amount) return;
    const amt = parseFloat(amount);
    if (amt < Number(selectedPlan.min_amount) || amt > Number(selectedPlan.max_amount)) {
      toast({ title: "Invalid amount", description: `Amount must be between $${selectedPlan.min_amount} and $${selectedPlan.max_amount}`, variant: "destructive" });
      return;
    }
    if (amt > totalAvailable) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }
    setLoading(true);

    // Calculate how much bonus will be used
    const bonusUsed = Math.min(bonusBalance, amt);

    const { data: debitOk, error: debitError } = await supabase.rpc("use_bonus_for_investment", {
      p_user_id: user.id,
      p_currency: "USDT",
      p_amount: amt,
    } as any);

    if (debitError || debitOk === false) {
      setLoading(false);
      toast({ title: "Insufficient balance", description: debitError?.message || "Failed to debit wallet", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("investments").insert({
      user_id: user.id,
      plan_id: selectedPlan.id,
      amount: amt,
      bonus_used: bonusUsed,
    } as any);
    // Note: max_roi defaults to 0 in DB, daily-profit function will use amount*3 if max_roi=0
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "AI Bot Activated!", description: `$${amt} invested in ${selectedPlan.display_name} plan.` });
      setAmount("");
      setSelectedPlan(null);
      supabase.from("wallets").select("balance, bonus_balance").eq("user_id", user.id).eq("currency", "USDT").maybeSingle().then(({ data }) => {
        setBalance(data ? Number(data.balance) : 0);
        setBonusBalance(data ? Number((data as any).bonus_balance) : 0);
      });
    }
  };

  return (
    <DashboardLayout title="AI Bot">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="glass-strong rounded-2xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Total Available Balance</p>
          <p className="text-2xl font-display font-bold text-foreground">${totalAvailable.toFixed(2)}</p>
          <div className="flex justify-center gap-4 mt-1 text-xs">
            <span className="text-muted-foreground">Balance: <span className="text-foreground font-medium">${balance.toFixed(2)}</span></span>
            {bonusBalance > 0 && (
              <span className="text-warning flex items-center gap-1">
                <Gift className="w-3 h-3" /> Bonus: <span className="font-medium">${bonusBalance.toFixed(2)}</span>
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {plans.map((plan, i) => {
            const Icon = PLAN_ICONS[plan.name as keyof typeof PLAN_ICONS] || TrendingUp;
            const isSelected = selectedPlan?.id === plan.id;
            return (
              <motion.button key={plan.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} onClick={() => setSelectedPlan(plan)} className={`w-full text-left rounded-2xl p-4 transition ${isSelected ? "gradient-primary text-primary-foreground glow-primary" : "glass-strong hover:bg-muted/50"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isSelected ? "bg-primary-foreground/20" : "bg-primary/10"}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? "text-primary-foreground" : "text-primary"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-base">{plan.display_name}</h3>
                    <p className={`text-xs ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      ${Number(plan.min_amount).toLocaleString()} – ${Number(plan.max_amount).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold font-mono ${isSelected ? "text-primary-foreground" : "text-success"}`}>
                      {Number(plan.daily_profit_min)}%–{Number(plan.daily_profit_max)}%
                    </p>
                    <p className={`text-[10px] ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>daily</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {selectedPlan && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 space-y-4">
            <h3 className="font-display font-semibold text-foreground">Invest in {selectedPlan.display_name}</h3>
            <Input type="number" placeholder={`Min $${Number(selectedPlan.min_amount)}`} value={amount} onChange={(e) => setAmount(e.target.value)} className="glass" />
            {bonusBalance > 0 && (
              <p className="text-xs text-warning flex items-center gap-1">
                <Gift className="w-3 h-3" /> Bonus will be used first for investment
              </p>
            )}
            <Button onClick={handleInvest} disabled={loading || !amount} className="w-full gradient-primary text-primary-foreground">
              {loading ? "Processing..." : "Confirm Investment"}
            </Button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Invest;