import { motion } from "framer-motion";
import { Shield, Star, Award, Crown, Diamond, Gem, Sparkles, Trophy } from "lucide-react";

const ranks = [
  { name: "Bronze",   icon: Shield,   referrals: 5,   volume: "$1K",    bot: "$100",   commission: "$10/wk",  color: "from-orange-600/20 to-orange-600/5", ring: "" },
  { name: "Silver",   icon: Star,     referrals: 10,  volume: "$2.5K",  bot: "$200",   commission: "$20/wk",  color: "from-slate-400/20 to-slate-400/5", ring: "" },
  { name: "Gold",     icon: Award,    referrals: 15,  volume: "$5K",    bot: "$250",   commission: "$50/wk",  color: "from-yellow-500/20 to-yellow-500/5", ring: "" },
  { name: "Diamond",  icon: Diamond,  referrals: 30,  volume: "$10K",   bot: "$500",   commission: "$100/wk", color: "from-cyan-400/20 to-cyan-400/5", ring: "ring-1 ring-cyan-400/30" },
  { name: "Emerald",  icon: Gem,      referrals: 60,  volume: "$25K",   bot: "$1K",    commission: "$250/wk", color: "from-emerald-500/20 to-emerald-500/5", ring: "ring-1 ring-emerald-400/30" },
  { name: "Ruby",     icon: Sparkles, referrals: 100, volume: "$50K",   bot: "$1.5K",  commission: "$500/wk", color: "from-red-500/20 to-red-500/5", ring: "ring-1 ring-red-400/30" },
  { name: "Crown",    icon: Crown,    referrals: 200, volume: "$100K",  bot: "$2K",    commission: "$1K/wk",  color: "from-amber-400/20 to-amber-400/5", ring: "ring-2 ring-amber-300/40" },
  { name: "Legend",   icon: Trophy,   referrals: 500, volume: "$500K",  bot: "$2.5K",  commission: "$5K/wk",  color: "from-purple-500/20 to-purple-500/5", ring: "ring-2 ring-purple-400/40 glow-primary" },
];

export function RankSection() {
  return (
    <section className="py-24" id="ranks">
      <div className="container px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Rank <span className="gradient-text">System</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Climb through 8 ranks by growing your team. Higher ranks unlock bigger weekly commissions.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-6xl mx-auto">
          {ranks.map((rank, i) => (
            <motion.div
              key={rank.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`glass rounded-2xl p-4 md:p-5 text-center relative ${rank.ring}`}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${rank.color} mb-3`}>
                <rank.icon className="w-6 h-6 md:w-7 md:h-7 text-foreground" />
              </div>
              <h3 className="font-display font-bold text-base md:text-lg mb-2">{rank.name}</h3>

              <div className="space-y-1.5 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Bot</span>
                  <span className="font-semibold text-foreground">{rank.bot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referrals</span>
                  <span className="font-semibold text-foreground">{rank.referrals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Vol.</span>
                  <span className="font-semibold text-foreground">{rank.volume}</span>
                </div>
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commission</span>
                  <span className="font-display font-bold gradient-text">{rank.commission}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xs text-muted-foreground text-center mt-8 max-w-2xl mx-auto">
          Rank commission is paid weekly. Requirements: personal AI Bot activation, active direct referrals, and total team AI Bot investment volume.
        </motion.p>
      </div>
    </section>
  );
}
