import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, Hash, User, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

const DEPOSIT_EXPIRY_MINUTES = 60;

const DepositCountdown = ({ createdAt }: { createdAt: string }) => {
  const [remaining, setRemaining] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const expiryTime = new Date(createdAt).getTime() + DEPOSIT_EXPIRY_MINUTES * 60 * 1000;
    const tick = () => {
      const diff = expiryTime - Date.now();
      if (diff <= 0) { setExpired(true); setRemaining("Expired"); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}:${secs.toString().padStart(2, "0")}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <span className={`text-[10px] font-mono flex items-center gap-1 ${expired ? "text-destructive" : "text-warning"}`}>
      <Clock className="w-3 h-3" />{remaining}
    </span>
  );
};

const AdminDeposits = () => {
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchDeposits = async () => {
    let q = supabase.from("transactions").select("*").eq("type", "deposit").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter as any);
    const { data } = await q;
    if (data) {
      setDeposits(data);
      // Fetch profiles for all unique user_ids
      const userIds = [...new Set(data.map(d => d.user_id))];
      if (userIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("user_id, full_name, referral_code").in("user_id", userIds);
        if (profs) {
          const map: Record<string, any> = {};
          profs.forEach(p => { map[p.user_id] = p; });
          setProfiles(map);
        }
      }
    }
  };

  useEffect(() => { fetchDeposits(); }, [filter]);

  useEffect(() => {
    if (filter !== "pending") return;
    const expireOld = async () => {
      const cutoff = new Date(Date.now() - DEPOSIT_EXPIRY_MINUTES * 60 * 1000).toISOString();
      await supabase
        .from("transactions")
        .update({ status: "cancelled" as const })
        .eq("type", "deposit")
        .eq("status", "pending")
        .lt("created_at", cutoff);
      fetchDeposits();
    };
    expireOld();
  }, [filter]);

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    const tx = deposits.find(d => d.id === id);
    if (action === "approved" && tx) {
      const { error: rpcError } = await supabase.functions.invoke("admin-wallet-op", {
        body: { op: "credit", user_id: tx.user_id, currency: tx.currency, amount: Number(tx.amount) },
      });
      if (rpcError) {
        toast({ title: "Error crediting wallet", description: rpcError.message, variant: "destructive" });
        return;
      }
    }
    const { error } = await supabase.from("transactions").update({ status: action }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Deposit ${action}` }); fetchDeposits(); }
  };

  const getMetadata = (d: any) => {
    if (!d.metadata || typeof d.metadata !== "object") return null;
    return d.metadata as Record<string, any>;
  };

  return (
    <AdminLayout title="Deposits">
      <div className="space-y-4">
        <div className="flex gap-2">
          {["pending", "approved", "rejected", "completed", "cancelled", "all"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${filter === f ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}>{f === "cancelled" ? "expired" : f}</button>
          ))}
        </div>
        <div className="grid gap-2">
          {deposits.map(d => {
            const meta = getMetadata(d);
            const profile = profiles[d.user_id];
            const isExpanded = expandedId === d.id;

            return (
              <div key={d.id} className="glass-strong rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-medium text-foreground">${Number(d.amount).toFixed(2)} {d.currency}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">{profile?.full_name || d.user_id.slice(0, 8)}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      d.status === "pending" ? "bg-warning/15 text-warning" : 
                      d.status === "approved" || d.status === "completed" ? "bg-success/15 text-success" : 
                      d.status === "cancelled" ? "bg-muted text-muted-foreground" : 
                      "bg-destructive/15 text-destructive"
                    }`}>{d.status === "cancelled" ? "expired" : d.status}</span>
                    {d.status === "pending" && <DepositCountdown createdAt={d.created_at} />}
                  </div>
                </div>

                {/* Tx Hash (always visible if present) */}
                {d.tx_hash && (
                  <div className="flex items-start gap-1.5 mt-2 bg-muted/30 rounded-lg p-2">
                    <Hash className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground font-medium">TxHash (Member Input)</p>
                      <p className="text-[10px] text-foreground font-mono break-all">{d.tx_hash}</p>
                    </div>
                  </div>
                )}

                {/* Description */}
                {d.description && (
                  <p className="text-[10px] text-muted-foreground mt-1.5">📝 {d.description}</p>
                )}

                {/* Expand/Collapse for NOWPayments details */}
                {meta && Object.keys(meta).length > 0 && (
                  <button 
                    onClick={() => setExpandedId(isExpanded ? null : d.id)}
                    className="flex items-center gap-1 mt-2 text-[10px] text-primary hover:underline"
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {isExpanded ? "Hide" : "Show"} Payment Details
                  </button>
                )}

                {isExpanded && meta && (
                  <div className="mt-2 bg-muted/20 rounded-lg p-3 space-y-1.5 text-[10px]">
                    {meta.nowpayments_invoice_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Invoice ID</span>
                        <span className="text-foreground font-mono">{meta.nowpayments_invoice_id}</span>
                      </div>
                    )}
                    {meta.payment_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment ID</span>
                        <span className="text-foreground font-mono">{meta.payment_id}</span>
                      </div>
                    )}
                    {meta.payment_status && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Status</span>
                        <span className="text-foreground font-medium">{meta.payment_status}</span>
                      </div>
                    )}
                    {meta.pay_currency && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pay Currency</span>
                        <span className="text-foreground uppercase">{meta.pay_currency}</span>
                      </div>
                    )}
                    {meta.pay_amount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pay Amount</span>
                        <span className="text-foreground">{meta.pay_amount}</span>
                      </div>
                    )}
                    {meta.actually_paid && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Actually Paid</span>
                        <span className="text-foreground">{meta.actually_paid}</span>
                      </div>
                    )}
                    {meta.payin_hash && (
                      <div>
                        <span className="text-muted-foreground">Payin Hash</span>
                        <p className="text-foreground font-mono break-all mt-0.5">{meta.payin_hash}</p>
                      </div>
                    )}
                    {meta.outcome_amount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Outcome Amount</span>
                        <span className="text-foreground">{meta.outcome_amount} {meta.outcome_currency || ""}</span>
                      </div>
                    )}
                    {meta.order_id && (
                      <div>
                        <span className="text-muted-foreground">Order ID</span>
                        <p className="text-foreground font-mono break-all mt-0.5">{meta.order_id}</p>
                      </div>
                    )}
                    {meta.created_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">NOWPayments Created</span>
                        <span className="text-foreground">{new Date(meta.created_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {d.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => handleAction(d.id, "approved")} className="flex-1 bg-success/10 text-success hover:bg-success/20 h-8 text-xs"><Check className="w-3 h-3 mr-1" />Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(d.id, "rejected")} className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 h-8 text-xs"><X className="w-3 h-3 mr-1" />Reject</Button>
                  </div>
                )}
              </div>
            );
          })}
          {deposits.length === 0 && <p className="text-muted-foreground text-center py-8">No deposits found</p>}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDeposits;
