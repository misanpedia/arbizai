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

    const body = await req.json();
    console.log("OxaPay webhook received:", JSON.stringify(body));

    // OxaPay static address callback fields:
    // status, amount, currency, txID, address, network, track_id, type
    const { 
      status, 
      amount, 
      currency, 
      txID, 
      address, 
      network, 
      track_id,
      type,
      pay_amount,
      pay_currency
    } = body;

    // Determine the actual amount received
    const receivedAmount = parseFloat(pay_amount || amount || "0");

    if (receivedAmount <= 0) {
      console.log("Invalid amount:", receivedAmount);
      return new Response(JSON.stringify({ success: false, error: "Invalid amount" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map OxaPay status to our status
    let newStatus: string;
    const oxaStatus = (status || "").toLowerCase();
    if (oxaStatus === "paid" || oxaStatus === "confirmed" || oxaStatus === "complete" || oxaStatus === "sending") {
      newStatus = "approved";
    } else if (oxaStatus === "expired" || oxaStatus === "failed") {
      newStatus = "cancelled";
    } else {
      // Still pending/waiting
      console.log("Payment still pending, status:", status);
      return new Response(JSON.stringify({ success: true, status: "still_pending" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (newStatus === "cancelled") {
      console.log("Payment cancelled/expired");
      return new Response(JSON.stringify({ success: true, status: "cancelled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- APPROVED PAYMENT - Find the user ----

    // Strategy 1: Find by track_id in transactions table (for invoice-based payments)
    let userId: string | null = null;
    let existingTxn: any = null;

    if (track_id) {
      const { data: txn } = await supabase
        .from("transactions")
        .select("*")
        .eq("tx_hash", track_id)
        .eq("type", "deposit")
        .eq("status", "pending")
        .maybeSingle();
      
      if (txn) {
        existingTxn = txn;
        userId = txn.user_id;
        console.log("Found existing transaction by track_id:", txn.id, "user:", userId);
      }
    }

    // Strategy 2: Find user by static address
    if (!userId && address) {
      const { data: staticAddr } = await supabase
        .from("user_static_addresses")
        .select("*")
        .eq("address", address)
        .maybeSingle();

      if (staticAddr) {
        userId = staticAddr.user_id;
        console.log("Found user by static address:", userId, "address:", address);
      }
    }

    // Strategy 3: Find user by track_id in user_static_addresses
    if (!userId && track_id) {
      const { data: staticAddr } = await supabase
        .from("user_static_addresses")
        .select("*")
        .eq("track_id", track_id)
        .maybeSingle();

      if (staticAddr) {
        userId = staticAddr.user_id;
        console.log("Found user by static address track_id:", userId);
      }
    }

    if (!userId) {
      console.error("Could not identify user for payment. address:", address, "track_id:", track_id);
      return new Response(JSON.stringify({ success: false, error: "User not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for duplicate: has this txID already been processed?
    if (txID) {
      const { data: dupCheck } = await supabase
        .from("transactions")
        .select("id")
        .eq("tx_hash", txID)
        .eq("type", "deposit")
        .eq("status", "approved")
        .maybeSingle();

      if (dupCheck) {
        console.log("Duplicate payment already processed, txID:", txID);
        return new Response(JSON.stringify({ success: true, status: "already_processed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // If we have an existing pending transaction, update it
    if (existingTxn) {
      await supabase
        .from("transactions")
        .update({
          status: "approved",
          amount: receivedAmount,
          tx_hash: txID || track_id,
          network: network || existingTxn.network,
        })
        .eq("id", existingTxn.id);
      console.log("Updated existing transaction:", existingTxn.id);
    } else {
      // Create a new deposit transaction
      const { error: insertErr } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type: "deposit",
          amount: receivedAmount,
          status: "approved",
          currency: pay_currency || currency || "USDT",
          network: network || null,
          tx_hash: txID || track_id || null,
          wallet_address: address || null,
          description: `Auto deposit via OxaPay - ${receivedAmount} ${pay_currency || currency || "USDT"}`,
        });
      
      if (insertErr) {
        console.error("Failed to insert transaction:", insertErr);
      } else {
        console.log("Created new deposit transaction for user:", userId, "amount:", receivedAmount);
      }
    }

    // Credit the user's wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .eq("currency", "USDT")
      .maybeSingle();

    if (wallet) {
      const newBalance = (wallet.balance || 0) + receivedAmount;
      await supabase
        .from("wallets")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", wallet.id);
      console.log("Wallet credited. Old:", wallet.balance, "New:", newBalance);
    } else {
      // Create wallet if it doesn't exist
      await supabase.from("wallets").insert({
        user_id: userId,
        currency: "USDT",
        balance: receivedAmount,
      });
      console.log("Created new wallet for user:", userId, "balance:", receivedAmount);
    }

    // Send notification
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "💰 Deposit Confirmed",
      message: `Your deposit of $${receivedAmount.toFixed(2)} USDT has been confirmed and credited to your wallet.`,
      type: "success",
    });

    // Process referral commission (10% level 1 rebate on deposit)
    const { data: profile } = await supabase
      .from("profiles")
      .select("referred_by")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.referred_by) {
      const { data: referrer } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("referral_code", profile.referred_by)
        .maybeSingle();

      if (referrer) {
        const commissionRate = 0.05; // 5% deposit commission
        const commissionAmount = receivedAmount * commissionRate;

        await supabase.from("commissions").insert({
          user_id: referrer.user_id,
          from_user_id: userId,
          amount: commissionAmount,
          type: "referral",
          level: 1,
          description: `Referral commission from deposit of $${receivedAmount.toFixed(2)}`,
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

    console.log("Deposit fully processed for user:", userId, "amount:", receivedAmount);

    return new Response(
      JSON.stringify({ success: true, status: "approved", amount: receivedAmount }),
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
