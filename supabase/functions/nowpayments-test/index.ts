import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) throw new Error("Unauthorized");
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: cfg } = await supabase.from("payment_gateway_config").select("api_key").eq("provider", "nowpayments").maybeSingle();
    if (!cfg?.api_key) throw new Error("API key belum diisi");

    const statusRes = await fetch("https://api.nowpayments.io/v1/status");
    const statusJson = await statusRes.json().catch(() => ({}));

    const keyRes = await fetch("https://api.nowpayments.io/v1/balance", {
      headers: { "x-api-key": cfg.api_key },
    });
    const keyJson = await keyRes.json().catch(() => ({}));

    if (!keyRes.ok) {
      return new Response(
        JSON.stringify({ success: false, api_status: statusJson?.message ?? "unknown", error: keyJson?.message || `HTTP ${keyRes.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, api_status: statusJson?.message ?? "OK", balance: keyJson }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("nowpayments-test error:", error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});