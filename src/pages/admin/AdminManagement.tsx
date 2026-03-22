import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCog, Shield, Trash2, Plus, Settings, CheckSquare, Square } from "lucide-react";

const ALL_PERMISSIONS = [
  "view_users", "manage_users",
  "view_deposits", "manage_deposits",
  "view_withdrawals", "manage_withdrawals",
  "manage_kyc", "view_reports",
  "manage_notifications", "view_wallets",
  "manage_plans", "manage_settings",
  "manage_referral", "manage_profit_engine",
];

const ROLES = ["admin", "manager", "finance"] as const;

const AdminManagement = () => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [newAdminSearch, setNewAdminSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [permissions, setPermissions] = useState<any[]>([]);

  const fetchData = async () => {
    const { data: roles } = await supabase.from("user_roles").select("*").in("role", ["admin", "moderator", "user"] as any);
    if (roles) {
      const userIds = roles.map(r => r.user_id);
      const { data: profs } = userIds.length > 0
        ? await supabase.from("profiles").select("*").in("user_id", userIds)
        : { data: [] };
      setAdmins(roles.map(r => ({ ...r, profile: profs?.find(p => p.user_id === r.user_id) })));
    }
    const { data: allProfiles } = await supabase.from("profiles").select("user_id, full_name, referral_code");
    if (allProfiles) setProfiles(allProfiles);

    const { data: perms } = await supabase.from("role_permissions").select("*");
    if (perms) setPermissions(perms);
  };

  useEffect(() => { fetchData(); }, []);

  const addStaff = async (userId: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: selectedRole as any });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `${selectedRole} added!` }); fetchData(); setNewAdminSearch(""); }
  };

  const removeStaff = async (roleId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Role removed" }); fetchData(); }
  };

  const togglePermission = async (role: string, permission: string) => {
    const existing = permissions.find(p => p.role === role && p.permission === permission);
    if (existing) {
      await supabase.from("role_permissions").delete().eq("id", existing.id);
    } else {
      await supabase.from("role_permissions").insert({ role: role as any, permission });
    }
    fetchData();
  };

  const hasPermission = (role: string, perm: string) => permissions.some(p => p.role === role && p.permission === perm);

  const searchResults = newAdminSearch.length >= 2
    ? profiles.filter(p => !admins.some(a => a.user_id === p.user_id) && ((p.full_name || "").toLowerCase().includes(newAdminSearch.toLowerCase()) || (p.referral_code || "").includes(newAdminSearch)))
    : [];

  const roleColors: Record<string, string> = {
    admin: "text-primary",
    manager: "text-warning",
    finance: "text-success",
  };

  return (
    <AdminLayout title="Admin Management">
      <div className="max-w-3xl space-y-6">
        {/* Current Staff */}
        <div className="glass-strong rounded-2xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-primary" /> Staff Members
          </h3>
          <div className="space-y-2">
            {admins.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <Shield className={`w-4 h-4 ${roleColors[a.role] || "text-primary"}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.profile?.full_name || "User"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      <span className={`font-medium uppercase ${roleColors[a.role]}`}>{a.role}</span> · Ref: {a.profile?.referral_code}
                    </p>
                  </div>
                </div>
                <button onClick={() => removeStaff(a.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {admins.length === 0 && <p className="text-muted-foreground text-center py-4">No staff found</p>}
          </div>
        </div>

        {/* Add Staff */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> Add Staff
          </h3>
          <div className="flex gap-2">
            {ROLES.map(role => (
              <button key={role} onClick={() => setSelectedRole(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${selectedRole === role ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}>
                {role}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <Label>Search User</Label>
            <Input value={newAdminSearch} onChange={e => setNewAdminSearch(e.target.value)} placeholder="Search by name or referral code..." />
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {searchResults.map(p => (
                <div key={p.user_id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                  <span className="text-sm text-foreground">{p.full_name || "User"} ({p.referral_code})</span>
                  <Button size="sm" onClick={() => addStaff(p.user_id)} className="h-7 text-xs"><Plus className="w-3 h-3 mr-1" />Add as {selectedRole}</Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role Permissions */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" /> Role Permissions
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 text-muted-foreground font-medium">Permission</th>
                  {ROLES.filter(r => r !== "admin").map(role => (
                    <th key={role} className={`text-center py-2 font-medium capitalize ${roleColors[role]}`}>{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_PERMISSIONS.map(perm => (
                  <tr key={perm} className="border-b border-border/20">
                    <td className="py-2 text-foreground text-xs">{perm.replace(/_/g, " ")}</td>
                    {ROLES.filter(r => r !== "admin").map(role => (
                      <td key={role} className="text-center py-2">
                        <button onClick={() => togglePermission(role, perm)} className="mx-auto">
                          {hasPermission(role, perm)
                            ? <CheckSquare className="w-4 h-4 text-success" />
                            : <Square className="w-4 h-4 text-muted-foreground" />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground">Admin role has all permissions by default.</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminManagement;
