import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { FileText, DollarSign, TrendingUp, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

const AdminReports = () => {
  const [data, setData] = useState({ deposits: [] as any[], withdrawals: [] as any[], profits: [] as any[], commissions: [] as any[] });

  useEffect(() => {
    const fetch = async () => {
      const [dRes, wRes, pRes, cRes] = await Promise.all([
        supabase.from("transactions").select("amount, status, created_at").eq("type", "deposit"),
        supabase.from("transactions").select("amount, status, created_at").eq("type", "withdraw"),
        supabase.from("profits").select("amount, profit_date"),
        supabase.from("commissions").select("amount, created_at"),
      ]);
      setData({ deposits: dRes.data || [], withdrawals: wRes.data || [], profits: pRes.data || [], commissions: cRes.data || [] });
    };
    fetch();
  }, []);

  const sum = (arr: any[]) => arr.reduce((s, i) => s + Number(i.amount), 0);
  const approved = (arr: any[]) => arr.filter(d => d.status === "approved" || d.status === "completed");

  const reports = [
    { label: "Total Deposits (Approved)", value: sum(approved(data.deposits)), icon: ArrowDownCircle, color: "text-success" },
    { label: "Total Withdrawals (Approved)", value: sum(approved(data.withdrawals)), icon: ArrowUpCircle, color: "text-warning" },
    { label: "Net Flow", value: sum(approved(data.deposits)) - sum(approved(data.withdrawals)), icon: DollarSign, color: "text-primary" },
    { label: "Total Profits Distributed", value: sum(data.profits), icon: TrendingUp, color: "text-accent" },
    { label: "Total Commissions Paid", value: sum(data.commissions), icon: FileText, color: "text-secondary" },
    { label: "Pending Deposits", value: data.deposits.filter(d => d.status === "pending").length, icon: ArrowDownCircle, color: "text-warning" },
  ];

  return (
    <AdminLayout title="Reports">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {reports.map((r, i) => (
            <div key={i} className="glass-strong rounded-xl p-4">
              <r.icon className={`w-5 h-5 ${r.color} mb-2`} />
              <p className="text-xs text-muted-foreground">{r.label}</p>
              <p className="text-lg font-display font-bold text-foreground">{typeof r.value === "number" && r.label !== "Pending Deposits" ? `$${r.value.toFixed(2)}` : r.value}</p>
            </div>
          ))}
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Daily Profit Distribution</h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {Object.entries(data.profits.reduce((acc: Record<string, number>, p) => {
              acc[p.profit_date] = (acc[p.profit_date] || 0) + Number(p.amount);
              return acc;
            }, {})).sort(([a], [b]) => b.localeCompare(a)).map(([date, total]) => (
              <div key={date} className="flex items-center justify-between py-1.5 border-b border-border/30">
                <span className="text-sm text-muted-foreground">{date}</span>
                <span className="text-sm font-bold text-foreground">${(total as number).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
