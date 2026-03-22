import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Users, ArrowDownCircle, ArrowUpCircle, TrendingUp, BarChart3,
  Shield, Check, X, Search, ChevronLeft, LogOut, Eye,
  Ban, UserCheck, DollarSign, Activity
} from "lucide-react";

type Tab = "users" | "deposits" | "withdrawals" | "investments" | "overview";

const Admin = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ totalUsers: 0, totalDeposits: 0, totalWithdrawals: 0, totalInvested: 0 });

  // Check admin role
  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
      if (!data) navigate("/dashboard");
    });
  }, [user, navigate]);

  // Fetch data based on tab
  useEffect(() => {
    if (!isAdmin) return;
    fetchData();
  }, [isAdmin, tab]);

  const fetchData = async () => {
    if (tab === "overview" || tab === "users") {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (data) {
        setUsers(data);
        setStats(prev => ({ ...prev, totalUsers: data.length }));
      }
    }
    if (tab === "overview" || tab === "deposits") {
      const { data } = await supabase.from("transactions").select("*").eq("type", "deposit").order("created_at", { ascending: false });
      if (data) {
        setDeposits(data);
        setStats(prev => ({ ...prev, totalDeposits: data.reduce((s, d) => s + Number(d.amount), 0) }));
      }
    }
    if (tab === "overview" || tab === "withdrawals") {
      const { data } = await supabase.from("transactions").select("*").eq("type", "withdraw").order("created_at", { ascending: false });
      if (data) {
        setWithdrawals(data);
        setStats(prev => ({ ...prev, totalWithdrawals: data.reduce((s, w) => s + Number(w.amount), 0) }));
      }
    }
    if (tab === "overview" || tab === "investments") {
      const { data } = await supabase.from("investments").select("*, investment_plans(display_name)").order("created_at", { ascending: false });
      if (data) {
        setInvestments(data);
        setStats(prev => ({ ...prev, totalInvested: data.reduce((s, i) => s + Number(i.amount), 0) }));
      }
    }
  };

  const handleApproveTransaction = async (id: string, action: "approved" | "rejected") => {
    const { error } = await supabase.from("transactions").update({ status: action }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Transaction ${action}!` });
      fetchData();
    }
  };

  const handleToggleUserActive = async (profileId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_active: !currentStatus }).eq("id", profileId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: currentStatus ? "User suspended" : "User activated" });
      fetchData();
    }
  };

  const handleUpdateKYC = async (profileId: string, status: string) => {
    const { error } = await supabase.from("profiles").update({ kyc_status: status }).eq("id", profileId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `KYC ${status}` });
      fetchData();
    }
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "deposits", label: "Deposits", icon: ArrowDownCircle },
    { id: "withdrawals", label: "Withdrawals", icon: ArrowUpCircle },
    { id: "investments", label: "Investments", icon: TrendingUp },
  ];

  const filteredUsers = users.filter(u =>
    !search || (u.full_name || "").toLowerCase().includes(search.toLowerCase()) || (u.referral_code || "").toLowerCase().includes(search.toLowerCase())
  );

  const pendingDeposits = deposits.filter(d => d.status === "pending");
  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-primary p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="p-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-foreground" />
            <h1 className="text-lg font-display font-bold text-primary-foreground">Admin Panel</h1>
          </div>
        </div>
        <button onClick={() => signOut()} className="p-2 rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto px-4 py-3 scrollbar-hide">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${tab === t.id ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <main className="px-4 py-4 pb-8 max-w-6xl mx-auto space-y-6">
        {/* Overview */}
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
                { label: "Total Deposits", value: `$${stats.totalDeposits.toFixed(0)}`, icon: ArrowDownCircle, color: "text-success" },
                { label: "Total Withdrawals", value: `$${stats.totalWithdrawals.toFixed(0)}`, icon: ArrowUpCircle, color: "text-warning" },
                { label: "Total Invested", value: `$${stats.totalInvested.toFixed(0)}`, icon: TrendingUp, color: "text-accent" },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-strong rounded-xl p-4">
                  <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-display font-bold text-foreground">{s.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Pending Actions */}
            {(pendingDeposits.length > 0 || pendingWithdrawals.length > 0) && (
              <div className="glass-strong rounded-2xl p-4">
                <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-warning" /> Pending Actions
                </h3>
                <div className="space-y-2">
                  {pendingDeposits.slice(0, 3).map(d => (
                    <div key={d.id} className="flex items-center justify-between py-2 border-b border-border/30">
                      <div>
                        <p className="text-sm font-medium text-foreground">Deposit ${Number(d.amount).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleApproveTransaction(d.id, "approved")} className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition"><Check className="w-4 h-4" /></button>
                        <button onClick={() => handleApproveTransaction(d.id, "rejected")} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                  {pendingWithdrawals.slice(0, 3).map(w => (
                    <div key={w.id} className="flex items-center justify-between py-2 border-b border-border/30">
                      <div>
                        <p className="text-sm font-medium text-foreground">Withdraw ${Number(w.amount).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(w.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleApproveTransaction(w.id, "approved")} className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition"><Check className="w-4 h-4" /></button>
                        <button onClick={() => handleApproveTransaction(w.id, "rejected")} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by name or referral code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 glass" />
              </div>
            </div>
            <div className="space-y-2">
              {filteredUsers.map((u, i) => (
                <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="glass-strong rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{(u.full_name || "U")[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.full_name || "User"}</p>
                        <p className="text-[10px] text-muted-foreground">Ref: {u.referral_code} · {u.rank}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${u.is_active ? "bg-success" : "bg-destructive"}`} />
                      <span className={`text-[10px] ${u.is_active ? "text-success" : "text-destructive"}`}>{u.is_active ? "Active" : "Suspended"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => handleToggleUserActive(u.id, u.is_active)} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition ${u.is_active ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "bg-success/10 text-success hover:bg-success/20"}`}>
                      {u.is_active ? <><Ban className="w-3 h-3" /> Suspend</> : <><UserCheck className="w-3 h-3" /> Activate</>}
                    </button>
                    {u.kyc_status !== "verified" && (
                      <button onClick={() => handleUpdateKYC(u.id, "verified")} className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Verify KYC
                      </button>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${u.kyc_status === "verified" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      KYC: {u.kyc_status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Deposits Tab */}
        {tab === "deposits" && (
          <TransactionList items={deposits} onApprove={handleApproveTransaction} type="deposit" />
        )}

        {/* Withdrawals Tab */}
        {tab === "withdrawals" && (
          <TransactionList items={withdrawals} onApprove={handleApproveTransaction} type="withdraw" />
        )}

        {/* Investments Tab */}
        {tab === "investments" && (
          <div className="space-y-2">
            {investments.length === 0 ? (
              <EmptyState icon={TrendingUp} text="No investments yet" />
            ) : investments.map((inv, i) => (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="glass-strong rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{inv.investment_plans?.display_name || "Plan"}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(inv.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">${Number(inv.amount).toFixed(2)}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${inv.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{inv.status}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

function TransactionList({ items, onApprove, type }: { items: any[]; onApprove: (id: string, action: "approved" | "rejected") => void; type: string }) {
  if (items.length === 0) {
    return <EmptyState icon={type === "deposit" ? ArrowDownCircle : ArrowUpCircle} text={`No ${type}s found`} />;
  }
  return (
    <div className="space-y-2">
      {items.map((tx, i) => (
        <motion.div key={tx.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="glass-strong rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-foreground">${Number(tx.amount).toFixed(2)} {tx.currency}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              tx.status === "pending" ? "bg-warning/15 text-warning" :
              tx.status === "approved" || tx.status === "completed" ? "bg-success/15 text-success" :
              "bg-destructive/15 text-destructive"
            }`}>{tx.status}</span>
          </div>
          {tx.tx_hash && <p className="text-[10px] text-muted-foreground font-mono break-all mb-2">TxHash: {tx.tx_hash}</p>}
          {tx.wallet_address && <p className="text-[10px] text-muted-foreground font-mono break-all mb-2">Wallet: {tx.wallet_address}</p>}
          {tx.status === "pending" && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onApprove(tx.id, "approved")} className="flex-1 bg-success/10 text-success hover:bg-success/20 h-8 text-xs">
                <Check className="w-3 h-3 mr-1" /> Approve
              </Button>
              <Button size="sm" onClick={() => onApprove(tx.id, "rejected")} variant="outline" className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 h-8 text-xs">
                <X className="w-3 h-3 mr-1" /> Reject
              </Button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="glass-strong rounded-2xl p-8 text-center">
      <Icon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}

export default Admin;
