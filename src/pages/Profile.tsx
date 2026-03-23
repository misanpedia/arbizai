import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Copy, Shield, Award, Mail, Calendar, Users, TrendingUp, Wallet, Zap, Activity, Cpu, ShieldCheck, Trophy, Calculator, Megaphone, BarChart3, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const rankColors: Record<string, string> = {
  bronze: "from-teal-800 to-blue-900",
  silver: "from-slate-600 to-slate-800",
  gold: "from-teal-700 to-indigo-800",
  platinum: "from-cyan-700 to-blue-800",
  diamond: "from-violet-700 to-indigo-900",
};

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalInvested: 0, totalProfit: 0, teamCount: 0, balance: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [profileRes, investRes, profitRes, walletRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("investments").select("amount").eq("user_id", user.id).eq("status", "active"),
        supabase.from("profits").select("amount").eq("user_id", user.id),
        supabase.from("wallets").select("balance").eq("user_id", user.id).eq("currency", "USDT").maybeSingle(),
      ]);
      if (profileRes.data) {
        setProfile(profileRes.data);
        setFullName(profileRes.data.full_name || "");
        setPhone(profileRes.data.phone || "");
      }
      setStats({
        totalInvested: investRes.data?.reduce((s, i) => s + Number(i.amount), 0) || 0,
        totalProfit: profitRes.data?.reduce((s, p) => s + Number(p.amount), 0) || 0,
        teamCount: 0,
        balance: walletRes.data ? Number(walletRes.data.balance) : 0,
      });
    };
    fetchAll();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("user_id", user.id);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
    }
  };

  const handleCopyReferral = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(`${window.location.origin}/register?ref=${profile.referral_code}`);
      toast({ title: "Referral link copied!" });
    }
  };

  const rank = profile?.rank || "bronze";

  const extraMenuItems = [
    { icon: ShieldCheck, label: "KYC", color: "text-success", path: "/kyc" },
    { icon: Calculator, label: "Calculator", color: "text-accent", path: "/calculator" },
    { icon: BarChart3, label: "Profit Log", color: "text-warning", path: "/profit-history" },
    { icon: Megaphone, label: "News", color: "text-primary", path: "/announcements" },
    { icon: Cpu, label: "Education", color: "text-accent", path: "/education" },
    { icon: Lock, label: "Security", color: "text-warning", path: "/security-info" },
  ];

  return (
    <DashboardLayout title="Profile">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Hero Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl">
          <div className={`bg-gradient-to-br ${rankColors[rank] || rankColors.bronze} p-6 pb-8`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
                <User className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-display font-bold text-lg text-white">{profile?.full_name || "User"}</h2>
                <p className="text-white/70 text-sm flex items-center gap-1"><Mail className="w-3 h-3" />{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Award className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">{rank} Member</span>
                </div>
              </div>
            </div>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-px bg-border/30">
            {[
              { label: "Balance", value: `$${stats.balance.toFixed(2)}`, icon: Wallet },
              { label: "Invested", value: `$${stats.totalInvested.toFixed(2)}`, icon: TrendingUp },
              { label: "Profit", value: `$${stats.totalProfit.toFixed(2)}`, icon: TrendingUp },
            ].map((item, i) => (
              <div key={i} className="glass-strong p-3 text-center">
                <item.icon className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-display font-bold text-sm text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Extra Menu Grid */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h3 className="font-display font-semibold text-foreground mb-3">More Features</h3>
          <div className="grid grid-cols-3 gap-3">
            {extraMenuItems.map((item, i) => (
              <Link key={i} to={item.path} className="glass-strong rounded-xl p-3 flex flex-col items-center gap-1.5 hover:bg-muted/50 transition text-center">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-xs text-foreground font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Referral Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Referral Code</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted/50 rounded-xl p-3">
              <code className="text-sm text-primary font-mono">{profile?.referral_code || "..."}</code>
            </div>
            <button onClick={handleCopyReferral} className="p-3 rounded-xl glass hover:bg-muted/50 transition text-primary">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Share your referral link to earn rebate commission from your team's daily profit.</p>
        </motion.div>

        {/* Account Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-strong rounded-2xl p-5 space-y-3">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Account Details
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">KYC Status</p>
              <Link to="/kyc" className={`text-sm font-medium capitalize underline decoration-dotted ${profile?.kyc_status === "verified" ? "text-success" : "text-warning"}`}>
                {profile?.kyc_status || "unverified"} →
              </Link>
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Member Since</p>
              <p className="text-sm font-medium text-foreground">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Edit Form */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground">Edit Profile</h3>
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="glass" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+62..." className="glass" />
          </div>
          <Button onClick={handleSave} disabled={loading} className="w-full gradient-primary text-primary-foreground">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </motion.div>

        {/* Logout */}
        <Button variant="outline" onClick={() => signOut()} className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
          Log Out
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
