import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp,
  Users, Award, BarChart3, LogOut,
  Activity, Cpu, Wifi, ShieldCheck, Shield, Coins, Bell, ArrowRightLeft,
  Zap, History
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { NotificationCenter } from "@/components/NotificationCenter";
import { DefiActivityFeed } from "@/components/dashboard/DefiActivityFeed";

interface WalletData {
  currency: string;
  balance: number;
  frozen_balance: number;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  useNotifications();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [todayProfit, setTodayProfit] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const [walletsRes, profileRes, investRes, profitRes, todayProfitRes, notifRes] = await Promise.all([
          supabase.from("wallets").select("currency, balance, frozen_balance, bonus_balance").eq("user_id", user.id),
          supabase.from("profiles").select("*").eq("user_id", user.id).single(),
          supabase.from("investments").select("amount").eq("user_id", user.id).eq("status", "active"),
          supabase.from("profits").select("amount").eq("user_id", user.id),
          supabase.from("profits").select("amount").eq("user_id", user.id).eq("profit_date", today),
          supabase.from("notifications").select("id", { count: "exact" }).or(`user_id.eq.${user.id},user_id.is.null`).eq("is_read", false),
        ]);
        if (walletsRes.data) setWallets(walletsRes.data.map(w => ({ ...w, balance: Number(w.balance), frozen_balance: Number(w.frozen_balance) })));
        if (profileRes.data) setProfile(profileRes.data);
        if (investRes.data) setTotalInvested(investRes.data.reduce((s, i) => s + Number(i.amount), 0));
        if (profitRes.data) setTotalProfit(profitRes.data.reduce((s, p) => s + Number(p.amount), 0));
        if (todayProfitRes.data) setTodayProfit(todayProfitRes.data.reduce((s, p) => s + Number(p.amount), 0));
        setUnreadCount(notifRes.count || 0);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setDataLoaded(true);
      }
    };

    fetchData();

    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });

    const channel = supabase.channel("wallet-changes").on("postgres_changes", { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${user.id}` }, () => {
      fetchData();
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const usdtWallet = useMemo(() => wallets.find(w => w.currency === "USDT"), [wallets]);
  const totalBalance = usdtWallet?.balance || 0;
  const bonusBalance = (usdtWallet as any)?.bonus_balance ? Number((usdtWallet as any).bonus_balance) : 0;

  if (authLoading || (!dataLoaded && user)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Logout error:", e);
    }
    // Force full page reload to clear all state
    window.location.href = "/";
  };

  const quickMenuItems = [
    { icon: ArrowDownCircle, label: "Deposit", color: "text-success", path: "/deposit" },
    { icon: ArrowUpCircle, label: "Withdraw", color: "text-warning", path: "/withdraw" },
    { icon: ArrowRightLeft, label: "Transfer", color: "text-cyan-400", path: "/transfer" },
    { icon: TrendingUp, label: "AI Bot", color: "text-primary", path: "/invest" },
    { icon: BarChart3, label: "My AI Bot", color: "text-secondary", path: "/investments" },
    { icon: Users, label: "My Team", color: "text-accent", path: "/team" },
    { icon: Wallet, label: "Commission", color: "text-success", path: "/commissions" },
    { icon: Award, label: "Rank", color: "text-warning", path: "/rank" },
    { icon: Coins, label: "ARBIZ", color: "text-primary", path: "/arbiz" },
    { icon: Zap, label: "Lucky Spin", color: "text-primary", path: "/spin" },
    { icon: Activity, label: "Check-in", color: "text-success", path: "/checkin" },
    { icon: History, label: "History", color: "text-muted-foreground", path: "/history" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Header */}
      <header className="gradient-primary p-6 pb-20 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-primary-foreground/70 text-sm">Welcome,</p>
            <h1 className="text-xl font-display font-bold text-primary-foreground">{profile?.full_name || "User"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground text-xs font-medium capitalize">{profile?.rank || "bronze"}</span>
            <button onClick={() => setShowNotifications(true)} className="p-2 rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </button>
            {isAdmin && (
              <Link to="/admin" className="p-2 rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition">
                <Shield className="w-4 h-4" />
              </Link>
            )}
            <button onClick={handleLogout} className="p-2 rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-primary-foreground/70 text-sm">Total Balance</p>
          <h2 className="text-3xl font-display font-bold text-primary-foreground">${totalBalance.toFixed(2)}</h2>
          {bonusBalance > 0 && (
            <p className="text-primary-foreground/60 text-xs mt-0.5">+ ${bonusBalance.toFixed(2)} bonus (activate only)</p>
          )}
        </div>
      </header>

      {/* Summary Cards */}
      <div className="px-4 -mt-12 grid grid-cols-3 gap-3">
        {[
          { label: "Active Bot", value: `$${totalInvested.toFixed(2)}`, icon: TrendingUp },
          { label: "Today Profit", value: `$${todayProfit.toFixed(2)}`, icon: Activity },
          { label: "Total Profit", value: `$${totalProfit.toFixed(2)}`, icon: BarChart3 },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-strong rounded-xl p-3 text-center">
            <item.icon className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="font-display font-bold text-sm text-foreground">{item.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Menu - 4x2 grid */}
      <div className="px-4 mt-6">
        <h3 className="font-display font-semibold text-foreground mb-3">Quick Menu</h3>
        <div className="grid grid-cols-4 gap-3">
          {quickMenuItems.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.05 }}>
              <Link to={item.path} className="glass rounded-xl p-3 flex flex-col items-center gap-1.5 hover:bg-muted/50 transition text-center">
                <item.icon className={`w-6 h-6 ${item.color}`} />
                <span className="text-xs text-foreground font-medium">{item.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Arbitrage Scanner */}
      <div className="px-4 mt-6">
        <h3 className="font-display font-semibold text-foreground mb-3">Real-time Quantum Arbitrage</h3>
        <ArbitrageScanner />
      </div>

      {/* DeFi Activity Feed */}
      <div className="px-4 mt-6">
        <DefiActivityFeed />
      </div>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border/50 px-2 py-2 flex justify-around md:hidden z-50">
        {[
          { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
          { icon: ArrowDownCircle, label: "Deposit", path: "/deposit" },
          { icon: TrendingUp, label: "AI Bot", path: "/invest" },
          { icon: ArrowUpCircle, label: "Withdraw", path: "/withdraw" },
          { icon: Users, label: "Profile", path: "/profile" },
        ].map((item, i) => (
          <Link key={i} to={item.path} className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition py-1 px-3">
            <item.icon className="w-5 h-5" />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Notification Center */}
      <NotificationCenter open={showNotifications} onClose={() => setShowNotifications(false)} />
    </div>
  );
};

function ArbitrageScanner() {
  const [feeds, setFeeds] = useState<any[]>([]);

  useEffect(() => {
    const generateFeed = () => {
      const pairs = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", "ADA/USDT", "MATIC/USDT", "ARB/USDT"];
      const cex = ["Binance", "Kraken", "Coinbase", "Bybit", "OKX", "Huobi", "KuCoin", "Gate.io"];
      const dex = ["Uniswap", "PancakeSwap", "SushiSwap", "Raydium", "Jupiter", "dYdX", "Curve", "1inch"];
      const all = [...cex, ...dex];
      const pickTwo = () => {
        const a = all[Math.floor(Math.random() * all.length)];
        let b = all[Math.floor(Math.random() * all.length)];
        while (b === a) b = all[Math.floor(Math.random() * all.length)];
        return `${a}→${b}`;
      };
      return Array.from({ length: 10 }, () => ({
        pair: pairs[Math.floor(Math.random() * pairs.length)],
        exchange: pickTwo(),
        spread: (Math.random() * 2.5 + 0.1).toFixed(3),
        confidence: Math.floor(Math.random() * 30 + 70),
        pnl: (Math.random() * 50 - 10).toFixed(2),
        status: Math.random() > 0.3 ? "executed" : "scanning",
      }));
    };

    setFeeds(generateFeed());
    const interval = setInterval(() => setFeeds(generateFeed()), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-strong rounded-2xl p-4 space-y-3 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary animate-pulse-glow" />
          <span className="text-sm font-medium text-foreground">AI Engine Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wifi className="w-4 h-4 text-success" />
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
      </div>

      <div className="space-y-2">
        {feeds.map((feed, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{feed.pair}</p>
              <p className="text-xs text-muted-foreground">{feed.exchange}</p>
            </div>
            <div className="text-center px-3">
              <p className="text-sm font-mono font-bold text-primary">{feed.spread}%</p>
              <p className="text-[10px] text-muted-foreground">spread</p>
            </div>
            <div className="text-center px-3">
              <p className="text-xs font-medium text-foreground">{feed.confidence}%</p>
              <p className="text-[10px] text-muted-foreground">conf.</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-mono font-bold ${Number(feed.pnl) >= 0 ? "text-success" : "text-destructive"}`}>
                {Number(feed.pnl) >= 0 ? "+" : ""}${feed.pnl}
              </p>
              <p className={`text-[10px] ${feed.status === "executed" ? "text-success" : "text-warning"}`}>
                {feed.status === "executed" ? "● Executed" : "◌ Scanning"}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
