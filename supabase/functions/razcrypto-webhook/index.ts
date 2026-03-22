import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const hexSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hexSig === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rawBody = await req.text();
    console.log("RazCrypto webhook received:", rawBody);

    // Verify signature if secret is configured
    const RAZ_SECRET_KEY = Deno.env.get("RAZ_SECRET_KEY");
    if (RAZ_SECRET_KEY) {
      const signature = req.headers.get("x-razcrypto-signature") || "";
      if (signature) {
        const valid = await verifySignature(rawBody, signature, RAZ_SECRET_KEY);
        if (!valid) {
          console.error("Invalid webhook signature");
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const body = JSON.parse(rawBody);
    const { event, status, amount, tx_hash, payment_id, custom_data } = body;

    if (!payment_id) {
      return new Response(JSON.stringify({ error: "Missing payment_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = custom_data?.user_id;
    if (!userId) {
      console.error("No user_id in custom_data");
      return new Response(JSON.stringify({ error: "Missing user_id in custom_data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (event === "payment.completed" && status === "success") {
      // Find the pending transaction by payment_id (stored in tx_hash)
      const { data: tx } = await supabase
        .from("transactions")
        .select("id, status, amount")
        .eq("user_id", userId)
        .eq("tx_hash", payment_id)
        .eq("type", "deposit")
        .eq("status", "pending")
        .maybeSingle();

      if (tx && tx.status === "pending") {
        const creditAmount = amount || tx.amount;

        // Update transaction to completed
        await supabase
          .from("transactions")
          .update({
            status: "completed",
            tx_hash: tx_hash || payment_id,
            description: `Deposit confirmed via RazCrypto`,
          })
          .eq("id", tx.id);

        // Credit wallet
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", userId)
          .eq("currency", "USDT")
          .maybeSingle();

        if (wallet) {
          await supabase
            .from("wallets")
            .update({ balance: Number(wallet.balance) + Number(creditAmount) })
            .eq("user_id", userId)
            .eq("currency", "USDT");
        }

        // Send notification
        await supabase.from("notifications").insert({
          user_id: userId,
          title: "💰 Deposit Confirmed",
          message: `Your deposit of $${Number(creditAmount).toFixed(2)} has been confirmed and credited to your wallet.`,
          type: "success",
        });

        console.log(`Payment ${payment_id} completed for user ${userId}, credited ${creditAmount}`);
      } else {
        console.log(`No pending transaction found for payment_id ${payment_id}`);
      }
    } else if (event === "payment.failed") {
      // Mark as cancelled
      await supabase
        .from("transactions")
        .update({ status: "cancelled", description: "Payment failed or expired" })
        .eq("user_id", userId)
        .eq("tx_hash", payment_id)
        .eq("status", "pending");

      await supabase.from("notifications").insert({
        user_id: userId,
        title: "❌ Deposit Failed",
        message: "Your deposit payment has failed or expired. Please try again.",
        type: "error",
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
