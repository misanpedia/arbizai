import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Save, CreditCard, Copy, Zap, AlertTriangle, Eye, EyeOff } from "lucide-react";

const PROVIDER = "nowpayments";

const AdminPaymentGateway = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showKeys, setShowKeys] = useState(false);

  const [apiKey, setApiKey] = useState("");
  const [ipnSecret, setIpnSecret] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [minAmount, setMinAmount] = useState(10);
  const [payCurrency, setPayCurrency] = useState("usdtbsc");

  const ipnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nowpayments-ipn`;

  useEffect(() => {
    supabase
      .from("payment_gateway_config")
      .select("*")
      .eq("provider", PROVIDER)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setApiKey(data.api_key || "");
          setIpnSecret(data.ipn_secret || "");
          setIsEnabled(!!data.is_enabled);
          setMinAmount(Number(data.min_amount ?? 10));
          setPayCurrency(data.pay_currency || "usdtbsc");
        }
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("payment_gateway_config").upsert(
      {
        provider: PROVIDER,
        api_key: apiKey.trim() || null,
        ipn_secret: ipnSecret.trim() || null,
        is_enabled: isEnabled,
        min_amount: minAmount,
        pay_currency: payCurrency.trim() || "usdtbsc",
      },
      { onConflict: "provider" },
    );

    // Public flag so members know if auto payment is available
    await supabase.from("system_settings").upsert(
      { key: "nowpayments_public", value: { enabled: isEnabled && !!apiKey.trim(), min_amount: minAmount } as never, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );

    setSaving(false);
    if (error) toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
    else toast({ title: "Pengaturan NOWPayments tersimpan" });
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    const { data, error } = await supabase.functions.invoke("nowpayments-test");
    setTesting(false);
    if (error) {
      setTestResult({ ok: false, message: error.message });
      return;
    }
    if (data?.success) setTestResult({ ok: true, message: `Koneksi berhasil. API status: ${data.api_status}` });
    else setTestResult({ ok: false, message: data?.error || "Koneksi gagal" });
  };

  if (loading) {
    return (
      <AdminLayout title="Payment Gateway">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Payment Gateway">
      <div className="space-y-6 max-w-4xl">
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> NOWPayments
            </h3>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>
          <p className="text-xs text-muted-foreground">
            Aktifkan untuk memberi member opsi deposit otomatis lewat NOWPayments. Deposit manual (transfer ke wallet admin) tetap berjalan.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">API Key</label>
              <div className="flex gap-2">
                <Input
                  type={showKeys ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Masukkan API key NOWPayments"
                  className="font-mono text-xs"
                />
                <Button variant="outline" size="icon" onClick={() => setShowKeys(!showKeys)}>
                  {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">IPN Secret Key</label>
              <Input
                type={showKeys ? "text" : "password"}
                value={ipnSecret}
                onChange={(e) => setIpnSecret(e.target.value)}
                placeholder="IPN secret (untuk verifikasi callback)"
                className="font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Minimum Deposit ($)</label>
              <Input type="number" value={minAmount} onChange={(e) => setMinAmount(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Pay Currency</label>
              <Input value={payCurrency} onChange={(e) => setPayCurrency(e.target.value)} placeholder="usdtbsc" />
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-3 space-y-1">
            <p className="text-xs font-medium text-foreground">IPN Callback URL</p>
            <div className="flex items-center gap-2">
              <code className="text-[10px] break-all flex-1 text-muted-foreground">{ipnUrl}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(ipnUrl); toast({ title: "URL disalin" }); }}
                className="p-2 rounded-lg hover:bg-muted text-primary shrink-0"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">Tempel URL ini di dashboard NOWPayments (Settings → IPN).</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={save} disabled={saving} className="gradient-primary text-primary-foreground flex-1">
              <Save className="w-4 h-4 mr-2" />{saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
            <Button onClick={runTest} disabled={testing} variant="outline" className="flex-1">
              <Zap className="w-4 h-4 mr-2" />{testing ? "Menguji..." : "Uji Koneksi API"}
            </Button>
          </div>

          {testResult && (
            <div className={`rounded-xl p-3 text-xs flex items-start gap-2 ${testResult.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="break-all">{testResult.message}</span>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentGateway;