import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { MessageSquare, Mail, Send, ChevronDown, ChevronUp, ArrowLeft, User, Shield, Clock, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const faqs = [
  { q: "How do I make a deposit?", a: "Go to the Deposit page, choose manual or crypto payment, enter the amount, and follow the instructions." },
  { q: "When will I receive my daily profit?", a: "Daily profits are calculated and credited automatically every 24 hours." },
  { q: "How do withdrawals work?", a: "Go to Withdraw, enter the amount and your USDT wallet address. Withdrawals are processed within 24 hours." },
  { q: "What is the referral program?", a: "Share your referral code with friends. When they invest and earn profits, you receive commission rebates up to 5 levels." },
  { q: "How does KYC verification work?", a: "Upload your ID and a selfie in the KYC page. Verification typically takes 24-48 hours." },
  { q: "What is ARBIZ token?", a: "ARBIZ is our internal reward token earned through bot activation. Rate: $0.1 per ARBIZ. Claimable on scheduled dates." },
];

interface Ticket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

const Support = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Ticket system state
  const [view, setView] = useState<"main" | "tickets" | "detail">("main");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages2, setMessages2] = useState<Message[]>([]);
  const [replyMsg, setReplyMsg] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (data) setTickets(data);
  };

  const fetchMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (data) setMessages2(data);
  };

  useEffect(() => {
    if (view === "tickets") fetchTickets();
  }, [view, user]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      // Realtime subscription for new replies
      const channel = supabase
        .channel(`ticket-${selectedTicket.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`,
        }, () => {
          fetchMessages(selectedTicket.id);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedTicket?.id]);

  const handleSubmit = async () => {
    if (!subject || !message || !user) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setSending(true);
    // Create ticket
    const ticketId = crypto.randomUUID();
    const { error: ticketErr } = await supabase.from("support_tickets").insert({
      id: ticketId,
      user_id: user.id,
      subject,
    });
    if (ticketErr) {
      toast({ title: "Failed to send", variant: "destructive" });
      setSending(false);
      return;
    }
    // Create first message
    await supabase.from("support_messages").insert({
      ticket_id: ticketId,
      sender_type: "user",
      sender_id: user.id,
      message,
    });
    toast({ title: "Message sent!", description: "We'll get back to you soon." });
    setSubject("");
    setMessage("");
    setSending(false);
  };

  const handleReply = async () => {
    if (!replyMsg.trim() || !selectedTicket || !user) return;
    setSendingReply(true);
    await supabase.from("support_messages").insert({
      ticket_id: selectedTicket.id,
      sender_type: "user",
      sender_id: user.id,
      message: replyMsg.trim(),
    });
    setReplyMsg("");
    fetchMessages(selectedTicket.id);
    setSendingReply(false);
  };

  // Ticket detail view
  if (view === "detail" && selectedTicket) {
    return (
      <DashboardLayout title="Support — Ticket">
        <div className="max-w-lg mx-auto space-y-4">
          <button onClick={() => { setView("tickets"); setSelectedTicket(null); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <div className="glass-strong rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{selectedTicket.subject}</h3>
              <Badge variant={selectedTicket.status === "open" ? "default" : "secondary"}>
                {selectedTicket.status}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">{format(new Date(selectedTicket.created_at), "dd MMM yyyy, HH:mm")}</p>
          </div>

          <div className="space-y-2 max-h-[45vh] overflow-y-auto">
            {messages2.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_type === "admin" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  msg.sender_type === "admin" ? "bg-primary/10 border border-primary/20" : "bg-muted border border-border"
                }`}>
                  <div className="flex items-center gap-1 mb-0.5">
                    {msg.sender_type === "admin" ? <Shield className="w-3 h-3 text-primary" /> : <User className="w-3 h-3 text-muted-foreground" />}
                    <span className="text-[10px] text-muted-foreground">{msg.sender_type === "admin" ? "Support" : "You"} • {format(new Date(msg.created_at), "dd MMM, HH:mm")}</span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>

          {selectedTicket.status === "open" && (
            <div className="glass-strong rounded-2xl p-4 space-y-3">
              <Textarea placeholder="Tulis balasan..." value={replyMsg} onChange={(e) => setReplyMsg(e.target.value)} rows={3} />
              <Button onClick={handleReply} disabled={sendingReply || !replyMsg.trim()} className="w-full gradient-primary text-primary-foreground">
                <Send className="w-4 h-4 mr-2" /> {sendingReply ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Ticket list view
  if (view === "tickets") {
    return (
      <DashboardLayout title="My Tickets">
        <div className="max-w-lg mx-auto space-y-4">
          <button onClick={() => setView("main")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          {tickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Belum ada tiket</p>
            </div>
          ) : (
            tickets.map((t) => (
              <button key={t.id} onClick={() => { setSelectedTicket(t); setView("detail"); }}
                className="w-full text-left glass-strong rounded-xl p-4 hover:border-primary/40 transition space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground text-sm truncate">{t.subject}</h4>
                  <Badge variant={t.status === "open" ? "default" : "secondary"} className="text-[10px]">{t.status}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {format(new Date(t.updated_at), "dd MMM yyyy, HH:mm")}
                </p>
              </button>
            ))
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Main support view
  return (
    <DashboardLayout title="Help & Support">
      <div className="max-w-lg mx-auto space-y-6">
        {/* My Tickets Button */}
        <Button variant="outline" className="w-full" onClick={() => setView("tickets")}>
          <Inbox className="w-4 h-4 mr-2" /> My Tickets ({tickets.length})
        </Button>

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
