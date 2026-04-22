import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

async function sendTelegram(chatId: string, text: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");

  if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY) {
    console.error("Missing LOVABLE_API_KEY or TELEGRAM_API_KEY");
    return false;
  }

  try {
    const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Telegram API error:", JSON.stringify(data));
      return false;
    }
    return true;
  } catch (err) {
    console.error("Telegram send error:", err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { event, data } = await req.json();

    // Get admin telegram chat ID from system_settings
    const { data: settingRow } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "telegram_admin_chat_id")
      .maybeSingle();

    const chatId = settingRow?.value as string;
    if (!chatId) {
      console.warn("No telegram_admin_chat_id configured");
      return new Response(JSON.stringify({ success: false, reason: "no_chat_id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let message = "";

    if (event === "new_deposit") {
      const { user_name, amount, currency, network, tx_hash, tx_id } = data;
      message =
        `🆕 <b>New Deposit Request</b>\n\n` +
        `👤 User: <b>${user_name || "Unknown"}</b>\n` +
        `💰 Amount: <b>$${Number(amount).toFixed(2)} ${currency || "USDT"}</b>\n` +
        `🌐 Network: ${network || "BEP20"}\n` +
        `${tx_hash ? `🔗 TxHash: <code>${tx_hash}</code>\n` : ""}` +
        `📝 ID: <code>${tx_id?.slice(0, 8) || "-"}</code>\n\n` +
        `⏳ <i>Waiting for admin approval</i>`;
    } else if (event === "deposit_approved") {
      const { user_name, amount, currency, tx_id, audit_log } = data;
      let commSummary = "";
      if (audit_log && Array.isArray(audit_log)) {
        const distributed = audit_log.filter((a: any) => a.status === "distributed");
        if (distributed.length > 0) {
          commSummary = "\n\n📊 <b>Referral Commissions:</b>\n" +
            distributed.map((a: any) => `  L${a.level}: ${a.rate}% → $${a.commission} (${a.upline_name})`).join("\n");
        }
      }
      message =
        `✅ <b>Deposit Approved</b>\n\n` +
        `👤 User: <b>${user_name || "Unknown"}</b>\n` +
        `💰 Amount: <b>$${Number(amount).toFixed(2)} ${currency || "USDT"}</b>\n` +
        `📝 ID: <code>${tx_id?.slice(0, 8) || "-"}</code>` +
        commSummary;
    } else {
      message = `📢 ${event}: ${JSON.stringify(data)}`;
    }

    const sent = await sendTelegram(chatId, message);

    return new Response(JSON.stringify({ success: sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("telegram-notify error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});