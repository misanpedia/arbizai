import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, Wallet, Calendar, Filter, ArrowRightLeft } from "lucide-react";
import { motion } from "framer-motion";

const TYPE_ICONS: Record<string, any> = {
  deposit: ArrowDownCircle,
  withdraw: ArrowUpCircle,
  investment: TrendingUp,
  profit: Wallet,
  commission: Wallet,
  transfer: ArrowRightLeft,
  fee: ArrowUpCircle,
  penalty: ArrowUpCircle,
};

const TYPE_COLORS: Record<string, string> = {
  deposit: "text-success",
  withdraw: "text-warning",
  investment: "text-primary",
  profit: "text-success",
  commission: "text-accent",
  transfer: "text-secondary",
  fee: "text-destructive",
  penalty: "text-destructive",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  approved: "bg-success/20 text-success",
  completed: "bg-success/20 text-success",
  rejected: "bg-destructive/20 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

const History = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    let query = supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    if (filter !== "all") query = query.eq("type", filter as any);
    query.then(({ data }) => {
      if (data) setTransactions(data);
    });
  }, [user, filter]);

  const filters = ["all", "deposit", "withdraw", "investment", "profit", "commission", "transfer"];

  return (
    <DashboardLayout title="History">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${filter === f ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {transactions.length === 0 ? (
          <div className="glass-strong rounded-2xl p-8 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx, i) => {
              const Icon = TYPE_ICONS[tx.type] || Wallet;
              return (
                <motion.div key={tx.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-strong rounded-xl p-3 flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-muted/50 ${TYPE_COLORS[tx.type] || "text-foreground"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize">{tx.type}</p>
                    {tx.description && (
                      <p className="text-[10px] text-muted-foreground truncate">{tx.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${STATUS_COLORS[tx.status] || ""}`}>{tx.status}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold font-mono ${["deposit", "profit", "commission"].includes(tx.type) ? "text-success" : tx.type === "transfer" && (tx.description?.startsWith("Received") || tx.description?.startsWith("Menerima")) ? "text-success" : "text-foreground"}`}>
                      {["deposit", "profit", "commission"].includes(tx.type) ? "+" : tx.type === "transfer" && (tx.description?.startsWith("Received") || tx.description?.startsWith("Menerima")) ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                    </p>
                    {tx.fee > 0 && <p className="text-[10px] text-warning">fee: ${Number(tx.fee).toFixed(2)}</p>}
                    <p className="text-[10px] text-muted-foreground">{tx.currency}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default History;
