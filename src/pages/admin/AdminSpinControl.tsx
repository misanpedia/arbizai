import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Zap, Plus, Trash2, Edit2, X, Save, ToggleLeft, ToggleRight } from "lucide-react";
import { motion } from "framer-motion";

interface SpinReward {
  id: string;
  label: string;
  amount: number;
  reward_type: string;
  probability: number;
  is_active: boolean;
}

const AdminSpinControl = () => {
  const { toast } = useToast();
  const [rewards, setRewards] = useState<SpinReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ label: "", amount: "0", reward_type: "usdt", probability: "10" });
  const [totalSpins, setTotalSpins] = useState(0);
  const [dailyLimit, setDailyLimit] = useState("1");
  const [savingLimit, setSavingLimit] = useState(false);

  const fetchRewards = async () => {
    setLoading(true);
    const [rewardsRes, spinsRes, limitRes] = await Promise.all([
      supabase.from("spin_rewards").select("*").order("reward_value", { ascending: true }),
      supabase.from("user_spins").select("id", { count: "exact", head: true }),
      supabase.from("system_settings").select("value").eq("key", "spin_daily_limit").maybeSingle(),
    ]);
    if (rewardsRes.data) setRewards(rewardsRes.data as any);
    setTotalSpins(spinsRes.count || 0);
    if (limitRes.data) {
      const val = typeof limitRes.data.value === "string" ? limitRes.data.value.replace(/"/g, "") : String(limitRes.data.value);
      setDailyLimit(val);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRewards(); }, []);

  const handleSubmit = async () => {
    if (!form.label) return;
    const payload = {
      label: form.label,
      reward_value: parseFloat(form.amount),
      reward_type: form.reward_type,
      probability: parseFloat(form.probability),
    };

    if (editId) {
      const { error } = await supabase.from("spin_rewards").update(payload).eq("id", editId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "✅ Reward updated!" });
      setEditId(null);
    } else {
      const { error } = await supabase.from("spin_rewards").insert(payload);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "✅ Reward added!" });
    }
    setForm({ label: "", amount: "0", reward_type: "usdt", probability: "10" });
    fetchRewards();
  };

  const handleEdit = (r: SpinReward) => {
    setEditId(r.id);
    setForm({ label: r.label, amount: String(r.amount), reward_type: r.reward_type, probability: String(r.probability) });
  };

  const handleDelete = async (id: string) => {
    await supabase.from("spin_rewards").delete().eq("id", id);
    toast({ title: "Reward deleted" });
    fetchRewards();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("spin_rewards").update({ is_active: !current }).eq("id", id);
    fetchRewards();
  };

  const saveDailyLimit = async () => {
    setSavingLimit(true);
    await supabase.from("system_settings").upsert(
      { key: "spin_daily_limit", value: JSON.stringify(dailyLimit), updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    setSavingLimit(false);
    toast({ title: "✅ Daily limit saved!" });
  };

  const totalProb = rewards.filter(r => r.is_active).reduce((s, r) => s + r.probability, 0);

  return (
    <AdminLayout title="Spin Wheel Control">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Rewards", value: rewards.length, color: "text-primary" },
            { label: "Active Rewards", value: rewards.filter(r => r.is_active).length, color: "text-success" },
            { label: "Total Spins (All Time)", value: totalSpins, color: "text-warning" },
            { label: "Probability Sum", value: `${totalProb.toFixed(1)}%`, color: totalProb === 100 ? "text-success" : "text-destructive" },
          ].map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-strong rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={`text-lg font-display font-bold ${c.color}`}>{c.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Daily Limit */}
        <div className="glass-strong rounded-2xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-3">Daily Spin Limit</h3>
          <div className="flex items-end gap-3">
            <div className="space-y-1 flex-1">
              <Label>Max spins per user per day</Label>
              <Input type="number" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} min="1" />
            </div>
            <Button onClick={saveDailyLimit} disabled={savingLimit}>
              <Save className="w-3 h-3 mr-1" />{savingLimit ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Add/Edit Reward */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              {editId ? "Edit Reward" : "Add Reward"}
            </h3>
            {editId && <button onClick={() => { setEditId(null); setForm({ label: "", amount: "0", reward_type: "usdt", probability: "10" }); }} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1"><Label>Label</Label><Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. $0.50 USDT" /></div>
            <div className="space-y-1"><Label>Amount ($)</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
            <div className="space-y-1"><Label>Type</Label>
              <select value={form.reward_type} onChange={e => setForm({ ...form, reward_type: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="usdt">USDT</option>
                <option value="bonus">Bonus</option>
                <option value="arbiz">ARBIZ</option>
              </select>
            </div>
            <div className="space-y-1"><Label>Probability (%)</Label><Input type="number" step="0.1" value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })} /></div>
          </div>
          <Button onClick={handleSubmit} disabled={!form.label}>
            <Plus className="w-3 h-3 mr-1" />{editId ? "Update Reward" : "Add Reward"}
          </Button>
        </div>

        {/* Rewards Table */}
        <div className="glass-strong rounded-2xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">All Rewards</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : rewards.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No rewards configured</TableCell></TableRow>
                ) : (
                  rewards.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs font-medium">{r.label}</TableCell>
                      <TableCell className="text-xs">${Number(r.amount).toFixed(2)}</TableCell>
                      <TableCell className="text-xs capitalize">{r.reward_type}</TableCell>
                      <TableCell className="text-xs">{r.probability}%</TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${r.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                          {r.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => toggleActive(r.id, r.is_active)} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition">
                            {r.is_active ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSpinControl;
