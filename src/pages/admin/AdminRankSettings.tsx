import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Award, Save, RotateCcw } from "lucide-react";

interface RankConfig {
  name: string;
  label: string;
  personalInvestment: number;
  referrals: number;
  volume: number;
  weeklyCommission: number;
}

const DEFAULT_RANKS: RankConfig[] = [
  { name: "bronze",  label: "Bronze",  personalInvestment: 100,  referrals: 5,   volume: 1000,    weeklyCommission: 10 },
  { name: "silver",  label: "Silver",  personalInvestment: 200,  referrals: 10,  volume: 2500,    weeklyCommission: 20 },
  { name: "gold",    label: "Gold",    personalInvestment: 250,  referrals: 15,  volume: 5000,    weeklyCommission: 50 },
  { name: "diamond", label: "Diamond", personalInvestment: 500,  referrals: 30,  volume: 10000,   weeklyCommission: 100 },
  { name: "emerald", label: "Emerald", personalInvestment: 1000, referrals: 60,  volume: 25000,   weeklyCommission: 250 },
  { name: "ruby",    label: "Ruby",    personalInvestment: 1500, referrals: 100, volume: 50000,   weeklyCommission: 500 },
  { name: "crown",   label: "Crown",   personalInvestment: 2000, referrals: 200, volume: 100000,  weeklyCommission: 1000 },
  { name: "legend",  label: "Legend",  personalInvestment: 2500, referrals: 500, volume: 500000,  weeklyCommission: 5000 },
];

const SETTING_KEY = "rank_config";

const AdminRankSettings = () => {
  const { toast } = useToast();
  const [ranks, setRanks] = useState<RankConfig[]>(DEFAULT_RANKS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", SETTING_KEY)
        .maybeSingle();

      if (data?.value && Array.isArray(data.value)) {
        setRanks(data.value as unknown as RankConfig[]);
      }
      setLoaded(true);
    };
    load();
  }, []);

  const updateRank = (index: number, field: keyof RankConfig, value: string) => {
    setRanks(prev => prev.map((r, i) =>
      i === index ? { ...r, [field]: field === "name" || field === "label" ? value : Number(value) || 0 } : r
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: existing } = await supabase
      .from("system_settings")
      .select("id")
      .eq("key", SETTING_KEY)
      .maybeSingle();

    if (existing) {
      await supabase.from("system_settings").update({ value: ranks as any }).eq("key", SETTING_KEY);
    } else {
      await supabase.from("system_settings").insert({ key: SETTING_KEY, value: ranks as any });
    }

    toast({ title: "Rank settings saved!", description: "Changes will take effect on next rank evaluation." });
    setSaving(false);
  };

  const handleReset = () => {
    setRanks(DEFAULT_RANKS);
    toast({ title: "Reset to defaults", description: "Click Save to apply." });
  };

  if (!loaded) return <AdminLayout title="Rank Settings"><div className="text-center py-10 text-muted-foreground">Loading...</div></AdminLayout>;

  return (
    <AdminLayout title="Rank Settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <p className="text-sm text-muted-foreground">Configure requirements and weekly commissions for each rank</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" /> Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block glass-strong rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left p-3 text-muted-foreground font-medium">Rank</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Personal Bot ($)</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Direct Referrals</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Team Volume ($)</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Weekly Commission ($)</th>
              </tr>
            </thead>
            <tbody>
              {ranks.map((rank, i) => (
                <tr key={rank.name} className="border-b border-border/10 last:border-0">
                  <td className="p-3">
                    <span className="font-display font-semibold text-foreground">{rank.label}</span>
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      value={rank.personalInvestment}
                      onChange={e => updateRank(i, "personalInvestment", e.target.value)}
                      className="h-8 w-28"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      value={rank.referrals}
                      onChange={e => updateRank(i, "referrals", e.target.value)}
                      className="h-8 w-24"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      value={rank.volume}
                      onChange={e => updateRank(i, "volume", e.target.value)}
                      className="h-8 w-32"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      value={rank.weeklyCommission}
                      onChange={e => updateRank(i, "weeklyCommission", e.target.value)}
                      className="h-8 w-28"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden space-y-3">
          {ranks.map((rank, i) => (
            <div key={rank.name} className="glass-strong rounded-2xl p-4 space-y-3">
              <h3 className="font-display font-bold text-foreground">{rank.label}</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Personal Bot ($)</label>
                  <Input
                    type="number"
                    value={rank.personalInvestment}
                    onChange={e => updateRank(i, "personalInvestment", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Direct Referrals</label>
                  <Input
                    type="number"
                    value={rank.referrals}
                    onChange={e => updateRank(i, "referrals", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Team Volume ($)</label>
                  <Input
                    type="number"
                    value={rank.volume}
                    onChange={e => updateRank(i, "volume", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Weekly Commission ($)</label>
                  <Input
                    type="number"
                    value={rank.weeklyCommission}
                    onChange={e => updateRank(i, "weeklyCommission", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-strong rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">
            <strong>How it works:</strong> The auto-rank-upgrade function runs daily at 00:30 UTC. It checks each user's personal active investment, direct active referrals, and team investment volume against these thresholds. Users are only upgraded, never downgraded. Weekly rank commissions are paid every Monday at 01:00 UTC.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRankSettings;
