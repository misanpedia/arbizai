import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Edit, Save, X } from "lucide-react";

const AdminPlans = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const fetchPlans = async () => {
    const { data } = await supabase.from("investment_plans").select("*").order("min_amount");
    if (data) setPlans(data);
  };

  useEffect(() => { fetchPlans(); }, []);

  const startEdit = (plan: any) => { setEditing(plan.id); setEditData(plan); };
  const cancelEdit = () => { setEditing(null); setEditData({}); };

  const savePlan = async () => {
    const { error } = await supabase.from("investment_plans").update({
      display_name: editData.display_name,
      min_amount: Number(editData.min_amount),
      max_amount: Number(editData.max_amount),
      daily_profit_min: Number(editData.daily_profit_min),
      daily_profit_max: Number(editData.daily_profit_max),
      roi_cap_multiplier: Number(editData.roi_cap_multiplier || 3),
      is_active: editData.is_active,
    }).eq("id", editing!);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Plan updated" }); cancelEdit(); fetchPlans(); }
  };

  return (
    <AdminLayout title="Investment Plans">
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map(plan => (
          <div key={plan.id} className="glass-strong rounded-2xl p-5">
            {editing === plan.id ? (
              <div className="space-y-3">
                <div className="space-y-1"><Label>Display Name</Label><Input value={editData.display_name} onChange={e => setEditData({ ...editData, display_name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label>Min Amount</Label><Input type="number" value={editData.min_amount} onChange={e => setEditData({ ...editData, min_amount: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Max Amount</Label><Input type="number" value={editData.max_amount} onChange={e => setEditData({ ...editData, max_amount: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label>Daily Min %</Label><Input type="number" step="0.01" value={editData.daily_profit_min} onChange={e => setEditData({ ...editData, daily_profit_min: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Daily Max %</Label><Input type="number" step="0.01" value={editData.daily_profit_max} onChange={e => setEditData({ ...editData, daily_profit_max: e.target.value })} /></div>
                </div>
                <div className="space-y-1">
                  <Label>ROI Cap Multiplier</Label>
                  <Input type="number" step="0.1" min="1" value={editData.roi_cap_multiplier ?? 3} onChange={e => setEditData({ ...editData, roi_cap_multiplier: e.target.value })} />
                  <p className="text-[10px] text-muted-foreground">3 = maximum ROI 300% including capital.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={editData.is_active} onChange={e => setEditData({ ...editData, is_active: e.target.checked })} />
                  <Label>Active</Label>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={savePlan} className="flex-1"><Save className="w-3 h-3 mr-1" />Save</Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit}><X className="w-3 h-3 mr-1" />Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-bold text-foreground">{plan.display_name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${plan.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{plan.is_active ? "Active" : "Inactive"}</span>
                    <button onClick={() => startEdit(plan)} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"><Edit className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Range:</span> <span className="font-medium text-foreground">${Number(plan.min_amount)} – ${Number(plan.max_amount)}</span></div>
                  <div><span className="text-muted-foreground">Daily:</span> <span className="font-medium text-success">{Number(plan.daily_profit_min)}% – {Number(plan.daily_profit_max)}%</span></div>
                  <div><span className="text-muted-foreground">ROI Cap:</span> <span className="font-medium text-primary">{Number(plan.roi_cap_multiplier || 3) * 100}%</span></div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminPlans;
