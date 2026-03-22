import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const checkedUserRef = useRef<string | null>(null);
  const adminResultRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // Only mark as non-admin if we never verified this session
      if (adminResultRef.current === null) {
        setIsAdmin(false);
      }
      return;
    }

    // Already verified this exact user - use cached result
    if (checkedUserRef.current === user.id && adminResultRef.current !== null) {
      setIsAdmin(adminResultRef.current);
      return;
    }

    let cancelled = false;

    const checkAdmin = async () => {
      try {
        const { data, error } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
        if (cancelled) return;

        if (error) {
          console.error("Admin role check error:", error);
          // Retry once
          await new Promise(r => setTimeout(r, 1500));
          if (cancelled) return;
          const retry = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
          if (cancelled) return;
          checkedUserRef.current = user.id;
          adminResultRef.current = !!retry.data;
          setIsAdmin(!!retry.data);
        } else {
          checkedUserRef.current = user.id;
          adminResultRef.current = !!data;
          setIsAdmin(!!data);
        }
      } catch {
        if (!cancelled) {
          checkedUserRef.current = user.id;
          adminResultRef.current = false;
          setIsAdmin(false);
        }
      }
    };

    checkAdmin();

    const timeout = setTimeout(() => {
      if (!cancelled && isAdmin === null) {
        // If we had a previous positive result for this user, keep it
        if (checkedUserRef.current === user.id && adminResultRef.current === true) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }
    }, 8000);

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [user, loading]);

  if (loading || (user && isAdmin === null)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
