import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Copy, QrCode, Globe, Loader2, Clock } from "lucide-react";
import { motion } from "framer-motion";

const DEPOSIT_EXPIRY_MINUTES = 60;
const MIN_DEPOSIT = 10;

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
  const [selectedNetwork, setSelectedNetwork] = useState("BSC");
  const [loading, setLoading] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [staticAddress, setStaticAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

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

  useEffect(() => {
    if (!user) return;
    setStaticAddress(null);
    fetchStaticAddress(selectedNetwork);
  }, [selectedNetwork, user]);

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

  const activePending = pendingDeposits.filter(d => d.status === "pending");

  return (
    <DashboardLayout title="Deposit">
      <div className="max-w-lg mx-auto space-y-6">
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

            <div className="bg-primary/5 rounded-xl p-3 space-y-1">
              <p className="text-xs font-medium text-foreground">📋 Deposit Info</p>
              <p className="text-xs text-muted-foreground">• Minimum deposit: <span className="font-semibold text-foreground">${MIN_DEPOSIT}</span></p>
              <p className="text-xs text-muted-foreground">• Deposits below ${MIN_DEPOSIT} will not be credited</p>
            </div>

            <p className="text-xs text-warning">
              ⚠️ Only send USDT on {NETWORKS.find(n => n.id === selectedNetwork)?.label}. Sending other tokens or using the wrong network may result in permanent loss.
            </p>
          </div>
        </motion.div>

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
