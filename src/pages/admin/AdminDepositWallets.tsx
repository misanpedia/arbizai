import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Wallet, Plus, Trash2 } from "lucide-react";

interface DepositWallet {
  id: string;
  network: string;
  address: string;
  warning: string;
  is_active: boolean;
}

const DEFAULT_WALLETS: DepositWallet[] = [
  { id: "BEP20", network: "BEP20", address: "", warning: "Only send USDT on BNB Smart Chain (BEP20)", is_active: true },
  { id: "TRC20", network: "TRC20", address: "", warning: "Only send USDT on TRON Network (TRC20)", is_active: true },
  { id: "ERC20", network: "ERC20", address: "", warning: "Only send USDT on Ethereum Network (ERC20)", is_active: true },
];

const AdminDepositWallets = () => {
  const { toast } = useToast();
  const [wallets, setWallets] = useState<DepositWallet[]>(DEFAULT_WALLETS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallets = async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "deposit_wallets")
        .maybeSingle();
      if (data?.value && Array.isArray(data.value)) {
        setWallets(data.value as unknown as DepositWallet[]);
      }
      setLoading(false);
    };
    fetchWallets();
  }, []);

  const updateWallet = (index: number, field: keyof DepositWallet, value: string | boolean) => {
    setWallets(prev => prev.map((w, i) => i === index ? { ...w, [field]: value } : w));
  };

  const addWallet = () => {
    const id = `CUSTOM_${Date.now()}`;
    setWallets(prev => [...prev, { id, network: "", address: "", warning: "", is_active: true }]);
  };

  const removeWallet = (index: number) => {
    setWallets(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: existing } = await supabase
      .from("system_settings")
      .select("id")
      .eq("key", "deposit_wallets")
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("system_settings")
        .update({ value: wallets as any })
        .eq("key", "deposit_wallets"));
    } else {
      ({ error } = await supabase
        .from("system_settings")
        .insert({ key: "deposit_wallets", value: wallets as any }));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Deposit wallet addresses updated successfully." });
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Deposit Wallets">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Deposit Wallets">
      <div className="space-y-6 max-w-3xl">
        <p className="text-sm text-muted-foreground">
          Kelola alamat wallet deposit yang ditampilkan kepada user. Aktifkan atau nonaktifkan network sesuai kebutuhan.
        </p>

        <div className="space-y-4">
          {wallets.map((wallet, index) => (
            <div key={wallet.id} className="glass-strong rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">{wallet.network || "New Network"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Active</Label>
                    <Switch
                      checked={wallet.is_active}
                      onCheckedChange={(v) => updateWallet(index, "is_active", v)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWallet(index)}
                    className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Network Name</Label>
                  <Input
                    value={wallet.network}
                    onChange={(e) => updateWallet(index, "network", e.target.value)}
                    placeholder="e.g. BEP20"
                    className="glass"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Wallet Address</Label>
                  <Input
                    value={wallet.address}
                    onChange={(e) => updateWallet(index, "address", e.target.value)}
                    placeholder="0x..."
                    className="glass font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Warning Message</Label>
                <Input
                  value={wallet.warning}
                  onChange={(e) => updateWallet(index, "warning", e.target.value)}
                  placeholder="Only send USDT on..."
                  className="glass"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={addWallet} className="gap-2">
            <Plus className="w-4 h-4" /> Add Network
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDepositWallets;
