import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Cpu, Play, Clock, DollarSign, History, Filter } from "lucide-react";

const AdminProfitEngine = () => {
  const { toast } = useToast();
  const [profits, setProfits] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ todayProfits: 0, totalProfits: 0, activeInvestments: 0 });
  const [running, setRunning] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = async () => {
    let query = supabase.from("profit_engine_logs").select("*").order("executed_at", { ascending: false }).limit(50);
    if (dateFrom) query = query.gte("executed_at", `${dateFrom}T00:00:00`);
    if (dateTo) query = query.lte("executed_at", `${dateTo}T23:59:59`);
    const { data } = await query;
    if (data) setLogs(data);
  };

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().split("T")[0];
      const [todayRes, totalRes, invRes, recentRes] = await Promise.all([
        supabase.from("profits").select("amount").eq("profit_date", today),
        supabase.from("profits").select("amount"),
        supabase.from("investments").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("profits").select("*, investments(amount, investment_plans(display_name))").order("created_at", { ascending: false }).limit(20),
      ]);
      setStats({
        todayProfits: (todayRes.data || []).reduce((s, p) => s + Number(p.amount), 0),
        totalProfits: (totalRes.data || []).reduce((s, p) => s + Number(p.amount), 0),
        activeInvestments: invRes.count || 0,
      });
      if (recentRes.data) setProfits(recentRes.data);
    };
    fetch();
    fetchLogs();
  }, []);

  const triggerManual = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("daily-profit");
      if (error) throw error;
      toast({ title: "Profit engine executed", description: `Processed: ${data?.processed || 0} investments` });
      // Refresh data
      const today = new Date().toISOString().split("T")[0];
      const [todayRes] = await Promise.all([
        supabase.from("profits").select("amount").eq("profit_date", today),
      ]);
      setStats(s => ({ ...s, todayProfits: (todayRes.data || []).reduce((sum, p) => sum + Number(p.amount), 0) }));
      await fetchLogs();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setRunning(false);
  };

  return (
    <AdminLayout title="Profit Engine">
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-strong rounded-xl p-4">
            <DollarSign className="w-5 h-5 text-success mb-2" />
            <p className="text-xs text-muted-foreground">Today's Profits</p>
            <p className="text-lg font-display font-bold text-foreground">${stats.todayProfits.toFixed(2)}</p>
          </div>
          <div className="glass-strong rounded-xl p-4">
            <DollarSign className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Total Profits</p>
            <p className="text-lg font-display font-bold text-foreground">${stats.totalProfits.toFixed(2)}</p>
          </div>
          <div className="glass-strong rounded-xl p-4">
            <Cpu className="w-5 h-5 text-accent mb-2" />
            <p className="text-xs text-muted-foreground">Active Investments</p>
            <p className="text-lg font-display font-bold text-foreground">{stats.activeInvestments}</p>
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary animate-pulse" />
              <span className="font-display font-semibold text-foreground">Engine Control</span>
            </div>
            <Button size="sm" onClick={triggerManual} disabled={running} className="gradient-primary text-primary-foreground">
              <Play className="w-3 h-3 mr-1" />{running ? "Running..." : "Run Now"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The profit engine runs automatically every day at 00:00 UTC via cron job. You can manually trigger it here.
          </p>
        </div>

        {/* Execution History */}
        <div className="glass-strong rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-foreground">Execution History</h3>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs w-32" placeholder="From" />
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs w-32" placeholder="To" />
              <Button size="sm" variant="outline" onClick={fetchLogs} className="h-8">
                <Filter className="w-3 h-3 mr-1" />Filter
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(log.executed_at).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {log.trigger_type === "cron" ? "⏰ Cron" : "🖐 Manual"} · {log.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-success">{log.processed}/{log.total_investments}</p>
                  <p className="text-[10px] text-muted-foreground">processed</p>
                </div>
              </div>
            ))}
            {logs.length === 0 && <p className="text-muted-foreground text-center py-4">No execution logs yet</p>}
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Recent Profits</h3>
          <div className="space-y-2">
            {profits.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">${Number(p.amount).toFixed(4)}</p>
                  <p className="text-[10px] text-muted-foreground">{p.profit_date} · Volatility: {Number(p.market_volatility || 0).toFixed(2)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Spread: {Number(p.spread_volume || 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
            {profits.length === 0 && <p className="text-muted-foreground text-center py-4">No profits generated yet</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfitEngine;
