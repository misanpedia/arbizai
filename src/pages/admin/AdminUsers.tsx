import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, Ban, UserCheck, Edit2, X, Save, Wallet, TrendingUp, BarChart3, ChevronDown, ChevronUp, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserDetails {
  wallets: { currency: string; balance: number; bonus_balance: number; frozen_balance: number }[];
  totalCommission: number;
  activeInvestments: { amount: number; plan_name: string; total_profit: number }[];
  totalDeposits: number;
  totalWithdrawals: number;
}

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<Record<string, UserDetails>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setUsers(data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_active: !active }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: active ? "User suspended" : "User activated" }); fetchUsers(); }
  };

  const startEdit = (user: any) => {
    setEditingUser(user.id);
    setEditData({ full_name: user.full_name || "", phone: user.phone || "", rank: user.rank, kyc_status: user.kyc_status });
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from("profiles").update(editData).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "User updated" }); setEditingUser(null); fetchUsers(); }
  };

  const fetchUserDetails = async (user: any) => {
    if (expandedUser === user.id) { setExpandedUser(null); return; }
    if (userDetails[user.id]) { setExpandedUser(user.id); return; }

    setLoadingDetails(user.id);
    setExpandedUser(user.id);

    const [walletsRes, commissionsRes, investmentsRes, depositsRes, withdrawalsRes] = await Promise.all([
      supabase.from("wallets").select("currency, balance, bonus_balance, frozen_balance").eq("user_id", user.user_id),
      supabase.from("commissions").select("amount").eq("user_id", user.user_id),
      supabase.from("investments").select("amount, plan_id, status").eq("user_id", user.user_id).eq("status", "active"),
      supabase.from("transactions").select("amount").eq("user_id", user.user_id).eq("type", "deposit").in("status", ["approved", "completed"]),
      supabase.from("transactions").select("amount").eq("user_id", user.user_id).eq("type", "withdraw").in("status", ["approved", "completed"]),
    ]);

    let activeInvestments: UserDetails["activeInvestments"] = [];
    if (investmentsRes.data && investmentsRes.data.length > 0) {
      const planIds = [...new Set(investmentsRes.data.map(i => i.plan_id))];
      const { data: plans } = await supabase.from("investment_plans").select("id, display_name").in("id", planIds);
      const planMap = new Map(plans?.map(p => [p.id, p.display_name]) || []);
      activeInvestments = investmentsRes.data.map(i => ({
        amount: i.amount,
        plan_name: planMap.get(i.plan_id) || "Unknown",
        total_profit: i.total_profit,
      }));
    }

    setUserDetails(prev => ({
      ...prev,
      [user.id]: {
        wallets: walletsRes.data || [],
        totalCommission: commissionsRes.data?.reduce((sum, c) => sum + Number(c.amount), 0) || 0,
        activeInvestments,
        totalDeposits: depositsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0,
        totalWithdrawals: withdrawalsRes.data?.reduce((sum, w) => sum + Number(w.amount), 0) || 0,
      },
    }));
    setLoadingDetails(null);
  };

  const filtered = users.filter(u => !search || (u.full_name || "").toLowerCase().includes(search.toLowerCase()) || (u.referral_code || "").includes(search) || (u.email || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout title="Users">
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, or referral code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="text-sm text-muted-foreground">{filtered.length} users found</div>
        <div className="grid gap-2">
          {filtered.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="glass-strong rounded-xl p-4">
              {editingUser === u.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Name</label>
                      <Input value={editData.full_name} onChange={e => setEditData({ ...editData, full_name: e.target.value })} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Phone</label>
                      <Input value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Rank</label>
                      <select value={editData.rank} onChange={e => setEditData({ ...editData, rank: e.target.value })} className="w-full h-8 text-sm rounded-md border border-border bg-background px-2">
                        {["bronze", "silver", "gold", "platinum", "diamond"].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">KYC</label>
                      <select value={editData.kyc_status} onChange={e => setEditData({ ...editData, kyc_status: e.target.value })} className="w-full h-8 text-sm rounded-md border border-border bg-background px-2">
                        {["unverified", "pending", "verified", "rejected"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(u.id)} className="h-7 text-xs"><Save className="w-3 h-3 mr-1" />Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingUser(null)} className="h-7 text-xs"><X className="w-3 h-3 mr-1" />Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => fetchUserDetails(u)}>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{(u.full_name || "U")[0].toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.full_name || "User"}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{u.email || "No email"}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Ref: {u.referral_code} · {u.rank} · KYC: {u.kyc_status}</p>
                      </div>
                      {expandedUser === u.id ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`w-2 h-2 rounded-full ${u.is_active ? "bg-success" : "bg-destructive"}`} />
                      <button onClick={() => startEdit(u)} className="px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => toggleActive(u.id, u.is_active)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${u.is_active ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "bg-success/10 text-success hover:bg-success/20"}`}>
                        {u.is_active ? <><Ban className="w-3 h-3 inline mr-1" />Suspend</> : <><UserCheck className="w-3 h-3 inline mr-1" />Activate</>}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedUser === u.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        {loadingDetails === u.id ? (
                          <div className="flex justify-center py-4">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : userDetails[u.id] ? (
                          <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                            <div>
                              <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mb-1.5"><Wallet className="w-3 h-3" /> Wallets</p>
                              <div className="grid grid-cols-3 gap-2">
                                {userDetails[u.id].wallets.map(w => (
                                  <div key={w.currency} className="bg-muted/30 rounded-lg p-2">
                                    <p className="text-[10px] text-muted-foreground">{w.currency}</p>
                                    <p className="text-sm font-semibold text-foreground">${Number(w.balance).toFixed(2)}</p>
                                    {w.bonus_balance > 0 && <p className="text-[9px] text-primary">Bonus: ${Number(w.bonus_balance).toFixed(2)}</p>}
                                    {w.frozen_balance > 0 && <p className="text-[9px] text-warning">Frozen: ${Number(w.frozen_balance).toFixed(2)}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-muted/30 rounded-lg p-2">
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Commission</p>
                                <p className="text-sm font-semibold text-foreground">${userDetails[u.id].totalCommission.toFixed(2)}</p>
                              </div>
                              <div className="bg-muted/30 rounded-lg p-2">
                                <p className="text-[10px] text-muted-foreground">Total Deposits</p>
                                <p className="text-sm font-semibold text-foreground">${userDetails[u.id].totalDeposits.toFixed(2)}</p>
                              </div>
                              <div className="bg-muted/30 rounded-lg p-2">
                                <p className="text-[10px] text-muted-foreground">Total Withdrawals</p>
                                <p className="text-sm font-semibold text-foreground">${userDetails[u.id].totalWithdrawals.toFixed(2)}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mb-1.5"><BarChart3 className="w-3 h-3" /> Active Bots ({userDetails[u.id].activeInvestments.length})</p>
                              {userDetails[u.id].activeInvestments.length > 0 ? (
                                <div className="space-y-1">
                                  {userDetails[u.id].activeInvestments.map((inv, idx) => (
                                    <div key={idx} className="bg-muted/30 rounded-lg p-2 flex items-center justify-between">
                                      <div>
                                        <p className="text-xs font-medium text-foreground">{inv.plan_name}</p>
                                        <p className="text-[10px] text-muted-foreground">${Number(inv.amount).toFixed(2)}</p>
                                      </div>
                                      <p className="text-xs text-success font-medium">+${Number(inv.total_profit).toFixed(2)}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[10px] text-muted-foreground">No active bots</p>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
