import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Copy, QrCode, Wallet, Zap, Clock, Globe, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const DEPOSIT_EXPIRY_MINUTES = 60;

const NETWORKS = [
  { id: "BSC", label: "BNB Smart Chain (BEP20)" },
  { id: "ETH", label: "Ethereum (ERC20)" },
  { id: "TRON", label: "Tron (TRC20)" },
];

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
  const [method, setMethod] = useState<"auto" | "manual">("auto");
  const [selectedNetwork, setSelectedNetwork] = useState("BSC");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);

  // Static address state
  const [staticAddress, setStaticAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Manual deposit wallet addresses from system_settings
  const [manualWallets, setManualWallets] = useState<{ network: string; address: string; warning: string }[]>([]);
  const [manualNetwork, setManualNetwork] = useState("BEP20");

  useEffect(() => {
    const fetchWallets = async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "deposit_wallets")
        .maybeSingle();
      if (data?.value && Array.isArray(data.value)) {
        const active = (data.value as any[]).filter((w: any) => w.is_active && w.address);
        if (active.length > 0) {
          setManualWallets(active);
          setManualNetwork(active[0].network || active[0].id);
        }
      }
    };
    fetchWallets();
  }, []);

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

  // Fetch or generate static address when network changes (auto mode)
  useEffect(() => {
    if (method !== "auto" || !user) return;
    setStaticAddress(null);
    fetchStaticAddress(selectedNetwork);
  }, [selectedNetwork, method, user]);

  const fetchStaticAddress = async (network: string) => {
    if (!user) return;
    setLoadingAddress(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-static-address", {
        body: { network, currency: "USDT" },
      });
      if (error) throw error;
      if (data?.address) {
        setStaticAddress(data.address);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error("Static address error:", e);
      toast({ title: "Error", description: e.message || "Failed to generate address", variant: "destructive" });
    }
    setLoadingAddress(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Address copied to clipboard" });
  };

  const handleExpireDeposit = async (id: string) => {
    await supabase.from("transactions").update({ status: "cancelled" as const }).eq("id", id);
    if (user) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "⏰ Deposit Expired",
        message: "Your pending deposit has expired. Please submit a new deposit request.",
        type: "info",
      });
    }
    setPendingDeposits(prev => prev.map(d => d.id === id ? { ...d, status: "cancelled" } : d));
    toast({ title: "Deposit Expired", description: "Your deposit request has expired.", variant: "destructive" });
  };

  const handleAutoDeposit = async () => {
    if (!user || !amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          amount: parseFloat(amount),
          currency: "USDT",
          network: selectedNetwork,
        },
      });
      if (error) throw error;
      if (data?.payment_url) {
        window.open(data.payment_url, "_blank");
        toast({ title: "Payment page opened", description: "Complete your payment in the new tab." });
        // Refresh pending deposits
        const { data: pending } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "deposit")
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        if (pending) setPendingDeposits(pending);
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setLoading(false);
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
      description: `Deposit ${amount} USDT (${manualNetwork}) - Manual`,
    }).select().single();
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Deposit submitted. Awaiting admin confirmation." });
      setAmount("");
      setTxHash("");
      if (inserted) setPendingDeposits(prev => [inserted, ...prev]);
    }
  };

  const activePending = pendingDeposits.filter(d => d.status === "pending");

  return (
    <DashboardLayout title="Deposit">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Method Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setMethod("auto")}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${method === "auto" ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}
          >
            <Zap className="w-4 h-4" /> OxaPay (Auto)
          </button>
          <button
            onClick={() => setMethod("manual")}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${method === "manual" ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}
          >
            <Wallet className="w-4 h-4" /> Manual Transfer
          </button>
        </div>

        {method === "auto" ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Network Selector */}
            <div className="glass-strong rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Select Network</span>
              </div>
              <div className="flex gap-2">
                {NETWORKS.map(n => (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNetwork(n.id)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition ${selectedNetwork === n.id ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}
                  >
                    {n.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Your Unique Deposit Address */}
            <div className="glass-strong rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Your Unique Deposit Address</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Send <span className="font-semibold text-foreground">USDT</span> on{" "}
                <span className="font-semibold text-foreground">{NETWORKS.find(n => n.id === selectedNetwork)?.label}</span>{" "}
                to the address below. Your deposit will be credited automatically.
              </p>

              {loadingAddress ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Generating your address...</span>
                </div>
              ) : staticAddress ? (
                <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-3">
                  <code className="text-xs flex-1 break-all text-foreground">{staticAddress}</code>
                  <button
                    onClick={() => handleCopy(staticAddress)}
                    className="p-2 rounded-lg hover:bg-muted transition text-primary shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Failed to generate address. Please try again.
                </div>
              )}

              <p className="text-xs text-warning">
                ⚠️ Only send USDT on {NETWORKS.find(n => n.id === selectedNetwork)?.label}. Sending other tokens or using the wrong network may result in permanent loss.
              </p>
            </div>

          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Manual Network Selector */}
            {manualWallets.length > 0 && (
              <>
                <div className="flex gap-2">
                  {manualWallets.map((w: any) => (
                    <button
                      key={w.network || w.id}
                      onClick={() => setManualNetwork(w.network || w.id)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition ${manualNetwork === (w.network || w.id) ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}
                    >
                      {w.network || w.id}
                    </button>
                  ))}
                </div>

                {(() => {
                  const selected = manualWallets.find((w: any) => (w.network || w.id) === manualNetwork);
                  if (!selected) return null;
                  return (
                    <div className="glass-strong rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <QrCode className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">Send USDT ({manualNetwork})</span>
                      </div>
                      <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-3">
                        <code className="text-xs flex-1 break-all text-foreground">{(selected as any).address || "No address configured"}</code>
                        {(selected as any).address && (
                          <button onClick={() => handleCopy((selected as any).address)} className="p-2 rounded-lg hover:bg-muted transition text-primary">
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-warning">⚠️ {(selected as any).warning || `Only send USDT on ${manualNetwork}`}</p>
                    </div>
                  );
                })()}
              </>
            )}

            {/* Manual Form */}
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
          </motion.div>
        )}

        {/* Pending deposits */}
        {activePending.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              <span className="text-sm font-medium text-foreground">Pending Deposits ({activePending.length})</span>
            </div>
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
