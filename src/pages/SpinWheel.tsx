import { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Gift, Star, Trophy, ArrowRightLeft, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const SpinWheel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rewards, setRewards] = useState<any[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [todaySpins, setTodaySpins] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [rewardBalance, setRewardBalance] = useState(0);
  const [converting, setConverting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      const [rewardsRes, spinsRes, histRes] = await Promise.all([
        supabase.from("spin_rewards").select("*").eq("is_active", true),
        supabase.from("user_spins").select("id").eq("user_id", user.id).eq("spin_date", new Date().toISOString().split("T")[0]),
        supabase.from("user_spins").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);
      if (rewardsRes.data) setRewards(rewardsRes.data);
      if (spinsRes.data) setTodaySpins(spinsRes.data.length);
      if (histRes.data) setHistory(histRes.data);
    };
    fetchData();
    fetchRewardBalance();
  }, [user]);

  useEffect(() => {
    drawWheel();
  }, [rewards, rotation]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas || rewards.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    const arc = (2 * Math.PI) / rewards.length;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-center, -center);

    rewards.forEach((r, i) => {
      const angle = i * arc;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arc);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? "#1a1a2e" : "#16213e";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(r.label, radius - 20, 4);
      ctx.restore();
    });

    ctx.restore();

    ctx.beginPath();
    ctx.arc(center, center, 30, 0, 2 * Math.PI);
    ctx.fillStyle = "hsl(var(--primary))";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SPIN", center, center + 4);
  };

  const handleSpin = async () => {
    if (!user || spinning || todaySpins >= 1) return;
    setSpinning(true);
    setResult(null);

    const { data, error } = await supabase.functions.invoke("spin-wheel", {
      method: "POST",
    });

    if (error || !data?.success) {
      setSpinning(false);
      toast({ title: "Error", description: data?.error || "Failed to spin", variant: "destructive" });
      return;
    }

    const selectedIndex = data.selectedIndex;
    const arc = 360 / (data.rewardCount || rewards.length);
    const targetAngle = 360 - (selectedIndex * arc + arc / 2);
    const spins = 5 * 360 + targetAngle;

    let start = rotation;
    const duration = 4000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setRotation(start + spins * eased);
      if (progress < 1) requestAnimationFrame(animate);
      else finishSpin(data.reward);
    };
    requestAnimationFrame(animate);
  };

  const finishSpin = async (reward: any) => {
    if (!user) return;

    setResult(reward);
    setTodaySpins(prev => prev + 1);
    setSpinning(false);

    const histRes = await supabase.from("user_spins").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
    if (histRes.data) setHistory(histRes.data);

    fetchRewardBalance();
    const destination = reward.reward_type === "arbiz" ? "ARBIZ Balance" : reward.reward_type === "bonus" ? "Bonus Balance" : "Reward Balance";
    toast({ title: "🎉 You won!", description: `${reward.label} added to ${destination}` });
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
    <DashboardLayout title="Lucky Spin">
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

        {/* Wheel */}
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.05 }} className="glass-strong rounded-3xl p-6 flex flex-col items-center">
          <div className="relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary" />
            </div>
            <canvas ref={canvasRef} width={280} height={280} className="rounded-full" />
          </div>

          <Button onClick={handleSpin} disabled={spinning || todaySpins >= 1} className="mt-6 gradient-primary text-primary-foreground px-10 py-3 rounded-full text-lg font-bold">
            {spinning ? "Spinning..." : todaySpins >= 1 ? "Come Back Tomorrow" : "🎰 SPIN NOW"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">Spins today: {todaySpins}/1</p>
        </motion.div>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
              className="glass-strong rounded-2xl p-6 text-center space-y-3">
              <Trophy className="w-12 h-12 text-warning mx-auto" />
              <h3 className="font-display font-bold text-xl text-foreground">Congratulations! 🎉</h3>
              <p className="text-2xl font-bold text-primary">{result.label}</p>
              <p className="text-sm text-muted-foreground">
                Added to your {result.reward_type === "arbiz" ? "ARBIZ Balance" : result.reward_type === "bonus" ? "Bonus Balance" : "Reward Balance"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass-strong rounded-2xl p-5 space-y-3">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Star className="w-4 h-4 text-warning" /> Spin History
          </h3>
          {history.length === 0 && <p className="text-muted-foreground text-center py-4 text-sm">No spins yet</p>}
          {history.map((h) => (
            <div key={h.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{h.reward_label}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</p>
              </div>
              <Gift className="w-4 h-4 text-primary" />
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SpinWheel;
