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

const Withdraw = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [network, setNetwork] = useState("BEP20");
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const [withdrawalEnabled, setWithdrawalEnabled] = useState(true);
  const [feeRate, setFeeRate] = useState(0.05);
  const [minAmount, setMinAmount] = useState(10);
  const [maxAmount, setMaxAmount] = useState(50000);
  const [cooldownHours, setCooldownHours] = useState(24);
  const [lastWithdrawAt, setLastWithdrawAt] = useState<string | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [
        "withdrawal_fee_rate", "withdrawal_min_amount", "withdrawal_max_amount",
        "withdrawal_enabled", "withdrawal_cooldown_hours",
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
        }
        setSettingsLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("wallets").select("balance, bonus_balance").eq("user_id", user.id).eq("currency", "USDT").maybeSingle(),
      supabase.from("transactions").select("amount, created_at").eq("user_id", user.id).eq("type", "withdraw").in("status", ["pending", "approved", "completed"]).order("created_at", { ascending: false }).limit(1),
    ]).then(([walletRes, lastWdRes]) => {
      setBalance(walletRes.data ? Number(walletRes.data.balance) : 0);
      setBonusBalance(walletRes.data ? Number((walletRes.data as any).bonus_balance) : 0);
      if (lastWdRes.data && lastWdRes.data.length > 0) {
        setLastWithdrawAt(lastWdRes.data[0].created_at);
      }
    });
  }, [user]);

  const amt = parseFloat(amount || "0");
  const withdrawalFee = amt * feeRate;
  const netAmount = amt - withdrawalFee;

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

  const handleSubmit = async () => {
    if (!user || !amount || !walletAddress) return;
    if (!withdrawalEnabled) {
      toast({ title: "Withdrawals Disabled", variant: "destructive" });
      return;
    }
    if (isCooldownActive) {
      toast({ title: "Cooldown Active", description: `Please wait ${cooldownRemaining}`, variant: "destructive" });
      return;
    }
    if (amt < minAmount) {
      toast({ title: "Below Minimum", description: `Minimum is $${minAmount}`, variant: "destructive" });
      return;
    }
    if (amt > maxAmount) {
      toast({ title: "Exceeds Maximum", description: `Maximum is $${maxAmount}`, variant: "destructive" });
      return;
    }
    if (amt > balance) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("withdraw-request", {
        body: { amount: amt, currency: "USDT", wallet_address: walletAddress, withdraw_type: "profit", network },
      });
      if (error || !data?.success) {
        toast({ title: "Error", description: data?.error || "Failed to submit withdrawal", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Withdrawal request submitted." });
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
            <p className="text-sm text-muted-foreground">Withdrawals are currently disabled. Please try again later.</p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Withdraw">
      <div className="max-w-lg mx-auto space-y-6">
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
          <p className="text-sm text-muted-foreground">Available USDT Balance</p>
          <p className="text-2xl font-display font-bold text-foreground">{balance.toFixed(2)} USDT</p>
          {bonusBalance > 0 && (
            <p className="text-xs text-warning mt-1">Bonus: ${bonusBalance.toFixed(2)} (activate only)</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">
            Min: ${minAmount} · Max: ${maxAmount.toLocaleString()} · Fee: {(feeRate * 100).toFixed(0)}%
          </p>
        </motion.div>

        {/* Cooldown Warning */}
        {isCooldownActive && (
          <div className="glass rounded-xl p-3 flex items-start gap-2 border border-warning/30">
            <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-warning font-medium">
              Cooldown active. Next withdrawal in {cooldownRemaining}.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="glass rounded-xl p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Withdrawal fee: {(feeRate * 100).toFixed(0)}%. No principal withdrawal — your investment runs until 300% ROI is reached.</p>
            <p>Withdrawable balance includes profits and commissions only.</p>
          </div>
        </div>

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

          {amt > 0 && (
            <div className="bg-muted/50 rounded-xl p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Fee ({(feeRate * 100).toFixed(0)}%)</span><span className="text-foreground">{withdrawalFee.toFixed(2)} USDT</span></div>
              <div className="border-t border-border/50 pt-1 mt-1" />
              <div className="flex justify-between font-bold"><span className="text-muted-foreground">You Receive</span><span className="text-success">{Math.max(0, netAmount).toFixed(2)} USDT</span></div>
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-warning">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Withdrawals are processed within 1-24 hours. Bonus balance cannot be withdrawn. Make sure your {network} wallet address is correct.</span>
          </div>

          <Button onClick={handleSubmit} disabled={loading || !amount || !walletAddress || isCooldownActive || amt < minAmount || amt > maxAmount || amt > balance} className="w-full gradient-primary text-primary-foreground">
            {loading ? "Processing..." : "Submit Withdrawal"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Withdraw;
