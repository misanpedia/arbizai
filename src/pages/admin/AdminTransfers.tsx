import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowRightLeft, Search, Ban, CheckCircle, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

const AdminTransfers = () => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [feeRate, setFeeRate] = useState("5");
  const [minAmount, setMinAmount] = useState("1");
  const [transferEnabled, setTransferEnabled] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchTransfers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("type", "transfer")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setTransfers(data);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["transfer_fee_rate", "transfer_min_amount", "transfer_enabled"]);
    if (data) {
      data.forEach((s: any) => {
        const val = typeof s.value === "string" ? s.value.replace(/"/g, "") : String(s.value);
        if (s.key === "transfer_fee_rate") setFeeRate(val);
        if (s.key === "transfer_min_amount") setMinAmount(val);
        if (s.key === "transfer_enabled") setTransferEnabled(val === "true");
      });
    }
  };

  useEffect(() => {
    fetchTransfers();
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    const settings = [
      { key: "transfer_fee_rate", value: JSON.stringify(feeRate) },
      { key: "transfer_min_amount", value: JSON.stringify(minAmount) },
      { key: "transfer_enabled", value: JSON.stringify(String(transferEnabled)) },
    ];
    for (const s of settings) {
      await supabase.from("system_settings").upsert(
        { key: s.key, value: s.value, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    }
    setSavingSettings(false);
    toast({ title: "✅ Settings Saved", description: "Transfer settings updated successfully." });
  };

  const filtered = transfers.filter(tx => {
    if (!search) return true;
    const q = search.toLowerCase();
    return tx.description?.toLowerCase().includes(q) || tx.user_id?.toLowerCase().includes(q);
  });

  const totalVolume = transfers.filter(t => !t.description?.startsWith("Received") && !t.description?.startsWith("Menerima")).reduce((s, t) => s + Number(t.amount), 0);
  const totalFees = transfers.reduce((s, t) => s + Number(t.fee || 0), 0);

  return (
    <AdminLayout title="Transfer Management">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Transfers", value: Math.floor(transfers.length / 2), color: "text-primary" },
            { label: "Transfer Volume", value: `$${totalVolume.toFixed(2)}`, color: "text-success" },
            { label: "Fees Collected", value: `$${totalFees.toFixed(2)}`, color: "text-warning" },
            { label: "Status", value: transferEnabled ? "Enabled" : "Disabled", color: transferEnabled ? "text-success" : "text-destructive" },
          ].map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-strong rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={`text-lg font-display font-bold ${c.color}`}>{c.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Settings */}
        <div className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">Transfer Settings</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fee Rate (%)</label>
              <Input value={feeRate} onChange={e => setFeeRate(e.target.value)} type="number" min="0" max="50" step="0.1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Minimum Amount ($)</label>
              <Input value={minAmount} onChange={e => setMinAmount(e.target.value)} type="number" min="0" step="0.01" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Enable Transfer</label>
              <Button
                variant={transferEnabled ? "default" : "destructive"}
                className="w-full"
                onClick={() => setTransferEnabled(!transferEnabled)}
              >
                {transferEnabled ? <><CheckCircle className="w-4 h-4 mr-2" /> Enabled</> : <><Ban className="w-4 h-4 mr-2" /> Disabled</>}
              </Button>
            </div>
          </div>
          <Button onClick={saveSettings} disabled={savingSettings} className="mt-4">
            {savingSettings ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        {/* Transfer History */}
        <div className="glass-strong rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Transfer History</h3>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search transfers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No transfers found</TableCell></TableRow>
                ) : (
                  filtered.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs">{new Date(tx.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs font-mono truncate max-w-[120px]">{tx.user_id?.slice(0, 8)}...</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{tx.description || "-"}</TableCell>
                      <TableCell className="text-right text-xs font-bold">${Number(tx.amount).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-xs text-warning">${Number(tx.fee || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${tx.status === "completed" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                          {tx.status}
                        </span>
                      </TableCell>
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

export default AdminTransfers;
