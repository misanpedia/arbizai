import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { MessageSquare, Mail, Send, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const faqs = [
  { q: "How do I make a deposit?", a: "Go to the Deposit page, choose manual or crypto payment, enter the amount, and follow the instructions." },
  { q: "When will I receive my daily profit?", a: "Daily profits are calculated and credited automatically every 24 hours." },
  { q: "How do withdrawals work?", a: "Go to Withdraw, enter the amount and your USDT wallet address. Withdrawals are processed within 24 hours." },
  { q: "What is the referral program?", a: "Share your referral code with friends. When they invest and earn profits, you receive commission rebates up to 5 levels." },
  { q: "How does KYC verification work?", a: "Upload your ID and a selfie in the KYC page. Verification typically takes 24-48 hours." },
  { q: "What is ARBIZ token?", a: "ARBIZ is our internal reward token earned through bot activation. Rate: $0.1 per ARBIZ. Claimable on scheduled dates." },
];

const Support = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!subject || !message) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setSending(true);
    await supabase.from("notifications").insert({
      user_id: null,
      title: `Support: ${subject}`,
      message: `From user ${user?.id}: ${message}`,
      type: "support",
    });
    toast({ title: "Message sent!", description: "We'll get back to you soon." });
    setSubject("");
    setMessage("");
    setSending(false);
  };

  return (
    <DashboardLayout title="Help & Support">
      <div className="max-w-lg mx-auto space-y-6">
        {/* FAQ */}
        <div className="glass-strong rounded-2xl p-5 space-y-3">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> FAQ
          </h3>
          {faqs.map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className="border-b border-border/30 last:border-0">
              <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="w-full flex items-center justify-between py-3 text-left">
                <span className="text-sm font-medium text-foreground">{faq.q}</span>
                {expandedFaq === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {expandedFaq === i && (
                <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  className="text-sm text-muted-foreground pb-3">{faq.a}</motion.p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Contact Support
          </h3>
          <Input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
          <Textarea placeholder="Describe your issue..." value={message} onChange={e => setMessage(e.target.value)} rows={4} />
          <Button onClick={handleSubmit} disabled={sending} className="w-full gradient-primary text-primary-foreground">
            <Send className="w-4 h-4 mr-2" /> {sending ? "Sending..." : "Send Message"}
          </Button>
        </div>

        {/* Contact Info */}
        <div className="glass rounded-2xl p-4 text-center space-y-2">
          <p className="text-xs text-muted-foreground">Need urgent help?</p>
          <p className="text-sm font-medium text-foreground">support@arbizai.com</p>
          <p className="text-[10px] text-muted-foreground">Response time: within 24 hours</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Support;
