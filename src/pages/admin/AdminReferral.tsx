import { useEffect, useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { GitBranch, Users, DollarSign, Edit2, Save, X, Search, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ChangeUplineDialog } from "@/components/admin/ChangeUplineDialog";

const DEFAULT_REBATE_RATES = [10, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const DEFAULT_REFERRAL_RATES = [5, 3, 2, 1, 0.5];

const AdminReferral = () => {
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCommissions: 0, totalUsers: 0 });
  const [profiles, setProfiles] = useState<any[]>([]);
  const [editingRebateRates, setEditingRebateRates] = useState(false);
  const [rebateRates, setRebateRates] = useState<number[]>(DEFAULT_REBATE_RATES);
  const [editingReferralRates, setEditingReferralRates] = useState(false);
  const [referralRates, setReferralRates] = useState<number[]>(DEFAULT_REFERRAL_RATES);
  const [savingRates, setSavingRates] = useState(false);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [changeUplineProfile, setChangeUplineProfile] = useState<any | null>(null);

  const handleUplineChanged = (profileId: string, newUplineId: string | null) => {
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, referred_by: newUplineId } : p));
  };

  useEffect(() => {
    const fetchData = async () => {
      const [comRes, profRes, rebateRatesRes, refRatesRes] = await Promise.all([
        supabase.from("commissions").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("profiles").select("id, user_id, full_name, referral_code, referred_by, rank").order("created_at", { ascending: false }),
        supabase.from("system_settings").select("value").eq("key", "commission_rates").maybeSingle(),
        supabase.from("system_settings").select("value").eq("key", "referral_commission_rates").maybeSingle(),
      ]);
      if (comRes.data) {
        setCommissions(comRes.data);
        setStats(prev => ({ ...prev, totalCommissions: comRes.data!.reduce((s, c) => s + Number(c.amount), 0) }));
      }
      if (profRes.data) {
        setProfiles(profRes.data);
        setStats(prev => ({ ...prev, totalUsers: profRes.data!.filter(p => p.referred_by).length }));
      }
      if (rebateRatesRes.data && Array.isArray(rebateRatesRes.data.value)) {
        setRebateRates((rebateRatesRes.data.value as number[]).map(Number));
      }
      if (refRatesRes.data && Array.isArray(refRatesRes.data.value)) {
        setReferralRates((refRatesRes.data.value as number[]).map(Number));
      }
    };
    fetchData();
  }, []);

  const getUserName = (userId: string) => profiles.find(p => p.user_id === userId)?.full_name || "User";

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return profiles;
    const q = searchQuery.toLowerCase();
    return profiles.filter(p =>
      (p.full_name || "").toLowerCase().includes(q) ||
      (p.referral_code || "").toLowerCase().includes(q)
    );
  }, [profiles, searchQuery]);

  const filteredRoots = useMemo(() => {
    if (!searchQuery.trim()) return profiles.filter(p => !p.referred_by || !profiles.some(up => up.referral_code === p.referred_by));
    return filteredProfiles;
  }, [filteredProfiles, profiles, searchQuery]);

  const handleSaveRebateRates = async () => {
    setSavingRates(true);
    await supabase.from("system_settings").upsert(
      { key: "commission_rates", value: rebateRates as any, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    toast({ title: "Rebate rates saved!" });
    setEditingRebateRates(false);
    setSavingRates(false);
  };

  const handleSaveReferralRates = async () => {
    setSavingRates(true);
    const normalizedRates = referralRates.slice(0, 5).map(rate => Number(rate) || 0);
    const { error } = await supabase.from("system_settings").upsert(
      { key: "referral_commission_rates", value: referralRates as any, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setReferralRates(normalizedRates);
      toast({ title: "Referral commission rates saved!" });
      setEditingReferralRates(false);
    }
    setSavingRates(false);
  };

  const handleEditProfile = (profile: any) => {
    setEditingProfile(profile.id);
    setEditName(profile.full_name || "");
  };

  const handleSaveProfile = async (profileId: string) => {
    await supabase.from("profiles").update({ full_name: editName }).eq("id", profileId);
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, full_name: editName } : p));
    setEditingProfile(null);
    toast({ title: "Profile updated!" });
  };

  return (
    <AdminLayout title="Referral Network">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="glass-strong rounded-xl p-4">
            <Users className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Referred Users</p>
            <p className="text-lg font-display font-bold text-foreground">{stats.totalUsers}</p>
          </div>
          <div className="glass-strong rounded-xl p-4">
            <DollarSign className="w-5 h-5 text-success mb-2" />
            <p className="text-xs text-muted-foreground">Total Commissions</p>
            <p className="text-lg font-display font-bold text-foreground">${stats.totalCommissions.toFixed(2)}</p>
          </div>
          <div className="glass-strong rounded-xl p-4">
            <DollarSign className="w-5 h-5 text-success mb-2" />
            <p className="text-xs text-muted-foreground">Referral Rates (5 Levels - Deposit)</p>
            {editingReferralRates ? (
              <div className="space-y-1 mt-1">
                <div className="grid grid-cols-5 gap-1">
                  {referralRates.map((rate, i) => (
                    <div key={i} className="flex items-center gap-0.5">
                      <span className="text-[9px] text-muted-foreground w-5">L{i + 1}</span>
                      <Input type="number" value={rate} onChange={e => {
                        const newRates = [...referralRates];
                        newRates[i] = Number(e.target.value);
                        setReferralRates(newRates);
                      }} className="h-6 text-xs w-14" step="0.1" />
                      <span className="text-[9px] text-muted-foreground">%</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1 mt-1">
                  <Button size="sm" onClick={handleSaveReferralRates} disabled={savingRates} className="h-6 text-[10px] px-2">
                    <Save className="w-3 h-3 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingReferralRates(false)} className="h-6 text-[10px] px-2">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                <p className="text-[10px] font-medium text-foreground">
                  {referralRates.map((r, i) => `L${i + 1}: ${r}%`).join(" · ")}
                </p>
                <button onClick={() => setEditingReferralRates(true)} className="p-1 hover:bg-muted/50 rounded">
                  <Edit2 className="w-3 h-3 text-primary" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="glass-strong rounded-xl p-4">
          <GitBranch className="w-5 h-5 text-accent mb-2" />
          <p className="text-xs text-muted-foreground">Rebate Rates (20 Levels - Daily Profit)</p>
          {editingRebateRates ? (
              <div className="space-y-1 mt-1">
                <div className="grid grid-cols-4 gap-1">
                  {rebateRates.map((rate, i) => (
                    <div key={i} className="flex items-center gap-0.5">
                      <span className="text-[9px] text-muted-foreground w-5">L{i + 1}</span>
                      <Input type="number" value={rate} onChange={e => {
                        const newRates = [...rebateRates];
                        newRates[i] = Number(e.target.value);
                        setRebateRates(newRates);
                      }} className="h-6 text-xs w-14" step="0.1" />
                      <span className="text-[9px] text-muted-foreground">%</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1 mt-1">
                  <Button size="sm" onClick={handleSaveRebateRates} disabled={savingRates} className="h-6 text-[10px] px-2">
                    <Save className="w-3 h-3 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingRebateRates(false)} className="h-6 text-[10px] px-2">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                <p className="text-[10px] font-medium text-foreground">
                  L1: {rebateRates[0]}% · L2-10: {rebateRates[1]}% · L11-20: {rebateRates[10] || 1}%
                </p>
                <button onClick={() => setEditingRebateRates(true)} className="p-1 hover:bg-muted/50 rounded">
                  <Edit2 className="w-3 h-3 text-primary" />
                </button>
              </div>
            )}
          </div>

        <div className="glass-strong rounded-2xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Referral Tree</h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or referral code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="space-y-2">
            {filteredRoots.map(root => (
              <ReferralNode key={root.id} profile={root} profiles={profiles} level={0}
                editingProfile={editingProfile} editName={editName} setEditName={setEditName}
                onEdit={handleEditProfile} onSave={handleSaveProfile} onCancel={() => setEditingProfile(null)}
                onChangeUpline={setChangeUplineProfile} />
            ))}
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Recent Commissions</h3>
          <div className="space-y-2">
            {commissions.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{getUserName(c.user_id)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {c.type === "rank_weekly" ? "Rank Weekly" : `Level ${c.level}`} · from {getUserName(c.from_user_id)}
                  </p>
                </div>
                <p className="text-sm font-bold text-success">${Number(c.amount).toFixed(2)}</p>
              </div>
            ))}
            {commissions.length === 0 && <p className="text-muted-foreground text-center py-4">No commissions yet</p>}
          </div>
        </div>
      </div>
      {changeUplineProfile && (
        <ChangeUplineDialog
          open={!!changeUplineProfile}
          onClose={() => setChangeUplineProfile(null)}
          profile={changeUplineProfile}
          profiles={profiles}
          onSuccess={handleUplineChanged}
        />
      )}
    </AdminLayout>
  );
};

function ReferralNode({ profile, profiles, level, editingProfile, editName, setEditName, onEdit, onSave, onCancel, onChangeUpline }: {
  profile: any; profiles: any[]; level: number;
  editingProfile: string | null; editName: string; setEditName: (v: string) => void;
  onEdit: (p: any) => void; onSave: (id: string) => void; onCancel: () => void;
  onChangeUpline: (p: any) => void;
}) {
  const children = profiles.filter(p => p.referred_by === profile.referral_code);
  const isEditing = editingProfile === profile.id;

  return (
    <div style={{ paddingLeft: level * 20 }}>
      <div className="flex items-center gap-2 py-1 group">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-[10px] font-bold text-primary">{(profile.full_name || "U")[0].toUpperCase()}</span>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-6 text-sm w-32" />
            <Button size="sm" onClick={() => onSave(profile.id)} className="h-6 text-[10px] px-2"><Save className="w-3 h-3" /></Button>
            <Button size="sm" variant="ghost" onClick={onCancel} className="h-6 text-[10px] px-1"><X className="w-3 h-3" /></Button>
          </div>
        ) : (
          <>
            <span className="text-sm text-foreground">{profile.full_name || "User"}</span>
            <span className="text-[10px] text-muted-foreground">({profile.referral_code})</span>
            {children.length > 0 && <span className="text-[10px] text-primary">· {children.length} refs</span>}
            <button onClick={() => onEdit(profile)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted/50 rounded transition" title="Edit nama">
              <Edit2 className="w-3 h-3 text-muted-foreground" />
            </button>
            <button onClick={() => onChangeUpline(profile)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted/50 rounded transition" title="Ubah Upline">
              <ArrowUpDown className="w-3 h-3 text-primary" />
            </button>
          </>
        )}
      </div>
      {children.map(child => (
        <ReferralNode key={child.id} profile={child} profiles={profiles} level={level + 1}
          editingProfile={editingProfile} editName={editName} setEditName={setEditName}
          onEdit={onEdit} onSave={onSave} onCancel={onCancel} onChangeUpline={onChangeUpline} />
      ))}
    </div>
  );
}

export default AdminReferral;
