import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Users, Copy, UserPlus, Layers, ChevronDown, ChevronRight, DollarSign, Bot, TrendingUp, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface DownlineMember {
  profile_id: string;
  full_name: string | null;
  rank: string;
  is_active: boolean;
  created_at: string;
  level: number;
  referral_code: string | null;
  referred_by: string | null;
  total_deposit: number;
  active_bots: number;
}

const RANK_COLORS: Record<string, string> = {
  bronze: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  silver: "bg-slate-400/10 text-slate-400 border-slate-400/20",
  gold: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  platinum: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
  diamond: "bg-violet-400/10 text-violet-400 border-violet-400/20",
};

const LEVEL_COLORS = ["text-primary", "text-accent", "text-success", "text-warning", "text-destructive", "text-primary", "text-accent", "text-success", "text-warning", "text-destructive"];

const Team = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [allMembers, setAllMembers] = useState<DownlineMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1]));
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (prof) setProfile(prof);

      const { data: members } = await supabase.rpc("get_downline_with_stats", { p_user_id: user.id });
      if (members) setAllMembers(members as DownlineMember[]);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleCopyLink = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(`${window.location.origin}/register?ref=${profile.referral_code}`);
      toast({ title: "Referral link copied!" });
    }
  };

  const toggleLevel = (level: number) => {
    setExpandedLevels(prev => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
  };

  const directReferrals = allMembers.filter(m => m.level === 1);
  const activeMembers = allMembers.filter(m => m.is_active);
  const groupTurnover = allMembers.reduce((sum, m) => sum + (m.total_deposit || 0), 0);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return allMembers;
    const q = searchQuery.toLowerCase();
    return allMembers.filter(m =>
      (m.full_name || "").toLowerCase().includes(q) ||
      (m.referral_code || "").toLowerCase().includes(q)
    );
  }, [allMembers, searchQuery]);

  const groupedByLevel: Record<number, DownlineMember[]> = {};
  filteredMembers.forEach(m => {
    if (!groupedByLevel[m.level]) groupedByLevel[m.level] = [];
    groupedByLevel[m.level].push(m);
  });

  const levelLabels = ["", "Level 1 (Direct)", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6", "Level 7", "Level 8", "Level 9", "Level 10"];

  return (
    <DashboardLayout title="My Team">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Referral Link */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Invite Friends</span>
          </div>
          {profile?.referral_code ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/50 rounded-xl p-3 text-xs break-all text-muted-foreground select-all overflow-x-auto">
                {`${window.location.origin}/register?ref=${profile.referral_code}`}
              </div>
              <button onClick={handleCopyLink} className="p-3 rounded-xl glass hover:bg-muted/50 transition text-primary shrink-0">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground animate-pulse">
              Loading referral link...
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-strong rounded-xl p-4 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Direct</p>
            <p className="font-display font-bold text-xl text-foreground">{directReferrals.length}</p>
          </div>
          <div className="glass-strong rounded-xl p-4 text-center">
            <Layers className="w-5 h-5 text-accent mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Total Network</p>
            <p className="font-display font-bold text-xl text-foreground">{allMembers.length}</p>
          </div>
          <div className="glass-strong rounded-xl p-4 text-center">
            <Users className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Active</p>
            <p className="font-display font-bold text-xl text-foreground">{activeMembers.length}</p>
          </div>
        </div>

        {/* Group Turnover */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium text-foreground">Group Turnover</span>
          </div>
          <p className="text-2xl font-display font-bold text-accent">${groupTurnover.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Total deposits across entire network</p>
        </motion.div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search member by name or referral code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Network Tree by Level */}
        {loading ? (
          <div className="glass-strong rounded-2xl p-8 text-center">
            <div className="animate-pulse text-muted-foreground text-sm">Loading network...</div>
          </div>
        ) : allMembers.length === 0 ? (
          <div className="glass-strong rounded-2xl p-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No team members yet</p>
            <p className="text-xs text-muted-foreground mt-1">Share your referral link to grow your team</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.keys(groupedByLevel).sort((a, b) => Number(a) - Number(b)).map(lvlStr => {
              const lvl = Number(lvlStr);
              const members = groupedByLevel[lvl];
              const isExpanded = expandedLevels.has(lvl);
              const levelTurnover = members.reduce((s, m) => s + (m.total_deposit || 0), 0);

              return (
                <div key={lvl} className="glass-strong rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleLevel(lvl)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <div className="text-left">
                        <span className={`text-sm font-semibold ${LEVEL_COLORS[lvl - 1] || "text-foreground"}`}>
                          {levelLabels[lvl] || `Level ${lvl}`}
                        </span>
                        <p className="text-[10px] text-muted-foreground">Turnover: ${levelTurnover.toFixed(2)}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {members.length} member{members.length > 1 ? "s" : ""}
                    </Badge>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3 space-y-2">
                          {members.map((member, i) => (
                            <motion.div
                              key={member.profile_id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              className="bg-muted/30 rounded-xl p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <span className="text-sm font-bold text-primary">
                                    {(member.full_name || "U")[0].toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{member.full_name || "User"}</p>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${RANK_COLORS[member.rank] || "text-muted-foreground"}`}>
                                      {member.rank.charAt(0).toUpperCase() + member.rank.slice(1)}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      Joined {new Date(member.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <span className={`w-2 h-2 rounded-full shrink-0 ${member.is_active ? "bg-success" : "bg-muted-foreground"}`} />
                              </div>
                              {/* Member Details */}
                              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/30">
                                <div className="flex items-center gap-1.5">
                                  <DollarSign className="w-3 h-3 text-accent" />
                                  <div>
                                    <p className="text-[9px] text-muted-foreground">Total Deposit</p>
                                    <p className="text-xs font-semibold text-foreground">${(member.total_deposit || 0).toFixed(2)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Bot className="w-3 h-3 text-primary" />
                                  <div>
                                    <p className="text-[9px] text-muted-foreground">Active Bots</p>
                                    <p className="text-xs font-semibold text-foreground">{member.active_bots || 0}</p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Team;
