import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Coins, TrendingUp, Clock, ArrowRight, Sparkles, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";

const ArbizToken = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [claimDate, setClaimDate] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [balRes, txRes, settingsRes] = await Promise.all([
        supabase.from("arbiz_balances").select("*").eq("user_id", user.id).single(),
        supabase.from("arbiz_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("system_settings").select("value").eq("key", "arbiz_claim_date").single(),
      ]);
      if (balRes.data) setBalance(balRes.data);
      if (txRes.data) setTransactions(txRes.data);
      if (settingsRes.data) setClaimDate(String(settingsRes.data.value).replace(/"/g, ""));
    };
    fetchData();
  }, [user]);

  const canClaim = claimDate && new Date(claimDate).toDateString() === new Date().toDateString();
  const tokenBalance = balance ? Number(balance.balance) : 0;
  const totalEarned = balance ? Number(balance.total_earned) : 0;
  const totalClaimed = balance ? Number(balance.total_claimed) : 0;
  const usdValue = tokenBalance * 0.1;

  const handleClaim = async () => {
    if (!user || !canClaim || tokenBalance <= 0 || claiming) return;
    setClaiming(true);

    try {
      const { data, error } = await supabase.functions.invoke("claim-arbiz");

      if (error || !data?.success) {
        toast({ title: "Claim Failed", description: data?.error || "Could not claim ARBIZ", variant: "destructive" });
        setClaiming(false);
        return;
      }

      toast({ title: "🎉 ARBIZ Claimed!", description: `${data.claimed} ARBIZ → $${data.usdt.toFixed(2)} USDT` });
      setBalance({ ...balance, balance: 0, total_claimed: totalClaimed + data.claimed });

      const txRes = await supabase.from("arbiz_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
      if (txRes.data) setTransactions(txRes.data);
    } catch (e) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }
    setClaiming(false);
  };

  return (
    <DashboardLayout title="ARBIZ Token">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Balance Card */}
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="glass-strong rounded-2xl p-6 text-center">
          <Coins className="w-10 h-10 text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground mb-1">Your ARBIZ Balance</p>
          <p className="text-4xl font-display font-bold text-foreground">{tokenBalance.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-1">≈ ${usdValue.toFixed(2)} USDT</p>
          <div className="flex justify-center gap-1 mt-3">
            <Sparkles className="w-4 h-4 text-warning" />
            <span className="text-xs text-muted-foreground">Rate: $0.1 / ARBIZ</span>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Earned", value: totalEarned.toLocaleString(), icon: TrendingUp, color: "text-success" },
            { label: "Total Claimed", value: totalClaimed.toLocaleString(), icon: Unlock, color: "text-primary" },
            { label: "Available", value: tokenBalance.toLocaleString(), icon: Coins, color: "text-warning" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
              className="glass-strong rounded-xl p-3 text-center">
              <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-sm font-display font-bold text-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Claim Section */}
        <div className="glass-strong rounded-2xl p-5 space-y-4 text-center">
          <h3 className="font-display font-semibold text-foreground flex items-center justify-center gap-2">
            {canClaim ? <Unlock className="w-5 h-5 text-success" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
            Claim ARBIZ
          </h3>
          {claimDate ? (
            <div>
              <p className="text-sm text-muted-foreground">
                {canClaim ? "🎉 Claim is open today!" : `Next claim date: ${new Date(claimDate).toLocaleDateString()}`}
              </p>
              {canClaim && tokenBalance > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-lg font-bold text-foreground">{tokenBalance.toLocaleString()} ARBIZ <ArrowRight className="inline w-4 h-4" /> ${usdValue.toFixed(2)} USDT</p>
                  <Button onClick={handleClaim} disabled={claiming} className="gradient-primary text-primary-foreground px-8">
                    {claiming ? "Claiming..." : "Claim Now"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Claim date will be announced by admin</p>
          )}
        </div>

        {/* How it works */}
        <div className="glass-strong rounded-2xl p-5 space-y-3">
          <h3 className="font-display font-semibold text-foreground">How to Earn ARBIZ</h3>
          <div className="space-y-2">
            {[
              { step: "1", title: "Activate AI Bot", desc: "Invest in any AI bot plan" },
              { step: "2", title: "Receive ARBIZ", desc: "$100 investment = 1,000 ARBIZ" },
              { step: "3", title: "Wait for Claim Date", desc: "Admin sets claim dates" },
              { step: "4", title: "Claim to USDT", desc: "Convert at $0.1 per ARBIZ" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{item.step}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="glass-strong rounded-2xl p-5 space-y-3">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Transaction History
          </h3>
          {transactions.length === 0 && <p className="text-muted-foreground text-center py-4 text-sm">No transactions yet</p>}
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground capitalize">{tx.type}</p>
                <p className="text-[10px] text-muted-foreground">{tx.source}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-sm font-bold ${tx.type === "earn" ? "text-success" : "text-primary"}`}>
                {tx.type === "earn" ? "+" : "-"}{Number(tx.amount).toLocaleString()} ARBIZ
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ArbizToken;
