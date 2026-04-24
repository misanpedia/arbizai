import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import defaultLogo from "@/assets/logo.png";

let cachedLogo: string | null = null;
const listeners = new Set<(url: string) => void>();

async function fetchLogo() {
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "logo_url")
    .maybeSingle();
  const value = (data?.value as any);
  const url = typeof value === "string" ? value : value?.url;
  const final = url && typeof url === "string" && url.length > 0 ? url : defaultLogo;
  cachedLogo = final;
  listeners.forEach((l) => l(final));
}

// Allow other parts of the app (e.g. admin save) to broadcast a new logo immediately
export function broadcastLogo(url: string) {
  cachedLogo = url || defaultLogo;
  listeners.forEach((l) => l(cachedLogo!));
}

export function useLogo(): string {
  const [logo, setLogo] = useState<string>(cachedLogo ?? defaultLogo);

  useEffect(() => {
    listeners.add(setLogo);
    if (cachedLogo === null) {
      fetchLogo();
    } else {
      setLogo(cachedLogo);
    }
    return () => {
      listeners.delete(setLogo);
    };
  }, []);

  return logo;
}