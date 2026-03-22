import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export function useNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Listen for transaction status changes (deposit approved, etc.)
    const txChannel = supabase
      .channel("tx-notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const tx = payload.new as any;
          if (tx.status === "approved" || tx.status === "completed") {
            if (tx.type === "deposit") {
              toast({
                title: "💰 Deposit Approved!",
                description: `Your deposit of $${Number(tx.amount).toFixed(2)} ${tx.currency} has been approved.`,
              });
            } else if (tx.type === "withdraw") {
              toast({
                title: "✅ Withdrawal Approved!",
                description: `Your withdrawal of $${Number(tx.amount).toFixed(2)} ${tx.currency} is being processed.`,
              });
            } else if (tx.type === "profit") {
              toast({
                title: "📈 Profit Received!",
                description: `You earned $${Number(tx.amount).toFixed(2)} from arbitrage trading.`,
              });
            }
          } else if (tx.status === "rejected") {
            toast({
              title: "❌ Transaction Rejected",
              description: `Your ${tx.type} of $${Number(tx.amount).toFixed(2)} was rejected.`,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    // Listen for new profit entries
    const profitChannel = supabase
      .channel("profit-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profits",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const profit = payload.new as any;
          toast({
            title: "📈 Daily Profit Credited!",
            description: `You earned $${Number(profit.amount).toFixed(2)} from today's arbitrage.`,
          });
        }
      )
      .subscribe();

    // Listen for new commissions
    const commChannel = supabase
      .channel("commission-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "commissions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const comm = payload.new as any;
          toast({
            title: "🎉 Commission Earned!",
            description: `You received $${Number(comm.amount).toFixed(2)} commission (Level ${comm.level}).`,
          });
        }
      )
      .subscribe();

    // Listen for incoming transfer notifications
    const notifChannel = supabase
      .channel("transfer-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notif = payload.new as any;
          if (notif.title?.includes("Transfer")) {
            toast({
              title: notif.title,
              description: notif.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(txChannel);
      supabase.removeChannel(profitChannel);
      supabase.removeChannel(commChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [user]);
}
