import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Copy, QrCode, Wallet, CreditCard, Zap, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface DepositNetwork {
  id: string;
  network: string;
  address: string;
  warning: string;
  is_active: boolean;
}

const FALLBACK_NETWORKS: DepositNetwork[] = [
  { id: "BEP20", network: "BEP20", address: "", warning: "Only send USDT on BNB Smart Chain (BEP20)", is_active: true },
  { id: "TRC20", network: "TRC20", address: "", warning: "Only send USDT on TRON Network (TRC20)", is_active: true },
  { id: "ERC20", network: "ERC20", address: "", warning: "Only send USDT on Ethereum Network (ERC20)", is_active: true },
];

const DEPOSIT_EXPIRY_MINUTES = 60; // 1 hour countdown

const CountdownTimer = ({ createdAt, onExpired }: { createdAt: string; onExpired?: () => void }) => {
  const [remaining, setRemaining] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const expiryTime = new Date(createdAt).getTime() + DEPOSIT_EXPIRY_MINUTES * 60 * 1000;

    const tick = () => {
      const now = Date.now();
      const diff = expiryTime - now;
      if (diff <= 0) {
        setExpired(true);
        setRemaining("Expired");
        onExpired?.();
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [createdAt, onExpired]);

  return (
    <span className={`text-xs font-mono flex items-center gap-1 ${expired ? "text-destructive" : "text-warning"}`}>
      <Clock className="w-3 h-3" />
      {remaining}
    </span>
  );
};

const Deposit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [method, setMethod] = useState<"manual" | "auto">("auto");
  const [network, setNetwork] = useState("BEP20");
  const [networks, setNetworks] = useState<DepositNetwork[]>(FALLBACK_NETWORKS);
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);

  useEffect(() => {
    const fetchWallets = async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "deposit_wallets")
        .maybeSingle();
      if (data?.value && Array.isArray(data.value)) {
        const active = (data.value as unknown as DepositNetwork[]).filter(w => w.is_active && w.address);
        if (active.length > 0) {
          setNetworks(active);
          setNetwork(active[0].id);
        }
      }
    };
    fetchWallets();
  }, []);

  // Fetch user's pending deposits
  useEffect(() => {
    if (!user) return;
    const fetchPending = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "deposit")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (data) setPendingDeposits(data);
    };
    fetchPending();
  }, [user]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Wallet address copied to clipboard" });
  };

  const handleExpireDeposit = async (id: string) => {
    await supabase.from("transactions").update({ status: "cancelled" as const }).eq("id", id);
    
    // Send expiry notification to user
    if (user) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "⏰ Deposit Expired",
        message: "Your pending deposit has expired due to timeout. Please submit a new deposit request if you'd like to continue.",
        type: "info",
      });
    }
    
    setPendingDeposits(prev => prev.map(d => d.id === id ? { ...d, status: "cancelled" } : d));
    toast({ title: "Deposit Expired", description: "Your deposit request has expired. You can submit a new one.", variant: "destructive" });
  };

  const handleManualSubmit = async () => {
    if (!user || !amount || !txHash) return;
    setLoading(true);
    const { data: inserted, error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "deposit" as const,
      amount: parseFloat(amount),
      currency: "USDT",
      tx_hash: txHash,
      status: "pending" as const,
      description: `Deposit ${amount} USDT (${network})`,
    }).select().single();
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Deposit request submitted. You have 60 minutes to complete payment." });
      setAmount("");
      setTxHash("");
      if (inserted) setPendingDeposits(prev => [inserted, ...prev]);
    }
  };

  const handleAutoDeposit = async () => {
    if (!user || !amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { amount: parseFloat(amount), currency: "usd" },
      });
      if (error) throw error;
      if (data?.invoice_url) {
        window.open(data.invoice_url, "_blank");
        toast({ title: "Payment page opened", description: "Complete your payment in the new tab." });
      } else {
        throw new Error("No invoice URL returned");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const activePending = pendingDeposits.filter(d => d.status === "pending");

  return (
    <DashboardLayout title="Deposit">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Method Selector */}
        <div className="flex gap-2">
          <button onClick={() => setMethod("auto")} className={`flex-1 py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${method === "auto" ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}>
            <Zap className="w-4 h-4" /> Auto (NOWPayments)
          </button>
          <button onClick={() => setMethod("manual")} className={`flex-1 py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${method === "manual" ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}>
            <CreditCard className="w-4 h-4" /> Manual Transfer
          </button>
        </div>

        {method === "auto" ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Instant Crypto Payment</span>
            </div>
            <p className="text-xs text-muted-foreground">Pay with 150+ cryptocurrencies via NOWPayments. Your deposit will be credited automatically after confirmation.</p>
            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <Input type="number" placeholder="Enter amount in USD" value={amount} onChange={(e) => setAmount(e.target.value)} className="glass" />
            </div>
            <Button onClick={handleAutoDeposit} disabled={loading || !amount || parseFloat(amount) <= 0} className="w-full gradient-primary text-primary-foreground">
              {loading ? "Processing..." : `Pay $${amount || "0"} with Crypto`}
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Network Selector */}
            <div className="flex gap-2">
              {networks.map((n) => (
                <button key={n.id} onClick={() => setNetwork(n.id)} className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition ${network === n.id ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}>
                  {n.network}
                </button>
              ))}
            </div>

            {/* Wallet Address */}
            {(() => {
              const selected = networks.find(n => n.id === network)!;
              return (
                <motion.div key={network} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <QrCode className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Send USDT ({network}) to this address</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-3">
                    <code className="text-xs flex-1 break-all text-foreground">{selected.address}</code>
                    <button onClick={() => handleCopy(selected.address)} className="p-2 rounded-lg hover:bg-muted transition text-primary">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-warning">⚠️ {selected.warning}. Sending other tokens may result in permanent loss.</p>
                </motion.div>
              );
            })()}

            {/* Form */}
            <div className="glass-strong rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Confirm Your Deposit</span>
              </div>
              <p className="text-[10px] text-muted-foreground">⏰ You have {DEPOSIT_EXPIRY_MINUTES} minutes to complete payment after submitting.</p>
              <div className="space-y-2">
                <Label>Amount (USDT)</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="glass" />
              </div>
              <div className="space-y-2">
                <Label>Transaction Hash (TxID)</Label>
                <Input placeholder="Enter your transaction hash" value={txHash} onChange={(e) => setTxHash(e.target.value)} className="glass" />
              </div>
              <Button onClick={handleManualSubmit} disabled={loading || !amount || !txHash} className="w-full gradient-primary text-primary-foreground">
                {loading ? "Submitting..." : "Submit Deposit"}
              </Button>
            </div>
          </>
        )}

        {/* Pending deposits warning */}
        {activePending.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              <span className="text-sm font-medium text-foreground">Pending Deposits ({activePending.length})</span>
            </div>
            <p className="text-xs text-muted-foreground">⚠️ You have deposits awaiting confirmation. Please wait for them to complete before submitting a new deposit.</p>
            <div className="space-y-2">
              {activePending.map(d => (
                <div key={d.id} className="bg-muted/50 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">${Number(d.amount).toFixed(2)} USDT</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleString()}</p>
                  </div>
                  <CountdownTimer createdAt={d.created_at} onExpired={() => handleExpireDeposit(d.id)} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Deposit;
