import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Flame, Gift, CheckCircle, Star, ArrowRightLeft, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const STREAK_REWARDS = [0.05, 0.10, 0.15, 0.25, 0.50, 0.75, 1.00];

const DailyCheckin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [checkins, setCheckins] = useState<any[]>([]);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rewardBalance, setRewardBalance] = useState(0);
  const [converting, setConverting] = useState(false);

  const fetchRewardBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("wallets")
      .select("reward_balance")
      .eq("user_id", user.id)
      .eq("currency", "USDT")
      .maybeSingle();
    if (data) setRewardBalance(Number(data.reward_balance));
  };

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data } = await supabase.from("daily_checkins").select("*").eq("user_id", user.id).order("checkin_date", { ascending: false }).limit(30);
      if (data) {
        setCheckins(data);
        const today = new Date().toISOString().split("T")[0];
        setTodayCheckedIn(data.some(c => c.checkin_date === today));
        if (data.length > 0) setStreak(data[0].day_streak);
      }
    };
    fetchData();
    fetchRewardBalance();
  }, [user]);

  const handleCheckin = async () => {
    if (!user || todayCheckedIn || loading) return;
    setLoading(true);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const wasYesterday = checkins.some(c => c.checkin_date === yesterdayStr);
    const newStreak = wasYesterday ? streak + 1 : 1;
    const rewardIndex = Math.min(newStreak - 1, STREAK_REWARDS.length - 1);
    const reward = STREAK_REWARDS[rewardIndex];

    const { error } = await supabase.from("daily_checkins").insert({
      user_id: user.id,
      day_streak: newStreak,
      reward_amount: reward,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await supabase.rpc("atomic_reward_credit", { p_user_id: user.id, p_amount: reward, p_description: `Daily checkin day ${newStreak}` });

      setTodayCheckedIn(true);
      setStreak(newStreak);
      toast({ title: "✅ Check-in successful!", description: `+$${reward.toFixed(2)} added to Reward Balance` });

      const { data } = await supabase.from("daily_checkins").select("*").eq("user_id", user.id).order("checkin_date", { ascending: false }).limit(30);
      if (data) setCheckins(data);
      fetchRewardBalance();
    }
    setLoading(false);
  };

  const handleConvert = async () => {
    if (!user || converting) return;
    setConverting(true);
    const { data, error } = await supabase.rpc("convert_reward_to_balance", { p_user_id: user.id, p_amount: rewardBalance });
    if (error || data === false) {
      toast({ title: "Cannot convert", description: "Minimum $5.00 required to convert", variant: "destructive" });
    } else {
      toast({ title: "✅ Converted!", description: `$${rewardBalance.toFixed(2)} moved to main balance` });
      setRewardBalance(0);
    }
    setConverting(false);
    fetchRewardBalance();
  };

  return (
    <DashboardLayout title="Daily Check-in">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Reward Balance Card */}
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-strong rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Reward Balance</span>
            </div>
            <p className="text-2xl font-display font-bold text-primary">${rewardBalance.toFixed(2)}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Min. $5.00 to convert to main balance</p>
            <Button size="sm" onClick={handleConvert} disabled={rewardBalance < 5 || converting} variant="outline" className="gap-1.5 text-xs">
              <ArrowRightLeft className="w-3 h-3" /> Convert
            </Button>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min((rewardBalance / 5) * 100, 100)}%` }} />
          </div>
        </motion.div>

        {/* Streak Card */}
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.05 }} className="glass-strong rounded-2xl p-6 text-center">
          <Flame className="w-12 h-12 text-warning mx-auto mb-2" />
          <p className="text-4xl font-display font-bold text-foreground">{streak}</p>
          <p className="text-sm text-muted-foreground">Day Streak 🔥</p>
        </motion.div>

        {/* 7-Day Reward Grid */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" /> Weekly Rewards
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {STREAK_REWARDS.map((reward, i) => {
              const isCompleted = streak > i || (streak === i + 1 && todayCheckedIn);
              const isCurrent = streak === i && !todayCheckedIn;
              return (
                <motion.div key={i} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className={`flex flex-col items-center p-2 rounded-xl border transition ${
                    isCompleted ? "border-success bg-success/10" : isCurrent ? "border-primary bg-primary/10 animate-pulse" : "border-border/50"
                  }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-success mb-1" />
                  ) : (
                    <Star className={`w-5 h-5 mb-1 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                  )}
                  <span className="text-[10px] font-bold text-foreground">D{i + 1}</span>
                  <span className="text-[9px] text-muted-foreground">${reward.toFixed(2)}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        <Button onClick={handleCheckin} disabled={todayCheckedIn || loading} className="w-full gradient-primary text-primary-foreground py-6 rounded-2xl text-lg font-bold">
          {todayCheckedIn ? "✅ Already Checked In Today" : loading ? "Checking in..." : "🎁 Check In Now"}
        </Button>

        {/* History */}
        <div className="glass-strong rounded-2xl p-5 space-y-3">
          <h3 className="font-display font-semibold text-foreground">Recent Check-ins</h3>
          {checkins.slice(0, 10).map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">Day {c.day_streak} Streak</p>
                <p className="text-[10px] text-muted-foreground">{new Date(c.checkin_date).toLocaleDateString()}</p>
              </div>
              <span className="text-sm font-bold text-success">+${Number(c.reward_amount).toFixed(2)}</span>
            </div>
          ))}
          {checkins.length === 0 && <p className="text-muted-foreground text-center py-4 text-sm">No check-ins yet</p>}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DailyCheckin;
