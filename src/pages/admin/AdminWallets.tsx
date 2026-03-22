import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Wallet } from "lucide-react";

const AdminWallets = () => {
  const [wallets, setWallets] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("wallets").select("*, profiles!inner(full_name, referral_code)").order("created_at", { ascending: false });
      if (data) setWallets(data);
    };
    fetch();
  }, []);

  const filtered = wallets.filter((w: any) => !search || (w.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase()));

  // Group by user
  const grouped = filtered.reduce((acc: Record<string, any[]>, w: any) => {
    const key = w.user_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(w);
    return acc;
  }, {});

  return (
    <AdminLayout title="Wallets">
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="grid gap-3">
          {Object.entries(grouped).map(([userId, userWallets]: [string, any[]]) => (
            <div key={userId} className="glass-strong rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{userWallets[0]?.profiles?.full_name || "User"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {userWallets.map(w => (
                  <div key={w.id} className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">{w.currency}</p>
                    <p className="text-sm font-bold text-foreground">{Number(w.balance).toFixed(4)}</p>
                    {Number(w.frozen_balance) > 0 && <p className="text-[10px] text-warning">Frozen: {Number(w.frozen_balance).toFixed(4)}</p>}
                    {Number((w as any).reward_balance) > 0 && <p className="text-[10px] text-primary">Reward: {Number((w as any).reward_balance).toFixed(4)}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWallets;
