import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Megaphone, Bell, ChevronDown, ChevronUp, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const formatMessage = (text: string) => {
  // Split by newlines and process each line
  const lines = text.split(/\n/);
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <br key={i} />;
    // Bullet points
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      return (
        <li key={i} className="ml-4 text-muted-foreground text-sm leading-relaxed">
          {trimmed.slice(2)}
        </li>
      );
    }
    // Numbered items
    const numMatch = trimmed.match(/^(\d+)\.\s(.+)/);
    if (numMatch) {
      return (
        <li key={i} className="ml-4 text-muted-foreground text-sm leading-relaxed list-decimal">
          {numMatch[2]}
        </li>
      );
    }
    // Emoji-led section headers (e.g. 🚨 Title or 💰 Title)
    const emojiHeaderMatch = trimmed.match(/^([\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}])\s*(.+)/u);
    if (emojiHeaderMatch && trimmed.length < 80) {
      return (
        <h4 key={i} className="text-sm font-semibold text-foreground mt-3 mb-1">
          {trimmed}
        </h4>
      );
    }
    return (
      <p key={i} className="text-muted-foreground text-sm leading-relaxed">
        {trimmed}
      </p>
    );
  });
};

const typeIcon = (type: string) => {
  const colors: Record<string, string> = {
    warning: "bg-warning/10 text-warning border-warning/20",
    success: "bg-success/10 text-success border-success/20",
    error: "bg-destructive/10 text-destructive border-destructive/20",
    info: "bg-primary/10 text-primary border-primary/20",
  };
  return colors[type] || colors.info;
};

const typeBadge = (type: string) => {
  const labels: Record<string, string> = {
    warning: "⚠️ Warning",
    success: "✅ Update",
    error: "🚨 Alert",
    info: "📢 Info",
  };
  return labels[type] || labels.info;
};

const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notifications")
      .select("*")
      .is("user_id", null)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setAnnouncements(data);
      });
  }, [user]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <DashboardLayout title="Announcements">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="glass-strong rounded-2xl p-5 text-center">
          <Megaphone className="w-8 h-8 text-primary mx-auto mb-2" />
          <h2 className="text-sm font-semibold text-foreground">Platform News & Updates</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {announcements.length} announcement{announcements.length !== 1 ? "s" : ""}
          </p>
        </div>

        {announcements.length === 0 ? (
          <div className="glass-strong rounded-2xl p-8 text-center">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No announcements yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a, i) => {
              const isExpanded = expandedId === a.id;
              const isLong = (a.message?.length || 0) > 150;
              const colors = typeIcon(a.type);

              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-strong rounded-2xl overflow-hidden"
                >
                  {/* Top accent bar */}
                  <div className={`h-1 w-full ${a.type === "warning" ? "bg-warning" : a.type === "error" ? "bg-destructive" : a.type === "success" ? "bg-success" : "gradient-primary"}`} />

                  <div className="p-4">
                    {/* Header row */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2 rounded-xl shrink-0 border ${colors}`}>
                        <Send className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${colors}`}>
                            {typeBadge(a.type)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(a.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-foreground leading-snug">
                          {a.title}
                        </h3>
                      </div>
                    </div>

                    {/* Message body */}
                    <div
                      className={`relative ${!isExpanded && isLong ? "max-h-28 overflow-hidden" : ""}`}
                    >
                      <div className="space-y-1 pl-0">
                        {formatMessage(a.message)}
                      </div>
                      {!isExpanded && isLong && (
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card/90 to-transparent" />
                      )}
                    </div>

                    {/* Read more toggle */}
                    {isLong && (
                      <button
                        onClick={() => toggleExpand(a.id)}
                        className="flex items-center gap-1 text-xs text-primary font-medium mt-2 hover:underline"
                      >
                        {isExpanded ? (
                          <>Show less <ChevronUp className="w-3 h-3" /></>
                        ) : (
                          <>Read more <ChevronDown className="w-3 h-3" /></>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Announcements;
