import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Flame, Save, Users } from "lucide-react";
import { motion } from "framer-motion";

const DEFAULT_REWARDS = [0.05, 0.10, 0.15, 0.25, 0.50, 0.75, 1.00];

const AdminCheckinSettings = () => {
  const { toast } = useToast();
  const [rewards, setRewards] = useState<string[]>(DEFAULT_REWARDS.map(String));
  const [saving, setSaving] = useState(false);
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [todayCheckins, setTodayCheckins] = useState(0);
  const [topStreakers, setTopStreakers] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().split("T")[0];
      const [settingRes, totalRes, todayRes, topRes] = await Promise.all([
        supabase.from("system_settings").select("value").eq("key", "checkin_rewards").maybeSingle(),
        supabase.from("daily_checkins").select("id", { count: "exact", head: true }),
        supabase.from("daily_checkins").select("id", { count: "exact", head: true }).eq("checkin_date", today),
        supabase.from("daily_checkins").select("user_id, day_streak, checkin_date").order("day_streak", { ascending: false }).limit(10),
      ]);

      if (settingRes.data) {
        try {
          const parsed = typeof settingRes.data.value === "string" 
            ? JSON.parse(settingRes.data.value) 
            : settingRes.data.value;
          if (Array.isArray(parsed)) setRewards(parsed.map(String));
        } catch { /* use defaults */ }
      }

      setTotalCheckins(totalRes.count || 0);
      setTodayCheckins(todayRes.count || 0);
      if (topRes.data) setTopStreakers(topRes.data);
    };
    fetch();
  }, []);

  const updateReward = (index: number, value: string) => {
    const updated = [...rewards];
    updated[index] = value;
    setRewards(updated);
  };

  const addDay = () => setRewards([...rewards, "0.00"]);
  const removeDay = () => { if (rewards.length > 1) setRewards(rewards.slice(0, -1)); };

  const saveRewards = async () => {
    setSaving(true);
    const numericRewards = rewards.map(r => parseFloat(r) || 0);
    await supabase.from("system_settings").upsert(
      { key: "checkin_rewards", value: JSON.stringify(numericRewards), updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    // Also update the base reward for backward compat
    await supabase.from("system_settings").upsert(
      { key: "checkin_base_reward", value: JSON.stringify(String(numericRewards[0])), updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    setSaving(false);
    toast({ title: "✅ Check-in rewards saved!" });
  };

  return (
    <AdminLayout title="Check-in Settings">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Check-ins", value: totalCheckins, color: "text-primary" },
            { label: "Today's Check-ins", value: todayCheckins, color: "text-success" },
            { label: "Reward Days", value: rewards.length, color: "text-warning" },
          ].map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-strong rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={`text-lg font-display font-bold ${c.color}`}>{c.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Reward Configuration */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Flame className="w-4 h-4 text-warning" /> Streak Reward Tiers
          </h3>
          <p className="text-xs text-muted-foreground">Configure the reward amount for each consecutive check-in day. After the last day, rewards cycle back to the last value.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {rewards.map((r, i) => (
              <div key={i} className="space-y-1">
                <Label className="text-xs">Day {i + 1}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={r}
                  onChange={e => updateReward(i, e.target.value)}
                  className="text-center"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={addDay}>+ Add Day</Button>
            <Button variant="outline" size="sm" onClick={removeDay} disabled={rewards.length <= 1}>- Remove Last</Button>
          </div>

          <Button onClick={saveRewards} disabled={saving} className="gradient-primary text-primary-foreground">
            <Save className="w-3 h-3 mr-1" />{saving ? "Saving..." : "Save Rewards"}
          </Button>
        </div>

        {/* Top Streakers */}
        <div className="glass-strong rounded-2xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Top Streakers
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Streak</TableHead>
                  <TableHead>Last Check-in</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topStreakers.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No check-ins yet</TableCell></TableRow>
                ) : (
                  topStreakers.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-bold">{i + 1}</TableCell>
                      <TableCell className="text-xs font-mono">{s.user_id?.slice(0, 8)}...</TableCell>
                      <TableCell className="text-xs font-bold text-warning">{s.day_streak} days 🔥</TableCell>
                      <TableCell className="text-xs">{new Date(s.checkin_date).toLocaleDateString()}</TableCell>
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

export default AdminCheckinSettings;
