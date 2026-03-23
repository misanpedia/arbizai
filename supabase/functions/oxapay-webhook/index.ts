import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const OXAPAY_KEY = Deno.env.get("OXAPAY_MERCHANT_KEY");
    if (!OXAPAY_KEY) throw new Error("OxaPay Merchant Key not configured");

    const body = await req.json();
    console.log("OxaPay webhook payload:", JSON.stringify(body));

    const { track_id, status, amount, txID, type } = body;

    if (!track_id) {
      return new Response(JSON.stringify({ error: "Missing track_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the payment via OxaPay API
    const verifyRes = await fetch("https://api.oxapay.com/v1/payment/inquiry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "merchant_api_key": OXAPAY_KEY,
      },
      body: JSON.stringify({ track_id }),
    });

    const verifyData = await verifyRes.json();
    console.log("OxaPay verify response:", JSON.stringify(verifyData));

    // Map OxaPay status to our status
    let newStatus: string;
    if (verifyData.status === "Paid" || verifyData.status === "Confirmed") {
      newStatus = "approved";
    } else if (verifyData.status === "Expired" || verifyData.status === "Failed") {
      newStatus = "cancelled";
    } else {
      // Still pending/waiting
      newStatus = "pending";
    }

    if (newStatus === "pending") {
      return new Response(JSON.stringify({ success: true, status: "still_pending" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the transaction by track_id
    const { data: txn, error: txnError } = await supabase
      .from("transactions")
      .select("*")
      .eq("tx_hash", track_id)
      .eq("type", "deposit")
      .eq("status", "pending")
      .maybeSingle();

    if (txnError || !txn) {
      console.log("Transaction not found for track_id:", track_id);
      return new Response(JSON.stringify({ success: true, status: "no_matching_txn" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update transaction status
    const confirmedAmount = verifyData.pay_amount ? parseFloat(verifyData.pay_amount) : txn.amount;

    await supabase
      .from("transactions")
      .update({
        status: newStatus,
        amount: confirmedAmount,
        tx_hash: verifyData.txID || track_id,
      })
      .eq("id", txn.id);

    // If approved, credit the user's wallet
    if (newStatus === "approved") {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", txn.user_id)
        .eq("currency", "USDT")
        .maybeSingle();

      if (wallet) {
        await supabase
          .from("wallets")
          .update({ balance: (wallet.balance || 0) + confirmedAmount })
          .eq("id", wallet.id);
      }

      // Send notification
      await supabase.from("notifications").insert({
        user_id: txn.user_id,
        title: "💰 Deposit Confirmed",
        message: `Your deposit of $${confirmedAmount.toFixed(2)} has been confirmed and credited to your wallet.`,
        type: "success",
      });

      // Process referral commission
      const { data: profile } = await supabase
        .from("profiles")
        .select("referred_by")
        .eq("user_id", txn.user_id)
        .maybeSingle();

      if (profile?.referred_by) {
        const { data: referrer } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("referral_code", profile.referred_by)
          .maybeSingle();

        if (referrer) {
          const commissionRate = 0.05; // 5%
          const commissionAmount = confirmedAmount * commissionRate;

          await supabase.from("commissions").insert({
            user_id: referrer.user_id,
            from_user_id: txn.user_id,
            amount: commissionAmount,
            type: "referral",
            level: 1,
            description: `Referral commission from deposit of $${confirmedAmount.toFixed(2)}`,
          });

          // Credit commission to referrer wallet
          const { data: refWallet } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", referrer.user_id)
            .eq("currency", "USDT")
            .maybeSingle();

          if (refWallet) {
            await supabase
              .from("wallets")
              .update({ balance: (refWallet.balance || 0) + commissionAmount })
              .eq("id", refWallet.id);
          }
        }
      }
    } else if (newStatus === "cancelled") {
      await supabase.from("notifications").insert({
        user_id: txn.user_id,
        title: "❌ Deposit Failed",
        message: `Your deposit of $${txn.amount} has expired or failed. Please try again.`,
        type: "error",
      });
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("OxaPay webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
