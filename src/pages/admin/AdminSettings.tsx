import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Key, Percent, Award, Coins, Phone, HelpCircle, Image as ImageIcon, Upload, RotateCcw } from "lucide-react";
import { MessageSquare, Send, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { broadcastLogo, useLogo } from "@/hooks/useLogo";

const defaultSettings = {
  withdrawal_fee: "5",
  min_deposit: "5",
  min_withdrawal: "10",
  max_withdrawal: "50000",
  maintenance_mode: false,
  platform_name: "Arbiz AI",
  nowpayments_api_key: "", // kept for backward compat but no longer saved to DB
  commission_l1: "5",
  commission_l2: "3",
  commission_l3: "2",
  commission_l4: "1",
  commission_l5: "0.5",
  commission_l6: "0.5",
  commission_l7: "0.3",
  commission_l8: "0.2",
  commission_l9: "0.1",
  commission_l10: "0.1",
  rank_bronze_referrals: "0",
  rank_bronze_volume: "0",
  rank_bronze_bonus: "0",
  rank_silver_referrals: "5",
  rank_silver_volume: "1000",
  rank_silver_bonus: "2",
  rank_gold_referrals: "15",
  rank_gold_volume: "10000",
  rank_gold_bonus: "5",
  rank_platinum_referrals: "30",
  rank_platinum_volume: "50000",
  rank_platinum_bonus: "8",
  rank_diamond_referrals: "50",
  rank_diamond_volume: "200000",
  rank_diamond_bonus: "12",
  arbiz_claim_date: "",
  arbiz_rate: "0.1",
  spin_daily_limit: "1",
  spin_min_reward: "0.01",
  spin_max_reward: "0.10",
  checkin_base_reward: "0.05",
  support_email: "support@arbizai.com",
  business_email: "business@arbizai.com",
  telegram_support: "@ArbizAISupport",
  company_address: "Singapore",
  working_hours: "24/7 Support",
  help_center_url: "",
  telegram_admin_chat_id: "",
};

const AdminSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [_showApiKey, _setShowApiKey] = useState(false); // unused, kept to avoid breaking
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const isValidChatId = (id: string) => /^-?\d+$/.test(id.trim());
  const looksLikeUsername = (id: string) => id.trim().startsWith("@");
  const looksLikeBotToken = (id: string) => /^\d+:[A-Za-z0-9_-]+$/.test(id.trim());
  const looksLikeBotOwnId = (id: string) => {
    // Detect if the chat ID matches the bot token's prefix (bot's own ID)
    // Common mistake: user enters the number part of their bot token as chat ID
    return /^\d{9,12}$/.test(id.trim());
  };

  const chatIdWarning = (() => {
    const val = settings.telegram_admin_chat_id.trim();
    if (!val) return null;
    if (looksLikeBotToken(val)) return "⚠️ Ini adalah Bot Token, bukan Chat ID. Chat ID berupa angka saja (misal: 123456789). Kirim /start ke @userinfobot untuk mendapatkan Chat ID Anda.";
    if (looksLikeUsername(val)) return "⚠️ Ini adalah username, bukan Chat ID. Chat ID berupa angka (misal: 123456789). Kirim /start ke @userinfobot untuk mendapatkan Chat ID Anda.";
    if (!isValidChatId(val)) return "⚠️ Chat ID harus berupa angka. Kirim /start ke @userinfobot di Telegram untuk mendapatkan Chat ID.";
    return null;
  })();

  const sendTestTelegram = async () => {
    const chatId = settings.telegram_admin_chat_id.trim();
    if (!chatId) {
      setTelegramTestResult({ success: false, message: "Chat ID belum diisi." });
      return;
    }
    if (!isValidChatId(chatId)) {
      setTelegramTestResult({ success: false, message: "Chat ID tidak valid. Harus berupa angka." });
      return;
    }

    setTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      // Save chat ID first
      await supabase.from("system_settings").upsert(
        { key: "telegram_admin_chat_id", value: JSON.parse(JSON.stringify(chatId)), updated_by: user?.id },
        { onConflict: "key" }
      );

      const { data, error } = await supabase.functions.invoke("telegram-notify", {
        body: {
          event: "new_deposit",
          data: {
            user_name: "Test User",
            amount: 100,
            currency: "USDT",
            network: "BEP20",
            tx_hash: "0xTEST123456789",
            tx_id: "test0000-0000",
          },
        },
      });

      if (error) {
        setTelegramTestResult({ success: false, message: `Edge function error: ${error.message}` });
      } else if (data?.success) {
        setTelegramTestResult({ success: true, message: "✅ Pesan tes berhasil dikirim! Cek Telegram Anda." });
      } else {
        const reason = data?.reason || "";
        const detail = data?.error_detail || "";
        let msg = "Gagal mengirim pesan.";
        if (reason === "no_chat_id") {
          msg = "Chat ID belum dikonfigurasi di database.";
        } else if (detail.includes("bots can't send messages to bots")) {
          msg = "❌ Chat ID yang dimasukkan adalah ID bot itu sendiri. Bot tidak bisa mengirim pesan ke bot lain. Kirim /start ke @userinfobot di Telegram untuk mendapatkan Chat ID PRIBADI Anda.";
        } else if (detail.includes("chat not found")) {
          msg = "❌ Chat tidak ditemukan. Pastikan Anda sudah mengirim /start ke bot Anda terlebih dahulu, lalu masukkan Chat ID yang benar.";
        } else if (detail) {
          msg = `❌ Telegram error: ${detail}`;
        } else {
          msg = `Gagal: ${reason || JSON.stringify(data)}`;
        }
        setTelegramTestResult({ success: false, message: msg });
      }
    } catch (err: any) {
      setTelegramTestResult({ success: false, message: `Error: ${err.message}` });
    } finally {
      setTestingTelegram(false);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("system_settings").select("key, value");
      if (data) {
        const mapped = { ...defaultSettings };
        data.forEach(s => {
          if (s.key in mapped) (mapped as any)[s.key] = typeof (mapped as any)[s.key] === "boolean" ? s.value : String(s.value).replace(/"/g, "");
        });
        setSettings(mapped);
      }
    };
    fetch();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    for (const [key, value] of Object.entries(settings)) {
      // Never save API keys to database - they should be managed via secrets
      if (key === "nowpayments_api_key") continue;
      await supabase.from("system_settings").upsert({ key, value: JSON.parse(JSON.stringify(value)), updated_by: user?.id }, { onConflict: "key" });
    }
    setSaving(false);
    toast({ title: "Settings saved!" });
  };

  const updateField = (key: string, value: string | boolean) => setSettings({ ...settings, [key]: value });

  return (
    <AdminLayout title="Settings">
      <div className="max-w-2xl space-y-6">
        {/* Platform Settings */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Settings className="w-4 h-4 text-primary" />Platform Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Platform Name</Label><Input value={settings.platform_name} onChange={e => updateField("platform_name", e.target.value)} /></div>
            <div className="space-y-1"><Label>Withdrawal Fee (%)</Label><Input type="number" value={settings.withdrawal_fee} onChange={e => updateField("withdrawal_fee", e.target.value)} /></div>
            <div className="space-y-1"><Label>Min Deposit ($)</Label><Input type="number" value={settings.min_deposit} onChange={e => updateField("min_deposit", e.target.value)} /></div>
            <div className="space-y-1"><Label>Min Withdrawal ($)</Label><Input type="number" value={settings.min_withdrawal} onChange={e => updateField("min_withdrawal", e.target.value)} /></div>
            <div className="space-y-1"><Label>Max Withdrawal ($)</Label><Input type="number" value={settings.max_withdrawal} onChange={e => updateField("max_withdrawal", e.target.value)} /></div>
            <div className="flex items-center gap-2 self-end pb-2">
              <input type="checkbox" checked={settings.maintenance_mode as boolean} onChange={e => updateField("maintenance_mode", e.target.checked)} />
              <Label>Maintenance Mode</Label>
            </div>
          </div>
        </div>

        {/* NOWPayments API Key - managed via secrets */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Key className="w-4 h-4 text-primary" />NOWPayments API Key</h3>
          <p className="text-xs text-muted-foreground">The NOWPayments API key is securely managed via backend secrets and cannot be viewed or edited here. Contact your system administrator to update it.</p>
        </div>

        {/* Referral Commission Rates */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Percent className="w-4 h-4 text-primary" />Referral Commission Rates (% rebate dari profit harian)</h3>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(l => (
              <div key={l} className="space-y-1">
                <Label className="text-xs">Level {l}</Label>
                <Input type="number" step="0.1" value={(settings as any)[`commission_l${l}`]} onChange={e => updateField(`commission_l${l}`, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        {/* Rank Requirements & Bonus */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Award className="w-4 h-4 text-primary" />Rank Requirements & Bonus</h3>
          <p className="text-xs text-muted-foreground">Set minimum active referrals, team volume, and rank bonus (% additional from daily profit) for each rank.</p>
          <div className="space-y-3">
            {["bronze", "silver", "gold", "platinum", "diamond"].map(rank => (
              <div key={rank} className="grid grid-cols-4 gap-2 items-center">
                <span className="text-sm font-medium text-foreground capitalize">{rank}</span>
                <div className="space-y-1">
                  <Label className="text-[10px]">Active Referrals</Label>
                  <Input type="number" value={(settings as any)[`rank_${rank}_referrals`]} onChange={e => updateField(`rank_${rank}_referrals`, e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Team Volume ($)</Label>
                  <Input type="number" value={(settings as any)[`rank_${rank}_volume`]} onChange={e => updateField(`rank_${rank}_volume`, e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Rank Bonus (%)</Label>
                  <Input type="number" step="0.1" value={(settings as any)[`rank_${rank}_bonus`]} onChange={e => updateField(`rank_${rank}_bonus`, e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ARBIZ Token Settings */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Coins className="w-4 h-4 text-primary" />ARBIZ Token Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>ARBIZ Rate ($ per token)</Label><Input type="number" step="0.01" value={settings.arbiz_rate} onChange={e => updateField("arbiz_rate", e.target.value)} /></div>
            <div className="space-y-1"><Label>Claim Date (YYYY-MM-DD)</Label><Input type="date" value={settings.arbiz_claim_date} onChange={e => updateField("arbiz_claim_date", e.target.value)} /></div>
            <div className="space-y-1"><Label>Daily Spin Limit</Label><Input type="number" value={settings.spin_daily_limit} onChange={e => updateField("spin_daily_limit", e.target.value)} /></div>
            <div className="space-y-1"><Label>Spin Min Reward ($)</Label><Input type="number" step="0.01" value={settings.spin_min_reward} onChange={e => updateField("spin_min_reward", e.target.value)} /></div>
            <div className="space-y-1"><Label>Spin Max Reward ($)</Label><Input type="number" step="0.01" value={settings.spin_max_reward} onChange={e => updateField("spin_max_reward", e.target.value)} /></div>
            <div className="space-y-1"><Label>Check-in Base Reward ($)</Label><Input type="number" step="0.01" value={settings.checkin_base_reward} onChange={e => updateField("checkin_base_reward", e.target.value)} /></div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />Contact Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Support Email</Label><Input value={settings.support_email} onChange={e => updateField("support_email", e.target.value)} /></div>
            <div className="space-y-1"><Label>Business Email</Label><Input value={settings.business_email} onChange={e => updateField("business_email", e.target.value)} /></div>
            <div className="space-y-1"><Label>Telegram Support</Label><Input value={settings.telegram_support} onChange={e => updateField("telegram_support", e.target.value)} /></div>
            <div className="space-y-1"><Label>Company Address</Label><Input value={settings.company_address} onChange={e => updateField("company_address", e.target.value)} /></div>
            <div className="space-y-1"><Label>Working Hours</Label><Input value={settings.working_hours} onChange={e => updateField("working_hours", e.target.value)} /></div>
            <div className="space-y-1"><Label>Help Center URL</Label><Input value={settings.help_center_url} onChange={e => updateField("help_center_url", e.target.value)} placeholder="Optional" /></div>
          </div>
        </div>

        {/* Telegram Notification */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" />Telegram Notifications</h3>
          <p className="text-xs text-muted-foreground">Masukkan Chat ID Telegram admin untuk menerima notifikasi deposit baru dan approval. Gunakan @userinfobot di Telegram untuk mendapatkan Chat ID.</p>
          <div className="space-y-1">
            <Label>Admin Telegram Chat ID</Label>
            <Input
              value={settings.telegram_admin_chat_id}
              onChange={e => { updateField("telegram_admin_chat_id", e.target.value); setTelegramTestResult(null); }}
              placeholder="e.g. 123456789"
              className={chatIdWarning ? "border-yellow-500" : ""}
            />
            {chatIdWarning && (
              <div className="flex items-start gap-2 mt-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-400">{chatIdWarning}</p>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={sendTestTelegram}
            disabled={testingTelegram || !settings.telegram_admin_chat_id.trim()}
            className="w-full"
          >
            <Send className="w-3 h-3 mr-2" />
            {testingTelegram ? "Mengirim..." : "Kirim Uji Telegram"}
          </Button>

          {telegramTestResult && (
            <div className={`flex items-start gap-2 p-3 rounded-lg border ${telegramTestResult.success ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
              {telegramTestResult.success ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
              <p className={`text-xs ${telegramTestResult.success ? "text-green-400" : "text-red-400"}`}>{telegramTestResult.message}</p>
            </div>
          )}
        </div>

        <Button onClick={saveSettings} disabled={saving} className="w-full gradient-primary text-primary-foreground">
          <Save className="w-3 h-3 mr-1" />{saving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
