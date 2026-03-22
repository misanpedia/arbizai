import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bell, Send, Trash2, Users, User } from "lucide-react";
import { motion } from "framer-motion";

const AdminNotifications = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [target, setTarget] = useState<"all" | "specific">("all");
  const [targetEmail, setTargetEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState({ total: 0, unread: 0, broadcast: 0 });

  const fetchNotifications = async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
    if (data) {
      setNotifications(data);
      setStats({
        total: data.length,
        unread: data.filter(n => !n.is_read).length,
        broadcast: data.filter(n => n.user_id === null).length,
      });
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const sendNotification = async () => {
    if (!title || !message) return;
    setSending(true);

    if (target === "all") {
      // Send individual notification to every member
      const { data: allProfiles, error: profilesError } = await supabase.from("profiles").select("user_id");
      if (profilesError || !allProfiles?.length) {
        toast({ title: "Error", description: profilesError?.message || "No users found", variant: "destructive" });
        setSending(false);
        return;
      }
      const rows = allProfiles.map(p => ({ title, message, type, user_id: p.user_id }));
      const { error } = await supabase.from("notifications").insert(rows);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: `✅ Notification sent to ${rows.length} members!` });
    } else {
      if (!targetEmail) {
        toast({ title: "Error", description: "Please enter a user ID", variant: "destructive" });
        setSending(false);
        return;
      }
      const { error } = await supabase.from("notifications").insert({ title, message, type, user_id: targetEmail.trim() });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "✅ Notification sent to user!" });
    }

    setTitle(""); setMessage("");
    setSending(false);
    fetchNotifications();
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    fetchNotifications();
  };

  return (
    <AdminLayout title="Notifications">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Notifications", value: stats.total, color: "text-primary" },
            { label: "Unread", value: stats.unread, color: "text-warning" },
            { label: "Broadcasts", value: stats.broadcast, color: "text-success" },
          ].map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-strong rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={`text-lg font-display font-bold ${c.color}`}>{c.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Send Form */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Bell className="w-4 h-4 text-primary" />Send Notification</h3>
          <div className="space-y-3">
            {/* Target Selection */}
            <div className="flex gap-2">
              <button onClick={() => setTarget("all")} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition ${target === "all" ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                <Users className="w-3 h-3" /> All Users
              </button>
              <button onClick={() => setTarget("specific")} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition ${target === "specific" ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                <User className="w-3 h-3" /> Specific User
              </button>
            </div>

            {target === "specific" && (
              <div className="space-y-1">
                <Label>User ID</Label>
                <Input value={targetEmail} onChange={e => setTargetEmail(e.target.value)} placeholder="Paste user UUID" />
              </div>
            )}

            <div className="space-y-1"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title" /></div>
            <div className="space-y-1"><Label>Message</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Notification message..." rows={3} /></div>
            <div className="flex gap-2">
              {["info", "warning", "success", "error"].map(t => (
                <button key={t} onClick={() => setType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${type === t ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground"}`}>{t}</button>
              ))}
            </div>
            <Button onClick={sendNotification} disabled={sending || !title || !message} className="gradient-primary text-primary-foreground">
              <Send className="w-3 h-3 mr-1" />{sending ? "Sending..." : target === "all" ? "Broadcast to All" : "Send to User"}
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="glass-strong rounded-2xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Recent Notifications</h3>
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    {n.user_id === null && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">Broadcast</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                    <span className={`text-[10px] capitalize ${n.type === "warning" ? "text-warning" : n.type === "success" ? "text-success" : n.type === "error" ? "text-destructive" : "text-primary"}`}>· {n.type}</span>
                    {!n.is_read && <span className="text-[9px] text-warning">● Unread</span>}
                  </div>
                </div>
                <button onClick={() => deleteNotification(n.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {notifications.length === 0 && <p className="text-muted-foreground text-center py-4">No notifications</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
