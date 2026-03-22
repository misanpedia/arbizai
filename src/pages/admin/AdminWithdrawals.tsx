import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const AdminWithdrawals = () => {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [filter, setFilter] = useState("pending");

  const fetchWithdrawals = async () => {
    let q = supabase.from("transactions").select("*").eq("type", "withdraw").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter as any);
    const { data } = await q;
    if (data) setWithdrawals(data);
  };

  useEffect(() => { fetchWithdrawals(); }, [filter]);

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    const tx = withdrawals.find(w => w.id === id);
    if (action === "approved" && tx) {
      const { data, error: rpcError } = await supabase.functions.invoke("admin-wallet-op", {
        body: { op: "debit", user_id: tx.user_id, currency: tx.currency, amount: Number(tx.amount) },
      });
      if (rpcError || data?.success === false) {
        toast({ title: "Insufficient balance or wallet error", description: rpcError?.message || data?.error, variant: "destructive" });
        return;
      }
    }
    const { error } = await supabase.from("transactions").update({ status: action }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Withdrawal ${action}` }); fetchWithdrawals(); }
  };

  return (
    <AdminLayout title="Withdrawals">
      <div className="space-y-4">
        <div className="flex gap-2">
          {["pending", "approved", "rejected", "all"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${filter === f ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}>{f}</button>
          ))}
        </div>
        <div className="grid gap-2">
          {withdrawals.map(w => (
            <div key={w.id} className="glass-strong rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">${Number(w.amount).toFixed(2)} {w.currency}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(w.created_at).toLocaleString()}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${w.status === "pending" ? "bg-warning/15 text-warning" : w.status === "approved" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{w.status}</span>
              </div>
              {w.description && (() => {
                const networkMatch = w.description?.match(/\(([^)]+)\)/);
                const network = networkMatch ? networkMatch[1] : null;
                return network ? (
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary mb-1">{network}</span>
                ) : null;
              })()}
              {w.wallet_address && <p className="text-[10px] text-muted-foreground font-mono break-all mb-1">Wallet: {w.wallet_address}</p>}
              {w.metadata && (w.metadata as any).penalty_rate > 0 && (
                <div className="text-[10px] text-warning mb-2">
                  Penalty: {((w.metadata as any).penalty_rate * 100).toFixed(0)}% (${Number((w.metadata as any).penalty_amount).toFixed(2)}) | Fee: ${Number(w.fee).toFixed(2)} | Net: ${Number((w.metadata as any).net_amount).toFixed(2)}
                </div>
              )}
              {w.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAction(w.id, "approved")} className="flex-1 bg-success/10 text-success hover:bg-success/20 h-8 text-xs"><Check className="w-3 h-3 mr-1" />Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => handleAction(w.id, "rejected")} className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 h-8 text-xs"><X className="w-3 h-3 mr-1" />Reject</Button>
                </div>
              )}
            </div>
          ))}
          {withdrawals.length === 0 && <p className="text-muted-foreground text-center py-8">No withdrawals found</p>}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWithdrawals;
