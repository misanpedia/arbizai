import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !open) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setNotifications(data);
    };
    fetch();
  }, [user, open]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter(n => !n.is_read && n.user_id === user.id).map(n => n.id);
    if (unreadIds.length > 0) {
      await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const typeIcons: Record<string, string> = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
    support: "💬",
    system: "🔔",
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-background border-l border-border z-50 flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="font-display font-bold text-foreground">Notifications</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted/50 text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              )}
              {notifications.map((n) => (
                <div key={n.id} onClick={() => !n.is_read && markAsRead(n.id)}
                  className={`p-4 border-b border-border/30 cursor-pointer hover:bg-muted/30 transition ${!n.is_read ? "bg-primary/5" : ""}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{typeIcons[n.type] || "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                        {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
