import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, ArrowLeft, Clock, CheckCircle, XCircle, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_type: string;
  sender_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

const AdminSupport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

  const fetchTickets = async () => {
    setLoading(true);
    const { data: ticketsData } = await supabase
      .from("support_tickets")
      .select("*")
      .order("updated_at", { ascending: false });

    if (ticketsData) {
      // Fetch user profiles for each ticket
      const userIds = [...new Set(ticketsData.map((t: any) => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);

      // Fetch unread message counts
      const { data: unreadData } = await supabase
        .from("support_messages")
        .select("ticket_id")
        .eq("sender_type", "user")
        .eq("is_read", false);

      const unreadMap: Record<string, number> = {};
      unreadData?.forEach((m: any) => {
        unreadMap[m.ticket_id] = (unreadMap[m.ticket_id] || 0) + 1;
      });

      const enriched = ticketsData.map((t: any) => {
        const profile = profiles?.find((p: any) => p.user_id === t.user_id);
        return {
          ...t,
          user_email: profile?.email || "Unknown",
          user_name: profile?.full_name || "—",
          unread_count: unreadMap[t.id] || 0,
        };
      });
      setTickets(enriched);
    }
    setLoading(false);
  };

  const fetchMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);

    // Mark user messages as read
    await supabase
      .from("support_messages")
      .update({ is_read: true })
      .eq("ticket_id", ticketId)
      .eq("sender_type", "user")
      .eq("is_read", false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    }
  }, [selectedTicket?.id]);

  const handleReply = async () => {
    if (!reply.trim() || !selectedTicket || !user) return;
    setSending(true);
    const { error } = await supabase.from("support_messages").insert({
      ticket_id: selectedTicket.id,
      sender_type: "admin",
      sender_id: user.id,
      message: reply.trim(),
    });
    if (error) {
      toast({ title: "Gagal mengirim balasan", variant: "destructive" });
    } else {
      toast({ title: "Balasan terkirim" });
      setReply("");
      fetchMessages(selectedTicket.id);
      // Update ticket updated_at
      await supabase.from("support_tickets").update({ updated_at: new Date().toISOString() }).eq("id", selectedTicket.id);
    }
    setSending(false);
  };

  const toggleTicketStatus = async (ticket: Ticket) => {
    const newStatus = ticket.status === "open" ? "closed" : "open";
    await supabase.from("support_tickets").update({ status: newStatus }).eq("id", ticket.id);
    toast({ title: `Ticket ${newStatus === "closed" ? "ditutup" : "dibuka kembali"}` });
    if (selectedTicket?.id === ticket.id) {
      setSelectedTicket({ ...ticket, status: newStatus });
    }
    fetchTickets();
  };

  const filteredTickets = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  const statusBadge = (status: string) => {
    if (status === "open") return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Open</Badge>;
    return <Badge className="bg-muted text-muted-foreground border-border">Closed</Badge>;
  };

  // Detail view
  if (selectedTicket) {
    return (
      <AdminLayout title="Support — Ticket Detail">
        <div className="max-w-3xl mx-auto space-y-4">
          <button onClick={() => { setSelectedTicket(null); fetchTickets(); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-4 h-4" /> Kembali ke daftar
          </button>

          <div className="bg-card rounded-xl border border-border p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-foreground text-lg">{selectedTicket.subject}</h2>
                <p className="text-sm text-muted-foreground">
                  Dari: {selectedTicket.user_name} ({selectedTicket.user_email})
                </p>
                <p className="text-xs text-muted-foreground">{format(new Date(selectedTicket.created_at), "dd MMM yyyy, HH:mm")}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {statusBadge(selectedTicket.status)}
                <Button size="sm" variant="outline" onClick={() => toggleTicketStatus(selectedTicket)}>
                  {selectedTicket.status === "open" ? <><XCircle className="w-3 h-3 mr-1" /> Tutup</> : <><CheckCircle className="w-3 h-3 mr-1" /> Buka</>}
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                  msg.sender_type === "admin"
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-muted border border-border"
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {msg.sender_type === "admin" ? (
                      <Shield className="w-3 h-3 text-primary" />
                    ) : (
                      <User className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {msg.sender_type === "admin" ? "Admin" : "Member"} • {format(new Date(msg.created_at), "dd MMM, HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply box */}
          {selectedTicket.status === "open" && (
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <Textarea placeholder="Tulis balasan..." value={reply} onChange={(e) => setReply(e.target.value)} rows={3} />
              <Button onClick={handleReply} disabled={sending || !reply.trim()} className="gradient-primary text-primary-foreground">
                <Send className="w-4 h-4 mr-2" /> {sending ? "Mengirim..." : "Kirim Balasan"}
              </Button>
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }

  // List view
  return (
    <AdminLayout title="Support Messages">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          {(["all", "open", "closed"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className={filter === f ? "gradient-primary text-primary-foreground" : ""}>
              {f === "all" ? "Semua" : f === "open" ? "Open" : "Closed"}
            </Button>
          ))}
          <span className="text-xs text-muted-foreground ml-auto">{filteredTickets.length} tiket</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Belum ada tiket support</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="w-full text-left bg-card rounded-xl border border-border p-4 hover:border-primary/40 transition space-y-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">{ticket.subject}</h3>
                      {(ticket.unread_count ?? 0) > 0 && (
                        <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0">
                          {ticket.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{ticket.user_name} — {ticket.user_email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {statusBadge(ticket.status)}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {format(new Date(ticket.updated_at), "dd MMM, HH:mm")}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSupport;
