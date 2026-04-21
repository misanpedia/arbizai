import { motion } from "framer-motion";
import { Users, TrendingUp, Award, Layers, DollarSign, Trophy } from "lucide-react";

const referralLevels = [
  { level: 1, rate: "5%" },
  { level: 2, rate: "3%" },
  { level: 3, rate: "2%" },
  { level: 4, rate: "1%" },
  { level: 5, rate: "0.5%" },
];

const rebateLevels = [
  { level: 1, rate: "10%" },
  { level: "2–10", rate: "2%" },
  { level: "11–20", rate: "1%" },
];

export function ReferralSection() {
  return (
    <section className="py-24" id="referral">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Commission <span className="gradient-text">Structure</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Three types of commissions to maximize your earning potential.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
          {/* Referral Commission */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">Referral Commission</h3>
                <p className="text-[10px] text-muted-foreground">From downline deposits</p>
              </div>
            </div>
            <div className="space-y-2">
              {referralLevels.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5">
                  <span className="text-sm text-muted-foreground">Level {item.level}</span>
                  <span className="font-display font-bold text-foreground">{item.rate}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              * Earn a percentage from every deposit made by your downline up to 5 levels deep.
            </p>
          </motion.div>

          {/* Rebate Commission */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">Rebate Commission</h3>
                <p className="text-[10px] text-muted-foreground">From downline daily profit</p>
              </div>
            </div>
            <div className="space-y-2">
              {rebateLevels.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5">
                  <span className="text-sm text-muted-foreground">Level {item.level}</span>
                  <span className="font-display font-bold text-foreground">{item.rate}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              * Earn a percentage of your downline's daily profit across 20 levels.
            </p>
          </motion.div>

          {/* Rank Commission */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">Rank Commission</h3>
                <p className="text-[10px] text-muted-foreground">Weekly rank bonus</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { rank: "Bronze", reward: "$10/week" },
                { rank: "Silver", reward: "$25/week" },
                { rank: "Gold", reward: "$50/week" },
                { rank: "Diamond", reward: "$150/week" },
                { rank: "Legend", reward: "$5,000/week" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5">
                  <span className="text-sm text-muted-foreground">{item.rank}</span>
                  <span className="font-display font-bold text-foreground">{item.reward}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              * Unlock weekly bonuses by achieving rank milestones through team building.
            </p>
          </motion.div>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto mt-12">
          {[
            {
              icon: Users,
              title: "Invite Friends",
              desc: "Share your unique referral code. Earn commission from their deposits instantly.",
            },
            {
              icon: TrendingUp,
              title: "Earn Daily Rebates",
              desc: "Receive a percentage of your downline's daily profit automatically.",
            },
            {
              icon: Award,
              title: "Climb the Ranks",
              desc: "Build your team, unlock higher ranks, and earn weekly rank bonuses.",
            },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass rounded-2xl p-5 flex gap-4 items-start">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-foreground mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
