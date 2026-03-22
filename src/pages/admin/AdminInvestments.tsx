import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { TrendingUp, Search, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

const AdminInvestments = () => {
  const [investments, setInvestments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestments = async () => {
      setLoading(true);

      // Fetch all investments with plan info
      const { data: invData } = await supabase
        .from("investments")
        .select("*, investment_plans(display_name, name)")
        .order("created_at", { ascending: false });

      if (!invData || invData.length === 0) {
        setInvestments([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(invData.map((i) => i.user_id))];

      // Fetch profiles for those users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const profileMap: Record<string, { full_name: string; email: string }> = {};
      profiles?.forEach((p) => {
        profileMap[p.user_id] = { full_name: p.full_name || "User", email: p.email || "" };
      });

      const enriched = invData.map((inv) => ({
        ...inv,
        full_name: profileMap[inv.user_id]?.full_name || "User",
        email: profileMap[inv.user_id]?.email || "",
        plan_display: inv.investment_plans?.display_name || inv.investment_plans?.name || "Unknown",
      }));

      setInvestments(enriched);
      setLoading(false);
    };

    fetchInvestments();
  }, []);

  const filtered = investments.filter((inv) => {
    const q = search.toLowerCase();
    return (
      inv.full_name?.toLowerCase().includes(q) ||
      inv.email?.toLowerCase().includes(q) ||
      inv.plan_display?.toLowerCase().includes(q)
    );
  });

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const statusColor = (status: string) => {
    if (status === "active") return "bg-success/15 text-success";
    if (status === "completed") return "bg-primary/15 text-primary";
    return "bg-muted text-muted-foreground";
  };

  return (
    <AdminLayout title="Investment History">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or plan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {filtered.length} records
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">No investments found</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((inv, i) => (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="glass-strong rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-sm font-medium text-foreground truncate">{inv.full_name}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{inv.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-primary">{inv.plan_display}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatTime(inv.created_at)}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-foreground">${Number(inv.amount).toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">Profit: ${Number(inv.total_profit).toFixed(2)}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColor(inv.status)}`}>
                    {inv.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminInvestments;
