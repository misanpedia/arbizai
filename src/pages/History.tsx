import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, Wallet, Calendar, Gift, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const TYPE_ICONS: Record<string, any> = {
  deposit: ArrowDownCircle,
  withdraw: ArrowUpCircle,
  investment: TrendingUp,
  profit: BarChart3,
  commission: Gift,
  rebate: Gift,
  fee: ArrowUpCircle,
  penalty: ArrowUpCircle,
  rank_weekly: Wallet,
};

const TYPE_COLORS: Record<string, string> = {
  deposit: "text-success",
  withdraw: "text-warning",
  investment: "text-primary",
  profit: "text-success",
  commission: "text-accent",
  rebate: "text-accent",
  fee: "text-destructive",
  penalty: "text-destructive",
  rank_weekly: "text-primary",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  approved: "bg-success/20 text-success",
  completed: "bg-success/20 text-success",
  active: "bg-primary/20 text-primary",
  rejected: "bg-destructive/20 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

interface HistoryItem {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
  currency: string;
  fee?: number;
}

const History = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const fetchAll = async () => {
      const results: HistoryItem[] = [];

      // 1. Transactions (deposit, withdraw, etc.)
      const { data: txData } = await supabase
        .from("transactions")
        .select("id, type, amount, status, description, created_at, currency, fee")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (txData) {
        txData.forEach((tx: any) => {
          results.push({
            id: tx.id,
            type: tx.type,
            amount: tx.amount,
            status: tx.status || "completed",
            description: tx.description,
            created_at: tx.created_at,
            currency: tx.currency || "USDT",
            fee: tx.fee,
          });
        });
      }

      // 2. Investments
      const { data: invData } = await supabase
        .from("investments")
        .select("id, amount, status, created_at, plan_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (invData) {
        // Skip if already in transactions
        const txIds = new Set(results.filter(r => r.type === "investment").map(r => r.id));
        invData.forEach((inv: any) => {
          if (!txIds.has(inv.id)) {
            results.push({
              id: inv.id,
              type: "investment",
              amount: inv.amount,
              status: inv.status || "active",
              description: "Bot Activation",
              created_at: inv.created_at,
              currency: "USDT",
            });
          }
        });
      }

      // 3. Profits
      const { data: profitData } = await supabase
        .from("profits")
        .select("id, amount, profit_date, created_at, investment_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (profitData) {
        profitData.forEach((p: any) => {
          results.push({
            id: p.id,
            type: "profit",
            amount: p.amount,
            status: "completed",
            description: `Daily Profit — ${p.profit_date || ""}`,
            created_at: p.created_at,
            currency: "USDT",
          });
        });
      }

      // 4. Commissions
      const { data: commData } = await supabase
        .from("commissions")
        .select("id, amount, type, level, description, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (commData) {
        commData.forEach((c: any) => {
          results.push({
            id: c.id,
            type: c.type === "rank_weekly" ? "rank_weekly" : "commission",
            amount: c.amount,
            status: "completed",
            description: c.description || (c.level ? `Level ${c.level} Rebate` : "Commission"),
            created_at: c.created_at,
            currency: "USDT",
          });
        });
      }

      // Sort all by date descending
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(results);
      setLoading(false);
    };

    fetchAll();
  }, [user]);

  const filters = ["all", "deposit", "withdraw", "investment", "profit", "commission"];

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-strong rounded-2xl p-8 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx, i) => {
              const Icon = TYPE_ICONS[tx.type] || Wallet;
              const isPositive = ["deposit", "profit", "commission", "rebate", "rank_weekly"].includes(tx.type);
              return (
                <motion.div key={tx.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="glass-strong rounded-xl p-3 flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-muted/50 ${TYPE_COLORS[tx.type] || "text-foreground"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize">{tx.type.replace("_", " ")}</p>
                    {tx.description && (
                      <p className="text-[10px] text-muted-foreground truncate">{tx.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${STATUS_COLORS[tx.status] || "bg-muted text-muted-foreground"}`}>{tx.status}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold font-mono ${isPositive ? "text-success" : "text-foreground"}`}>
                      {isPositive ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                    </p>
                    {tx.fee && tx.fee > 0 && <p className="text-[10px] text-warning">fee: ${Number(tx.fee).toFixed(2)}</p>}
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
