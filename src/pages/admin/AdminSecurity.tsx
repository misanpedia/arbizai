import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Users, AlertTriangle, CheckCircle } from "lucide-react";

const AdminSecurity = () => {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, suspendedUsers: 0, kycVerified: 0, kycPending: 0 });
  const [suspiciousActivity, setSuspiciousActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: profiles } = await supabase.from("profiles").select("is_active, kyc_status");
      if (profiles) {
        setStats({
          totalUsers: profiles.length,
          activeUsers: profiles.filter(p => p.is_active).length,
          suspendedUsers: profiles.filter(p => !p.is_active).length,
          kycVerified: profiles.filter(p => p.kyc_status === "verified").length,
          kycPending: profiles.filter(p => p.kyc_status === "unverified" || p.kyc_status === "pending").length,
        });
      }

      // Check for large transactions as suspicious activity
      const { data: largeTx } = await supabase.from("transactions").select("*").gte("amount", 10000).order("created_at", { ascending: false }).limit(10);
      if (largeTx) setSuspiciousActivity(largeTx);
    };
    fetch();
  }, []);

  return (
    <AdminLayout title="Security">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
            { label: "Active", value: stats.activeUsers, icon: CheckCircle, color: "text-success" },
            { label: "Suspended", value: stats.suspendedUsers, icon: AlertTriangle, color: "text-destructive" },
            { label: "KYC Verified", value: stats.kycVerified, icon: Shield, color: "text-success" },
            { label: "KYC Pending", value: stats.kycPending, icon: Shield, color: "text-warning" },
          ].map((s, i) => (
            <div key={i} className="glass-strong rounded-xl p-4">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-display font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" /> Large Transactions (&gt;$10,000)
          </h3>
          <div className="space-y-2">
            {suspiciousActivity.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground capitalize">{tx.type} · {tx.currency}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">${Number(tx.amount).toFixed(2)}</p>
                  <span className={`text-[10px] font-medium ${tx.status === "pending" ? "text-warning" : "text-success"}`}>{tx.status}</span>
                </div>
              </div>
            ))}
            {suspiciousActivity.length === 0 && <p className="text-muted-foreground text-center py-4">No large transactions detected</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSecurity;
