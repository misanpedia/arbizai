import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Users, ArrowDownCircle, ArrowUpCircle, TrendingUp, DollarSign, Activity, ShieldCheck, Cpu, Wallet, GitBranch, Bell, Shield, Settings, Megaphone, Zap, CalendarCheck, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, deposits: 0, withdrawals: 0, invested: 0, profits: 0, pendingDeposits: 0, pendingWithdrawals: 0 });
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [usersRes, depsRes, wdRes, invRes, profRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("transactions").select("amount, status").eq("type", "deposit"),
        supabase.from("transactions").select("amount, status").eq("type", "withdraw"),
        supabase.from("investments").select("amount").eq("status", "active"),
        supabase.from("profits").select("amount"),
      ]);
      const deps = depsRes.data || [];
      const wds = wdRes.data || [];
      setStats({
        users: usersRes.count || 0,
        deposits: deps.filter(d => d.status === "completed" || d.status === "approved").reduce((s, d) => s + Number(d.amount), 0),
        withdrawals: wds.filter(w => w.status === "completed" || w.status === "approved").reduce((s, w) => s + Number(w.amount), 0),
        invested: (invRes.data || []).reduce((s, i) => s + Number(i.amount), 0),
        profits: (profRes.data || []).reduce((s, p) => s + Number(p.amount), 0),
        pendingDeposits: deps.filter(d => d.status === "pending").length,
        pendingWithdrawals: wds.filter(w => w.status === "pending").length,
      });

      const [pendingDepsRes, pendingWdsRes, txRes] = await Promise.all([
        supabase.from("transactions").select("id, user_id, amount, currency, created_at, description, wallet_address").eq("type", "deposit").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
        supabase.from("transactions").select("id, user_id, amount, currency, created_at, description, wallet_address").eq("type", "withdraw").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
        supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(10),
      ]);

      const allUserIds = [
        ...(pendingDepsRes.data || []).map(d => d.user_id),
        ...(pendingWdsRes.data || []).map(w => w.user_id),
      ].filter((v, i, a) => a.indexOf(v) === i);

      let profileMap: Record<string, { full_name: string; email: string }> = {};
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", allUserIds);
        profiles?.forEach(p => { profileMap[p.user_id] = { full_name: p.full_name || "User", email: p.email || "" }; });
      }

      setPendingDeposits((pendingDepsRes.data || []).map(d => ({ ...d, ...profileMap[d.user_id] })));
      setPendingWithdrawals((pendingWdsRes.data || []).map(w => ({ ...w, ...profileMap[w.user_id] })));
      if (txRes.data) setRecentTx(txRes.data);
    };
    fetchData();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "text-primary" },
    { label: "Total Deposits", value: `$${stats.deposits.toFixed(0)}`, icon: ArrowDownCircle, color: "text-success" },
    { label: "Total Withdrawals", value: `$${stats.withdrawals.toFixed(0)}`, icon: ArrowUpCircle, color: "text-warning" },
    { label: "Active Bots", value: `$${stats.invested.toFixed(0)}`, icon: TrendingUp, color: "text-accent" },
    { label: "Total Profits", value: `$${stats.profits.toFixed(0)}`, icon: DollarSign, color: "text-success" },
    { label: "Pending Actions", value: stats.pendingDeposits + stats.pendingWithdrawals, icon: Activity, color: "text-destructive" },
  ];

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {cards.map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-strong rounded-xl p-4">
              <c.icon className={`w-5 h-5 ${c.color} mb-2`} />
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-lg font-display font-bold text-foreground">{c.value}</p>
            </motion.div>
          ))}
        </div>

        {(pendingDeposits.length > 0 || pendingWithdrawals.length > 0) && (
          <div className="grid md:grid-cols-2 gap-4">
            {pendingDeposits.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-strong rounded-2xl p-5 border border-success/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                    <ArrowDownCircle className="w-5 h-5 text-success" />
                    Pending Deposits
                  </h3>
                  <Link to="/admin/deposits" className="text-xs text-primary hover:underline">View All →</Link>
                </div>
                <div className="space-y-2">
                  {pendingDeposits.map(d => (
                    <div key={d.id} className="bg-success/5 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.full_name || "User"}</p>
                        <p className="text-[10px] text-muted-foreground">{d.email}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatTime(d.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-success">${Number(d.amount).toFixed(2)}</p>
                        <span className="text-[10px] bg-warning/15 text-warning px-1.5 py-0.5 rounded font-medium">Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {pendingWithdrawals.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-strong rounded-2xl p-5 border border-warning/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                    <ArrowUpCircle className="w-5 h-5 text-warning" />
                    Pending Withdrawals
                  </h3>
                  <Link to="/admin/withdrawals" className="text-xs text-primary hover:underline">View All →</Link>
                </div>
                <div className="space-y-2">
                  {pendingWithdrawals.map(w => (
                    <div key={w.id} className="bg-warning/5 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{w.full_name || "User"}</p>
                        <p className="text-[10px] text-muted-foreground">{w.email}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatTime(w.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-warning">${Number(w.amount).toFixed(2)}</p>
                        <span className="text-[10px] bg-warning/15 text-warning px-1.5 py-0.5 rounded font-medium">Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Quick Menu */}
        <div className="glass-strong rounded-2xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Quick Menu</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Users, label: "Users", path: "/admin/users", color: "text-primary" },
              { icon: ShieldCheck, label: "KYC", path: "/admin/kyc", color: "text-warning" },
              { icon: ArrowDownCircle, label: "Deposits", path: "/admin/deposits", color: "text-success" },
              { icon: ArrowUpCircle, label: "Withdrawals", path: "/admin/withdrawals", color: "text-warning" },
              { icon: TrendingUp, label: "Plans", path: "/admin/plans", color: "text-primary" },
              { icon: TrendingUp, label: "Investments", path: "/admin/investments", color: "text-accent" },
              { icon: Cpu, label: "Profit Engine", path: "/admin/profit-engine", color: "text-accent" },
              { icon: Wallet, label: "Wallets", path: "/admin/wallets", color: "text-success" },
              { icon: GitBranch, label: "Referral", path: "/admin/referral", color: "text-secondary" },
              { icon: Megaphone, label: "Announcements", path: "/admin/announcements", color: "text-primary" },
              { icon: Zap, label: "Spin Wheel", path: "/admin/spin-control", color: "text-warning" },
              { icon: CalendarCheck, label: "Check-in", path: "/admin/checkin-settings", color: "text-success" },
              { icon: Bell, label: "Notifications", path: "/admin/notifications", color: "text-warning" },
              { icon: Shield, label: "Security", path: "/admin/security", color: "text-destructive" },
              { icon: Settings, label: "Settings", path: "/admin/settings", color: "text-primary" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.03 }}>
                <Link to={item.path} className="glass rounded-xl p-3 flex flex-col items-center gap-1.5 hover:bg-muted/50 transition text-center">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-[10px] text-foreground font-medium">{item.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {recentTx.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground capitalize">{tx.type} · {tx.currency}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">${Number(tx.amount).toFixed(2)}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${tx.status === "pending" ? "bg-warning/15 text-warning" : tx.status === "completed" || tx.status === "approved" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{tx.status}</span>
                </div>
              </div>
            ))}
            {recentTx.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;