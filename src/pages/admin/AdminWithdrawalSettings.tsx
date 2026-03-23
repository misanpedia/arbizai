import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Save, AlertTriangle, DollarSign, Clock, Bell, Shield, Percent } from "lucide-react";

interface WithdrawalConfig {
  withdrawal_fee_rate: number;
  withdrawal_min_amount: number;
  withdrawal_max_amount: number;
  withdrawal_enabled: boolean;
  withdrawal_notify_admin: boolean;
  withdrawal_auto_approve: boolean;
  withdrawal_auto_approve_limit: number;
  withdrawal_cooldown_hours: number;
  principal_penalty_rate: number;
}

const defaultConfig: WithdrawalConfig = {
  withdrawal_fee_rate: 0.05,
  withdrawal_min_amount: 10,
  withdrawal_max_amount: 50000,
  withdrawal_enabled: true,
  withdrawal_notify_admin: true,
  withdrawal_auto_approve: false,
  withdrawal_auto_approve_limit: 100,
  withdrawal_cooldown_hours: 24,
  principal_penalty_rate: 0.10,
};

const AdminWithdrawalSettings = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<WithdrawalConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, totalPending: 0 });

  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, []);

  const fetchConfig = async () => {
    const { data } = await supabase.from("system_settings").select("key, value").in("key", [
      "withdrawal_fee_rate", "withdrawal_min_amount", "withdrawal_max_amount",
      "withdrawal_enabled", "withdrawal_notify_admin", "withdrawal_auto_approve",
      "withdrawal_auto_approve_limit", "withdrawal_cooldown_hours", "withdrawal_principal_penalty_rate",
    ]);
    if (data && data.length > 0) {
      const map: Record<string, any> = {};
      data.forEach(d => { map[d.key] = d.value; });
      setConfig({
        withdrawal_fee_rate: map.withdrawal_fee_rate ?? defaultConfig.withdrawal_fee_rate,
        withdrawal_min_amount: map.withdrawal_min_amount ?? defaultConfig.withdrawal_min_amount,
        withdrawal_max_amount: map.withdrawal_max_amount ?? defaultConfig.withdrawal_max_amount,
        withdrawal_enabled: map.withdrawal_enabled ?? defaultConfig.withdrawal_enabled,
        withdrawal_notify_admin: map.withdrawal_notify_admin ?? defaultConfig.withdrawal_notify_admin,
        withdrawal_auto_approve: map.withdrawal_auto_approve ?? defaultConfig.withdrawal_auto_approve,
        withdrawal_auto_approve_limit: map.withdrawal_auto_approve_limit ?? defaultConfig.withdrawal_auto_approve_limit,
        withdrawal_cooldown_hours: map.withdrawal_cooldown_hours ?? defaultConfig.withdrawal_cooldown_hours,
        principal_penalty_rate: map.withdrawal_principal_penalty_rate ?? defaultConfig.principal_penalty_rate,
      });
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    const { data } = await supabase.from("transactions").select("status, amount").eq("type", "withdraw");
    if (data) {
      const pending = data.filter(d => d.status === "pending");
      setStats({
        pending: pending.length,
        approved: data.filter(d => d.status === "approved" || d.status === "completed").length,
        rejected: data.filter(d => d.status === "rejected").length,
        totalPending: pending.reduce((s, d) => s + Number(d.amount), 0),
      });
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    const settings = [
      { key: "withdrawal_fee_rate", value: config.withdrawal_fee_rate },
      { key: "withdrawal_min_amount", value: config.withdrawal_min_amount },
      { key: "withdrawal_max_amount", value: config.withdrawal_max_amount },
      { key: "withdrawal_enabled", value: config.withdrawal_enabled },
      { key: "withdrawal_notify_admin", value: config.withdrawal_notify_admin },
      { key: "withdrawal_auto_approve", value: config.withdrawal_auto_approve },
      { key: "withdrawal_auto_approve_limit", value: config.withdrawal_auto_approve_limit },
      { key: "withdrawal_cooldown_hours", value: config.withdrawal_cooldown_hours },
      { key: "withdrawal_principal_penalty_rate", value: config.principal_penalty_rate },
    ];
    for (const s of settings) {
      await supabase.from("system_settings").upsert(
        { key: s.key, value: JSON.parse(JSON.stringify(s.value)), updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    }
    toast({ title: "Withdrawal settings saved" });
    setSaving(false);
  };

  const updateTier = (idx: number, field: "days" | "rate", val: number) => {
    const tiers = [...config.penalty_tiers];
    tiers[idx] = { ...tiers[idx], [field]: val };
    setConfig({ ...config, penalty_tiers: tiers });
  };

  const addTier = () => {
    const last = config.penalty_tiers[config.penalty_tiers.length - 1];
    setConfig({ ...config, penalty_tiers: [...config.penalty_tiers, { days: (last?.days || 0) + 30, rate: 0.01 }] });
  };

  const removeTier = (idx: number) => {
    setConfig({ ...config, penalty_tiers: config.penalty_tiers.filter((_, i) => i !== idx) });
  };

  if (loading) return <AdminLayout title="Withdrawal Settings"><div className="flex items-center justify-center py-20"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div></AdminLayout>;

  return (
    <AdminLayout title="Withdrawal Settings">
      <div className="space-y-6 max-w-4xl">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Pending", value: stats.pending, color: "text-warning", icon: Clock },
            { label: "Pending Volume", value: `$${stats.totalPending.toFixed(0)}`, color: "text-warning", icon: DollarSign },
            { label: "Approved", value: stats.approved, color: "text-success", icon: Shield },
            { label: "Rejected", value: stats.rejected, color: "text-destructive", icon: AlertTriangle },
          ].map((s, i) => (
            <div key={i} className="glass-strong rounded-xl p-4">
              <s.icon className={`w-4 h-4 ${s.color} mb-1`} />
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="text-lg font-display font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* General Settings */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> General Settings</h3>

          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-foreground">Enable Withdrawals</p><p className="text-[10px] text-muted-foreground">Allow members to submit withdrawal requests</p></div>
            <Switch checked={config.withdrawal_enabled} onCheckedChange={v => setConfig({ ...config, withdrawal_enabled: v })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Withdrawal Fee (%)</label>
              <Input type="number" step="0.01" value={(config.withdrawal_fee_rate * 100).toFixed(1)} onChange={e => setConfig({ ...config, withdrawal_fee_rate: Number(e.target.value) / 100 })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Min Amount ($)</label>
              <Input type="number" value={config.withdrawal_min_amount} onChange={e => setConfig({ ...config, withdrawal_min_amount: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Max Amount ($)</label>
              <Input type="number" value={config.withdrawal_max_amount} onChange={e => setConfig({ ...config, withdrawal_max_amount: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Cooldown Between Withdrawals (hours)</label>
            <Input type="number" value={config.withdrawal_cooldown_hours} onChange={e => setConfig({ ...config, withdrawal_cooldown_hours: Number(e.target.value) })} className="max-w-xs" />
          </div>
        </div>

        {/* Auto-Approve */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Shield className="w-4 h-4 text-success" /> Auto-Approve</h3>

          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-foreground">Auto-Approve Small Withdrawals</p><p className="text-[10px] text-muted-foreground">Automatically approve withdrawals below the limit</p></div>
            <Switch checked={config.withdrawal_auto_approve} onCheckedChange={v => setConfig({ ...config, withdrawal_auto_approve: v })} />
          </div>

          {config.withdrawal_auto_approve && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Auto-Approve Limit ($)</label>
              <Input type="number" value={config.withdrawal_auto_approve_limit} onChange={e => setConfig({ ...config, withdrawal_auto_approve_limit: Number(e.target.value) })} className="max-w-xs" />
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Bell className="w-4 h-4 text-warning" /> Notifications</h3>

          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-foreground">Notify Admin on New Withdrawal</p><p className="text-[10px] text-muted-foreground">Send notification to admin when a new withdrawal request is submitted</p></div>
            <Switch checked={config.withdrawal_notify_admin} onCheckedChange={v => setConfig({ ...config, withdrawal_notify_admin: v })} />
          </div>
        </div>

        {/* Penalty Tiers */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Percent className="w-4 h-4 text-destructive" /> Principal Withdrawal Penalty Tiers</h3>
          <p className="text-[10px] text-muted-foreground">Penalty rates based on how long the member has been investing. Only applies to principal/deposit withdrawals.</p>

          <div className="space-y-2">
            {config.penalty_tiers.map((tier, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">After (days)</label>
                  <Input type="number" value={tier.days} onChange={e => updateTier(idx, "days", Number(e.target.value))} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">Penalty Rate (%)</label>
                  <Input type="number" step="0.1" value={(tier.rate * 100).toFixed(1)} onChange={e => updateTier(idx, "rate", Number(e.target.value) / 100)} />
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeTier(idx)} className="text-destructive hover:bg-destructive/10 mt-4 text-xs">✕</Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addTier} className="text-xs">+ Add Tier</Button>
        </div>

        {/* Save */}
        <Button onClick={saveConfig} disabled={saving} className="gradient-primary text-primary-foreground w-full">
          <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Withdrawal Settings"}
        </Button>
      </div>
    </AdminLayout>
  );
};

export default AdminWithdrawalSettings;
