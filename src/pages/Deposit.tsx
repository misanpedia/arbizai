import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Copy, QrCode, Globe, Clock, Upload, DollarSign, AlertTriangle, CreditCard, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MIN_DEPOSIT = 10;

interface DepositWallet {
  id: string;
  network: string;
  address: string;
  warning: string;
  is_active: boolean;
}

const Deposit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallets, setWallets] = useState<DepositWallet[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [method, setMethod] = useState<"manual" | "auto">("manual");
  const [gatewayEnabled, setGatewayEnabled] = useState(false);
  const [gatewayMin, setGatewayMin] = useState(MIN_DEPOSIT);
  const [autoAmount, setAutoAmount] = useState("");
  const [autoLoading, setAutoLoading] = useState(false);

  useEffect(() => {
    const fetchWallets = async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "deposit_wallets")
        .maybeSingle();
      if (data?.value && Array.isArray(data.value)) {
        const active = (data.value as unknown as DepositWallet[]).filter(w => w.is_active);
        setWallets(active);
        if (active.length > 0) setSelectedNetwork(active[0].network);
      }
    };
    fetchWallets();
  }, []);

  useEffect(() => {
    supabase
      .from("system_settings")
      .select("value")
      .eq("key", "nowpayments_public")
      .maybeSingle()
      .then(({ data }) => {
        const v = data?.value as { enabled?: boolean; min_amount?: number } | null;
        if (v?.enabled) {
          setGatewayEnabled(true);
          setGatewayMin(Number(v.min_amount ?? MIN_DEPOSIT));
        }
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "deposit")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setPendingDeposits(data); });
  }, [user]);

  const selectedWallet = wallets.find(w => w.network === selectedNetwork);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Address copied to clipboard" });
  };

  const handleAutoPay = async () => {
    const amt = parseFloat(autoAmount || "0");
    if (!amt || amt < gatewayMin) {
      toast({ title: `Minimum deposit is $${gatewayMin}`, variant: "destructive" });
      return;
    }
    setAutoLoading(true);
    const { data, error } = await supabase.functions.invoke("nowpayments-create-payment", {
      body: { amount: amt, success_url: `${window.location.origin}/deposit`, cancel_url: `${window.location.origin}/deposit` },
    });
    setAutoLoading(false);
    if (error || !data?.invoice_url) {
      toast({ title: "Payment error", description: data?.error || error?.message || "Failed to create invoice", variant: "destructive" });
      return;
    }
    window.open(data.invoice_url, "_blank");
    toast({ title: "Invoice created", description: "Complete the payment in the new tab. Balance credits automatically." });
    setAutoAmount("");
  };

  const handleSubmitDeposit = async () => {
    if (!user || !amount || !selectedWallet) return;
    const amt = parseFloat(amount);
    if (amt < MIN_DEPOSIT) {
      toast({ title: "Minimum deposit is $" + MIN_DEPOSIT, variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "deposit",
      amount: amt,
      currency: "USDT",
      status: "pending",
      network: selectedNetwork,
      tx_hash: txHash || null,
      wallet_address: selectedWallet.address,
      description: `Manual deposit $${amt} USDT via ${selectedNetwork}`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deposit Submitted!", description: "Your deposit is pending admin approval." });
      setAmount("");
      setTxHash("");
      // Send Telegram notification for new deposit
      try {
        const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("user_id", user.id).maybeSingle();
        await supabase.functions.invoke("telegram-notify", {
          body: {
            event: "new_deposit",
            data: {
              user_name: profile?.full_name || user.email || "Unknown",
              user_email: profile?.email || user.email || "-",
              amount: amt,
              currency: "USDT",
              network: selectedNetwork,
              tx_hash: txHash || null,
              deposit_date: new Date().toISOString().slice(0, 19).replace("T", " "),
            },
          },
        });
      } catch (_) { /* non-critical */ }
      // Refresh pending
      const { data } = await supabase.from("transactions").select("*").eq("user_id", user.id).eq("type", "deposit").eq("status", "pending").order("created_at", { ascending: false });
      if (data) setPendingDeposits(data);
    }
  };

  return (
    <DashboardLayout title="Deposit">
      <div className="max-w-lg mx-auto space-y-6">
        {gatewayEnabled && (
          <div className="glass-strong rounded-2xl p-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => setMethod("manual")}
              className={`py-2.5 rounded-xl text-xs font-medium transition ${method === "manual" ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Manual Transfer
            </button>
            <button
              onClick={() => setMethod("auto")}
              className={`py-2.5 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1 ${method === "auto" ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Zap className="w-3.5 h-3.5" /> Auto Pay
            </button>
          </div>
        )}

        {gatewayEnabled && method === "auto" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Instant Crypto Payment</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Pay with crypto through our payment gateway. Your balance is credited automatically once the payment is confirmed on-chain.
            </p>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Amount (USD) *</label>
              <Input type="number" placeholder={`Min $${gatewayMin}`} value={autoAmount} onChange={e => setAutoAmount(e.target.value)} className="glass" min={gatewayMin} />
            </div>
            <Button onClick={handleAutoPay} disabled={autoLoading || !autoAmount} className="w-full gradient-primary text-primary-foreground">
              <Zap className="w-4 h-4 mr-2" />
              {autoLoading ? "Creating invoice..." : "Pay Now"}
            </Button>
            <p className="text-[10px] text-muted-foreground">No admin approval needed — confirmation is automatic.</p>
          </motion.div>
        )}

        {(!gatewayEnabled || method === "manual") && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Network Selector */}
          {wallets.length > 0 && (
            <div className="glass-strong rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Select Network</span>
              </div>
              <div className="flex gap-2">
                {wallets.map(w => (
                  <button
                    key={w.network}
                    onClick={() => setSelectedNetwork(w.network)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition ${selectedNetwork === w.network ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}
                  >
                    {w.network}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Wallet Address Display */}
          {selectedWallet && (
            <div className="glass-strong rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Deposit Address ({selectedNetwork})</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Send <span className="font-semibold text-foreground">USDT</span> on{" "}
                <span className="font-semibold text-foreground">{selectedNetwork}</span> to the address below.
                After transferring, submit the form to notify admin.
              </p>

              <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-3">
                <code className="text-xs flex-1 break-all text-foreground">{selectedWallet.address}</code>
                <button
                  onClick={() => handleCopy(selectedWallet.address)}
                  className="p-2 rounded-lg hover:bg-muted transition text-primary shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {selectedWallet.warning && (
                <p className="text-xs text-warning flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                  {selectedWallet.warning}
                </p>
              )}
            </div>
          )}

          {/* Deposit Form */}
          {selectedWallet && (
            <div className="glass-strong rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Submit Deposit</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Amount (USDT) *</label>
                  <Input type="number" placeholder={`Min $${MIN_DEPOSIT}`} value={amount} onChange={e => setAmount(e.target.value)} className="glass" min={MIN_DEPOSIT} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Transaction Hash (optional)</label>
                  <Input placeholder="0x..." value={txHash} onChange={e => setTxHash(e.target.value)} className="glass font-mono text-xs" />
                </div>
              </div>

              <div className="bg-primary/5 rounded-xl p-3 space-y-1">
                <p className="text-xs font-medium text-foreground">📋 Deposit Info</p>
                <p className="text-xs text-muted-foreground">• Minimum deposit: <span className="font-semibold text-foreground">${MIN_DEPOSIT}</span></p>
                <p className="text-xs text-muted-foreground">• Deposits are manually verified by admin</p>
                <p className="text-xs text-muted-foreground">• Processing time: 1-24 hours</p>
              </div>

              <Button onClick={handleSubmitDeposit} disabled={loading || !amount || parseFloat(amount) < MIN_DEPOSIT} className="w-full gradient-primary text-primary-foreground">
                <DollarSign className="w-4 h-4 mr-2" />
                {loading ? "Submitting..." : "Submit Deposit Request"}
              </Button>
            </div>
          )}

          {wallets.length === 0 && (
            <div className="glass-strong rounded-2xl p-8 text-center">
              <AlertTriangle className="w-10 h-10 text-warning mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Deposit is currently unavailable. Please contact support.</p>
            </div>
          )}
        </motion.div>
        )}

        {/* Deposit history with commission status */}
        {pendingDeposits.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Deposit History</span>
            </div>
            <div className="space-y-2">
              {pendingDeposits.map(d => (
                <div key={d.id} className="bg-muted/50 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">${Number(d.amount).toFixed(2)} USDT</p>
                    <p className="text-[10px] text-muted-foreground">{d.network || "BEP20"} · {new Date(d.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      d.status === "approved" ? "bg-success/15 text-success" :
                      d.status === "rejected" ? "bg-destructive/15 text-destructive" :
                      "bg-warning/15 text-warning"
                    }`}>
                      {d.status === "approved" ? "Approved" : d.status === "rejected" ? "Rejected" : "Pending"}
                    </span>
                    {d.status === "approved" && (
                      <p className="text-[9px] text-success">✓ Commissions distributed</p>
                    )}
                    {d.status === "pending" && (
                      <p className="text-[9px] text-muted-foreground">Awaiting approval</p>
                    )}
                  </div>
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
