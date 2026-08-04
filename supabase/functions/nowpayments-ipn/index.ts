import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-nowpayments-sig",
};

const DEFAULT_REFERRAL_RATES = [5, 3, 2, 1, 0.5];

function sortObject(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj && typeof obj === "object") {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce((acc: Record<string, unknown>, k) => {
        acc[k] = sortObject((obj as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return obj;
}

async function hmacSha512(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    const { data: cfg } = await supabase
      .from("payment_gateway_config")
      .select("ipn_secret")
      .eq("provider", "nowpayments")
      .maybeSingle();

    // Verify IPN signature when a secret is configured
    if (cfg?.ipn_secret) {
      const sigHeader = req.headers.get("x-nowpayments-sig") || "";
      const expected = await hmacSha512(cfg.ipn_secret, JSON.stringify(sortObject(payload)));
      if (sigHeader.toLowerCase() !== expected.toLowerCase()) {
        console.error("Invalid NOWPayments IPN signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const status = String(payload.payment_status || "").toLowerCase();
    const orderId = payload.order_id as string | undefined;
    if (!orderId) throw new Error("Missing order_id");

    const { data: tx } = await supabase.from("transactions").select("*").eq("id", orderId).eq("type", "deposit").maybeSingle();
    if (!tx) throw new Error("Transaction not found");

    if (["failed", "refunded", "expired"].includes(status)) {
      if (tx.status === "pending") {
        await supabase.from("transactions").update({ status: "rejected", description: `NOWPayments ${status}` }).eq("id", tx.id);
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!["finished", "confirmed", "partially_paid"].includes(status)) {
      return new Response(JSON.stringify({ ok: true, ignored: status }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Idempotency guard — already credited
    if (tx.status !== "pending") {
      return new Response(JSON.stringify({ ok: true, already_processed: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const depositAmount = Number(payload.actually_paid_at_fiat ?? payload.price_amount ?? tx.amount);
    const txShortId = tx.id.slice(0, 8);

    await supabase.from("transactions").update({
      status: "approved",
      amount: depositAmount,
      tx_hash: String(payload.payment_id ?? tx.tx_hash ?? ""),
      description: `NOWPayments deposit $${depositAmount.toFixed(2)} USDT (${status})`,
    }).eq("id", tx.id);

    const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", tx.user_id).eq("currency", "USDT").maybeSingle();
    if (wallet) {
      await supabase.from("wallets").update({ balance: Number(wallet.balance) + depositAmount }).eq("id", wallet.id);
    } else {
      await supabase.from("wallets").insert({ user_id: tx.user_id, currency: "USDT", balance: depositAmount });
    }

    await supabase.from("notifications").insert({
      user_id: tx.user_id,
      title: "💰 Deposit Confirmed",
      message: `Your deposit of $${depositAmount.toFixed(2)} USDT has been confirmed automatically.`,
      type: "success",
    });

    // 5-level referral commissions (with double-credit guard)
    const auditLog: Record<string, unknown>[] = [];
    const { data: existingComm } = await supabase.from("commissions")
      .select("id").eq("type", "referral").eq("from_user_id", tx.user_id)
      .like("description", `%deposit #${txShortId}%`).limit(1);

    if (existingComm && existingComm.length > 0) {
      auditLog.push({ status: "skipped", reason: "already distributed" });
    } else {
      const { data: ratesData } = await supabase.from("system_settings").select("value").eq("key", "referral_commission_rates").maybeSingle();
      const rates = (ratesData?.value && Array.isArray(ratesData.value)) ? (ratesData.value as number[]).map(Number) : DEFAULT_REFERRAL_RATES;
      const { data: profile } = await supabase.from("profiles").select("referred_by").eq("user_id", tx.user_id).maybeSingle();

      let currentCode = profile?.referred_by || "";
      for (let level = 0; level < Math.min(rates.length, 5); level++) {
        if (!currentCode) { auditLog.push({ level: level + 1, status: "stopped", reason: "no upline" }); break; }
        const rate = rates[level];
        const { data: upline } = await supabase.from("profiles").select("user_id, referred_by, full_name").eq("referral_code", currentCode).maybeSingle();
        if (!upline) { auditLog.push({ level: level + 1, status: "stopped", reason: "upline not found" }); break; }

        if (rate && rate > 0) {
          const commission = depositAmount * (rate / 100);
          await supabase.from("commissions").insert({
            user_id: upline.user_id, from_user_id: tx.user_id,
            amount: commission, level: level + 1, type: "referral",
            description: `L${level + 1} referral (${rate}%) from deposit #${txShortId} $${depositAmount.toFixed(2)}`,
          });
          const { data: upWallet } = await supabase.from("wallets").select("id, balance").eq("user_id", upline.user_id).eq("currency", "USDT").maybeSingle();
          if (upWallet) {
            await supabase.from("wallets").update({ balance: Number(upWallet.balance) + commission }).eq("id", upWallet.id);
          }
          auditLog.push({ level: level + 1, rate, commission: commission.toFixed(4), upline_name: upline.full_name || "User", status: "distributed" });
        } else {
          auditLog.push({ level: level + 1, rate, status: "skipped", reason: "rate is 0" });
        }
        currentCode = upline.referred_by || "";
      }
    }

    console.log("NOWPayments IPN processed", tx.id, JSON.stringify(auditLog));

    try {
      const { data: depositorProfile } = await supabase.from("profiles").select("full_name, email").eq("user_id", tx.user_id).maybeSingle();
      await supabase.functions.invoke("telegram-notify", {
        body: {
          event: "deposit_approved",
          data: {
            user_name: depositorProfile?.full_name || "Unknown",
            user_email: depositorProfile?.email || "-",
            amount: depositAmount,
            currency: "USDT",
            tx_id: tx.id,
            audit_log: auditLog,
            deposit_date: tx.created_at || new Date().toISOString(),
          },
        },
      });
    } catch (tgErr) {
      console.error("Telegram notify error (non-fatal):", tgErr);
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("nowpayments-ipn error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});