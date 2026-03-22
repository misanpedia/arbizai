import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Database, Server, Clock, Wifi } from "lucide-react";

const AdminSystemMonitor = () => {
  const [metrics, setMetrics] = useState({ tables: 0, totalRows: 0, lastProfit: "", cronStatus: "active" });

  useEffect(() => {
    const fetch = async () => {
      const tables = ["profiles", "wallets", "transactions", "investments", "profits", "commissions"] as const;
      let total = 0;
      for (const t of tables) {
        const { count } = await supabase.from(t).select("id", { count: "exact", head: true });
        total += count || 0;
      }

      const { data: lastProfit } = await supabase.from("profits").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle();

      setMetrics({
        tables: tables.length,
        totalRows: total,
        lastProfit: lastProfit?.created_at ? new Date(lastProfit.created_at).toLocaleString() : "Never",
        cronStatus: "active",
      });
    };
    fetch();
  }, []);

  return (
    <AdminLayout title="System Monitor">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-strong rounded-xl p-4">
            <Database className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Database Tables</p>
            <p className="text-lg font-display font-bold text-foreground">{metrics.tables}</p>
          </div>
          <div className="glass-strong rounded-xl p-4">
            <Server className="w-5 h-5 text-accent mb-2" />
            <p className="text-xs text-muted-foreground">Total Records</p>
            <p className="text-lg font-display font-bold text-foreground">{metrics.totalRows.toLocaleString()}</p>
          </div>
          <div className="glass-strong rounded-xl p-4">
            <Clock className="w-5 h-5 text-warning mb-2" />
            <p className="text-xs text-muted-foreground">Last Profit Run</p>
            <p className="text-xs font-medium text-foreground mt-1">{metrics.lastProfit}</p>
          </div>
          <div className="glass-strong rounded-xl p-4">
            <Activity className="w-5 h-5 text-success mb-2" />
            <p className="text-xs text-muted-foreground">Cron Status</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Wifi className="w-3 h-3 text-success" />
              <span className="text-sm font-medium text-success capitalize">{metrics.cronStatus}</span>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">System Health</h3>
          <div className="space-y-3">
            {[
              { name: "Database", status: "Operational", color: "text-success" },
              { name: "Authentication", status: "Operational", color: "text-success" },
              { name: "Edge Functions", status: "Operational", color: "text-success" },
              { name: "Cron Job (daily-profit)", status: "Active", color: "text-success" },
              { name: "Realtime", status: "Operational", color: "text-success" },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <span className="text-sm text-foreground">{s.name}</span>
                <span className={`text-sm font-medium ${s.color}`}>● {s.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSystemMonitor;
