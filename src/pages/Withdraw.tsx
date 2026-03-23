import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpCircle, AlertTriangle, Clock, Info, Ban } from "lucide-react";
import { motion } from "framer-motion";

const NETWORKS = ["BEP20", "TRC20", "ERC20"];

type WithdrawType = "profit" | "principal";

interface PenaltyTier {
  days: number;
  rate: number;
}

const Withdraw = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [network, setNetwork] = useState("BEP20");
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [penaltyRate, setPenaltyRate] = useState(0.10);
  const [loading, setLoading] = useState(false);
  const [withdrawType, setWithdrawType] = useState<WithdrawType>("profit");
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [activeBotBalance, setActiveBotBalance] = useState(0);

  // Admin-configured settings
  const [withdrawalEnabled, setWithdrawalEnabled] = useState(true);
  const [feeRate, setFeeRate] = useState(0.05);
  const [minAmount, setMinAmount] = useState(10);
  const [maxAmount, setMaxAmount] = useState(50000);
  const [cooldownHours, setCooldownHours] = useState(24);
  const [principalPenaltyRate, setPrincipalPenaltyRate] = useState(0.10);
  const [lastWithdrawAt, setLastWithdrawAt] = useState<string | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    // Fetch admin withdrawal settings
    supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [
        "withdrawal_fee_rate", "withdrawal_min_amount", "withdrawal_max_amount",
        "withdrawal_enabled", "withdrawal_cooldown_hours", "withdrawal_penalty_tiers",
      ])
      .then(({ data }) => {
        if (data) {
          const map: Record<string, any> = {};
          data.forEach((d) => { map[d.key] = d.value; });
          if (map.withdrawal_enabled !== undefined) setWithdrawalEnabled(!!map.withdrawal_enabled);
          if (map.withdrawal_fee_rate !== undefined) setFeeRate(Number(map.withdrawal_fee_rate));
          if (map.withdrawal_min_amount !== undefined) setMinAmount(Number(map.withdrawal_min_amount));
          if (map.withdrawal_max_amount !== undefined) setMaxAmount(Number(map.withdrawal_max_amount));
          if (map.withdrawal_cooldown_hours !== undefined) setCooldownHours(Number(map.withdrawal_cooldown_hours));
          if (map.withdrawal_penalty_tiers && Array.isArray(map.withdrawal_penalty_tiers)) {
            setPenaltyTiers(map.withdrawal_penalty_tiers);
          }
        }
        setSettingsLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("wallets").select("balance, bonus_balance").eq("user_id", user.id).eq("currency", "USDT").maybeSingle(),
      supabase.from("profits").select("amount").eq("user_id", user.id),
      supabase.from("commissions").select("amount").eq("user_id", user.id),
      supabase.from("transactions").select("amount, created_at").eq("user_id", user.id).eq("type", "withdraw").in("status", ["pending", "approved", "completed"]).order("created_at", { ascending: false }).limit(1),
      supabase.from("transactions").select("created_at").eq("user_id", user.id).eq("type", "deposit").in("status", ["approved", "completed"]).order("created_at", { ascending: true }).limit(1),
      supabase.from("investments").select("amount, bonus_used").eq("user_id", user.id).eq("status", "active"),
    ]).then(([walletRes, profitRes, commRes, lastWdRes, firstDepositRes, investRes]) => {
      setBalance(walletRes.data ? Number(walletRes.data.balance) : 0);
      setBonusBalance(walletRes.data ? Number((walletRes.data as any).bonus_balance) : 0);
      const profitTotal = profitRes.data?.reduce((s, p) => s + Number(p.amount), 0) || 0;
      const commTotal = commRes.data?.reduce((s, c) => s + Number(c.amount), 0) || 0;
      setTotalProfit(profitTotal);
      setTotalCommission(commTotal);
      // Exclude bonus-funded portion from withdrawable principal
      const totalInvested = investRes.data?.reduce((s, i: any) => s + Number(i.amount), 0) || 0;
      const totalBonusUsed = investRes.data?.reduce((s, i: any) => s + Number(i.bonus_used || 0), 0) || 0;
      setActiveBotBalance(totalInvested - totalBonusUsed);
      if (lastWdRes.data && lastWdRes.data.length > 0) {
        setLastWithdrawAt(lastWdRes.data[0].created_at);
      }
      // Calculate penalty rate from admin tiers + first deposit
      if (firstDepositRes.data && firstDepositRes.data.length > 0) {
        const daysSince = Math.floor((Date.now() - new Date(firstDepositRes.data[0].created_at).getTime()) / (1000 * 60 * 60 * 24));
        const sorted = [...penaltyTiers].sort((a, b) => b.days - a.days);
        let rate = sorted.length > 0 ? sorted[sorted.length - 1].rate : 0.30;
        for (const tier of sorted) {
          if (daysSince >= tier.days) {
            rate = tier.rate;
            break;
          }
        }
        setPenaltyRate(rate);
      } else {
        const sorted = [...penaltyTiers].sort((a, b) => a.days - b.days);
        setPenaltyRate(sorted[0]?.rate ?? 0.30);
      }
    });
  }, [user, penaltyTiers]);

  const profitCommissionBalance = totalProfit + totalCommission;
  const amt = parseFloat(amount || "0");

  const isPrincipal = withdrawType === "principal";
  const displayBalance = isPrincipal ? activeBotBalance : balance;
  const withdrawalFee = amt * feeRate;
  const penalty = isPrincipal ? amt * penaltyRate : 0;
  const totalDeduction = withdrawalFee + penalty;
  const netAmount = amt - totalDeduction;

  const maxWithdrawable = isPrincipal ? activeBotBalance : Math.min(balance, profitCommissionBalance);

  // Cooldown check
  const isCooldownActive = (() => {
    if (!lastWithdrawAt || cooldownHours <= 0) return false;
    const lastTime = new Date(lastWithdrawAt).getTime();
    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    return Date.now() - lastTime < cooldownMs;
  })();

  const cooldownRemaining = (() => {
    if (!lastWithdrawAt || cooldownHours <= 0) return "";
    const lastTime = new Date(lastWithdrawAt).getTime();
    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    const remaining = cooldownMs - (Date.now() - lastTime);
    if (remaining <= 0) return "";
    const hours = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  })();

  // Build penalty tier labels from admin settings
  const sortedTiers = [...penaltyTiers].sort((a, b) => a.days - b.days);
  const tierLabels = sortedTiers.map((tier, idx) => {
    const nextTier = sortedTiers[idx + 1];
    let label: string;
    if (idx === sortedTiers.length - 1) {
      label = `≥ ${tier.days} days`;
    } else {
      label = tier.days === 0 ? `< ${nextTier.days} days` : `${tier.days}–${nextTier.days - 1} days`;
    }
    return { label, rate: tier.rate, rateLabel: `${(tier.rate * 100).toFixed(0)}%` };
  });

  const handleSubmit = async () => {
    if (!user || !amount || !walletAddress) return;
    if (!withdrawalEnabled) {
      toast({ title: "Withdrawals Disabled", description: "Withdrawals are currently disabled by admin.", variant: "destructive" });
      return;
    }
    if (isCooldownActive) {
      toast({ title: "Cooldown Active", description: `Please wait ${cooldownRemaining} before next withdrawal.`, variant: "destructive" });
      return;
    }
    if (amt < minAmount) {
      toast({ title: "Below Minimum", description: `Minimum withdrawal is $${minAmount}`, variant: "destructive" });
      return;
    }
    if (amt > maxAmount) {
      toast({ title: "Exceeds Maximum", description: `Maximum withdrawal is $${maxAmount}`, variant: "destructive" });
      return;
    }
    if (amt > balance) {
      toast({ title: "Insufficient balance", description: "Bonus balance cannot be withdrawn.", variant: "destructive" });
      return;
    }
    if (amt <= 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("withdraw-request", {
        body: {
          amount: amt,
          currency: "USDT",
          wallet_address: walletAddress,
          withdraw_type: withdrawType,
          network,
        },
      });

      if (error || !data?.success) {
        toast({ title: "Error", description: data?.error || "Failed to submit withdrawal", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Withdrawal request has been submitted." });
        setAmount("");
        setWalletAddress("");
      }
    } catch (e) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }
    setLoading(false);
  };

  if (!settingsLoaded) {
    return (
      <DashboardLayout title="Withdraw">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!withdrawalEnabled) {
    return (
      <DashboardLayout title="Withdraw">
        <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-8 text-center space-y-3">
            <Ban className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-lg font-display font-bold text-foreground">Withdrawals Disabled</h2>
            <p className="text-sm text-muted-foreground">Withdrawals are currently disabled by the administrator. Please try again later.</p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Withdraw">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Withdraw Type Selector */}
        <div className="flex gap-2">
          {([
            { type: "profit" as WithdrawType, label: "Profit & Commission", desc: `${(feeRate * 100).toFixed(0)}% fee` },
            { type: "principal" as WithdrawType, label: "Principal Deposit", desc: `${(feeRate * 100).toFixed(0)}% fee + Penalty` },
          ]).map((opt) => (
            <button key={opt.type} onClick={() => { setWithdrawType(opt.type); setAmount(""); }} className={`flex-1 py-3 rounded-xl text-xs font-medium transition text-center ${withdrawType === opt.type ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}>
              <p className="font-semibold">{opt.label}</p>
              <p className={`text-[10px] mt-0.5 ${withdrawType === opt.type ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{opt.desc}</p>
            </button>
          ))}
        </div>

        {/* Network Selector */}
        <div className="flex gap-2">
          {NETWORKS.map((n) => (
            <button key={n} onClick={() => setNetwork(n)} className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition ${network === n ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}>
              USDT ({n})
            </button>
          ))}
        </div>

        {/* Balance Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 text-center">
          <p className="text-sm text-muted-foreground">
            {isPrincipal ? "Active Bot Balance (Principal)" : "Available USDT Balance (Withdrawable)"}
          </p>
          <p className="text-2xl font-display font-bold text-foreground">{displayBalance.toFixed(2)} USDT</p>
          {!isPrincipal && bonusBalance > 0 && (
            <p className="text-xs text-warning mt-1">Bonus: ${bonusBalance.toFixed(2)} (activate only)</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">
            Min: ${minAmount} · Max: ${maxAmount.toLocaleString()}
          </p>
        </motion.div>

        {/* Cooldown Warning */}
        {isCooldownActive && (
          <div className="glass rounded-xl p-3 flex items-start gap-2 border border-warning/30">
            <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-warning font-medium">
              Cooldown active. Next withdrawal available in {cooldownRemaining}.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="glass rounded-xl p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {isPrincipal
              ? `Principal deposit withdrawal is subject to a ${(feeRate * 100).toFixed(0)}% fee + penalty based on the duration since your first deposit.`
              : `Profit and commission withdrawals are only subject to a ${(feeRate * 100).toFixed(0)}% fee. No penalty.`}
          </p>
        </div>

        {/* Penalty Info - only for principal */}
        {isPrincipal && (
          <div className="glass rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="w-4 h-4 text-warning" />
              <span>Principal Withdrawal Penalty</span>
            </div>
            <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${tierLabels.length}, 1fr)` }}>
              {tierLabels.map((tier, i) => (
                <div key={i} className={`text-center p-1.5 rounded-lg text-[10px] ${
                  penaltyRate === tier.rate
                    ? "bg-warning/20 text-warning font-bold border border-warning/30"
                    : "bg-muted/30 text-muted-foreground"
                }`}>
                  <p className="font-mono font-bold">{tier.rateLabel}</p>
                  <p>{tier.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">Current penalty: <span className="text-warning font-bold">{(penaltyRate * 100).toFixed(0)}%</span></p>
          </div>
        )}

        {/* Form */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpCircle className="w-5 h-5 text-warning" />
            <span className="text-sm font-medium text-foreground">Withdrawal Details ({network})</span>
          </div>
          <div className="space-y-2">
            <Label>Amount (USDT)</Label>
            <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="glass" min={minAmount} max={maxAmount} />
          </div>
          <div className="space-y-2">
            <Label>USDT Wallet Address ({network})</Label>
            <Input placeholder={`Enter ${network} wallet address`} value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} className="glass" />
          </div>

          {/* Fee Summary */}
          {amt > 0 && (
            <div className="bg-muted/50 rounded-xl p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Fee ({(feeRate * 100).toFixed(0)}%)</span><span className="text-foreground">{withdrawalFee.toFixed(2)} USDT</span></div>
              {isPrincipal && (
                <div className="flex justify-between"><span className="text-muted-foreground">Penalty ({(penaltyRate * 100).toFixed(0)}%)</span><span className="text-warning">{penalty.toFixed(2)} USDT</span></div>
              )}
              <div className="border-t border-border/50 pt-1 mt-1" />
              <div className="flex justify-between"><span className="text-muted-foreground">Total Deduction</span><span className="text-destructive">{totalDeduction.toFixed(2)} USDT</span></div>
              <div className="flex justify-between font-bold"><span className="text-muted-foreground">You Receive</span><span className="text-success">{Math.max(0, netAmount).toFixed(2)} USDT</span></div>
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-warning">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Withdrawals are processed within {cooldownHours}-{cooldownHours * 2} hours. Bonus cannot be withdrawn. Make sure your {network} wallet address is correct.</span>
          </div>

          <Button onClick={handleSubmit} disabled={loading || !amount || !walletAddress || isCooldownActive || amt < minAmount || amt > maxAmount} className="w-full gradient-primary text-primary-foreground">
            {loading ? "Processing..." : "Submit Withdrawal"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Withdraw;
