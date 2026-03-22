import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Megaphone, Bell } from "lucide-react";
import { motion } from "framer-motion";

const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);

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

  return (
    <DashboardLayout title="Announcements">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="glass-strong rounded-2xl p-5 text-center">
          <Megaphone className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Latest updates from the platform</p>
        </div>

        {announcements.length === 0 ? (
          <div className="glass-strong rounded-2xl p-8 text-center">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No announcements yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="glass-strong rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${a.type === "warning" ? "bg-warning/10" : a.type === "success" ? "bg-success/10" : "bg-primary/10"}`}>
                    <Megaphone className={`w-4 h-4 ${a.type === "warning" ? "text-warning" : a.type === "success" ? "text-success" : "text-primary"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">{a.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Announcements;
