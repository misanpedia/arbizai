import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowRightLeft, DollarSign, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

const Transfer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { data: wallet } = useQuery({
    queryKey: ["wallet-usdt", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .eq("currency", "USDT")
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: transferSettings } = useQuery({
    queryKey: ["transfer-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", ["transfer_fee_rate", "transfer_min_amount", "transfer_enabled"]);
      const settings: Record<string, string> = {};
      data?.forEach((s: any) => {
        settings[s.key] = typeof s.value === "string" ? s.value.replace(/"/g, "") : String(s.value);
      });
      return settings;
    },
  });

  const feeRate = parseFloat(transferSettings?.transfer_fee_rate || "5") / 100;
  const minAmount = parseFloat(transferSettings?.transfer_min_amount || "1");
  const transferEnabled = transferSettings?.transfer_enabled !== "false";

  const fee = parseFloat(amount || "0") * feeRate;
  const total = parseFloat(amount || "0") + fee;

  const handleTransfer = async () => {
    if (!recipientEmail.trim()) {
      toast({ title: "Please enter recipient email", variant: "destructive" });
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt < minAmount) {
      toast({ title: `Minimum transfer is $${minAmount}`, variant: "destructive" });
      return;
    }
    if (wallet && total > wallet.balance) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("transfer-balance", {
        body: { recipient_email: recipientEmail.trim(), amount: amt, currency: "USDT" },
      });

      if (error || data?.error) {
        toast({ title: data?.error || error?.message || "Transfer failed", variant: "destructive" });
      } else {
        setResult(data);
        setRecipientEmail("");
        setAmount("");
        toast({ title: `Transfer of $${amt.toFixed(2)} successful!` });
      }
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <DashboardLayout title="Transfer Balance">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Balance Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">USDT Balance</span>
          </div>
          <p className="text-2xl font-display font-bold text-foreground">
            ${wallet?.balance?.toFixed(2) || "0.00"}
          </p>
        </motion.div>

        {/* Transfer Form */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-strong rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Transfer to Member</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Recipient Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="example@email.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Transfer Amount (USDT)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="0.00"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {parseFloat(amount) > 0 && (
            <div className="bg-muted/30 rounded-xl p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transfer Amount</span>
                <span className="text-foreground">${parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Fee ({(feeRate * 100).toFixed(1)}%)</span>
                <span className="text-warning">${fee.toFixed(2)}</span>
              </div>
              <div className="border-t border-border/50 pt-1 flex justify-between font-semibold">
                <span className="text-muted-foreground">Total Debit</span>
                <span className="text-foreground">${total.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 bg-warning/10 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-[11px] text-warning">
              Transfers are instant and irreversible. Please make sure the recipient email is correct.
            </p>
          </div>

          <Button
            onClick={handleTransfer}
            disabled={loading || !recipientEmail || !amount}
            className="w-full"
            size="lg"
          >
            {loading ? "Processing..." : "Confirm Transfer"}
          </Button>
        </motion.div>

        {/* Success Result */}
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-2xl p-5 border border-success/30">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span className="text-sm font-medium text-success">Transfer Successful!</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient</span>
                <span className="text-foreground">{result.recipient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-foreground">${result.amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee</span>
                <span className="text-warning">${result.fee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-muted-foreground">Total Debit</span>
                <span className="text-foreground">${result.total_debited?.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Transfer;
