import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle } from "lucide-react";

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [maintenance, setMaintenance] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Don't block rendering while auth is still loading
    if (authLoading) return;

    const check = async () => {
      try {
        const { data } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "maintenance_mode")
          .maybeSingle();

        if (data) {
          const val = typeof data.value === "boolean" ? data.value : String(data.value).replace(/"/g, "") === "true";
          setMaintenance(val);
        }

        if (user) {
          const { data: adminData } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
          setIsAdmin(!!adminData);
        }
      } catch (err) {
        console.error("MaintenanceGuard check error:", err);
        // On error, allow access (don't block the app)
      } finally {
        setChecked(true);
      }
    };

    // Set a timeout so the app never stays blank for more than 3 seconds
    const timeout = setTimeout(() => setChecked(true), 3000);
    check();
    return () => clearTimeout(timeout);
  }, [user, authLoading]);

  // Show a loading spinner instead of blank screen
  if (!checked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (maintenance && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-strong rounded-3xl p-8 max-w-md text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-warning mx-auto" />
          <h1 className="text-2xl font-display font-bold text-foreground">Under Maintenance</h1>
          <p className="text-muted-foreground">
            We're performing scheduled maintenance to improve our platform. Please check back shortly.
          </p>
          <p className="text-xs text-muted-foreground">We appreciate your patience.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
