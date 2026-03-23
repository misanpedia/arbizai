import { motion } from "framer-motion";
import { Shield, Star, Crown, Diamond, Award } from "lucide-react";

const ranks = [
  {
    name: "Bronze",
    icon: Shield,
    referrals: 5,
    volume: "$2,500",
    bonus: "10%",
    color: "from-amber-700/20 to-amber-700/5",
    ring: "",
  },
  {
    name: "Silver",
    icon: Star,
    referrals: 10,
    volume: "$5,000",
    bonus: "7%",
    color: "from-slate-400/20 to-slate-400/5",
    ring: "",
  },
  {
    name: "Gold",
    icon: Award,
    referrals: 20,
    volume: "$10,000",
    bonus: "5%",
    color: "from-yellow-500/20 to-yellow-500/5",
    ring: "",
  },
  {
    name: "Platinum",
    icon: Crown,
    referrals: 50,
    volume: "$25,000",
    bonus: "2%",
    color: "from-primary/20 to-primary/5",
    ring: "ring-1 ring-primary/30",
  },
  {
    name: "Diamond",
    icon: Diamond,
    referrals: 100,
    volume: "$50,000",
    bonus: "1%",
    color: "from-accent/20 to-accent/5",
    ring: "ring-2 ring-accent/40 glow-primary",
  },
];

export function RankSection() {
  return (
    <section className="py-24" id="ranks">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Rank <span className="gradient-text">System</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Climb the ranks by growing your team. Higher ranks unlock additional bonus percentages on your daily profits.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5 max-w-6xl mx-auto">
          {ranks.map((rank, i) => (
            <motion.div
              key={rank.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`glass rounded-2xl p-5 text-center relative ${rank.ring}`}
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${rank.color} mb-4`}>
                <rank.icon className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="font-display font-bold text-lg mb-3">{rank.name}</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referrals</span>
                  <span className="font-semibold text-foreground">{rank.referrals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Volume</span>
                  <span className="font-semibold text-foreground">{rank.volume}</span>
                </div>
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rank Bonus</span>
                  <span className="font-display font-bold gradient-text">{rank.bonus}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs text-muted-foreground text-center mt-8 max-w-2xl mx-auto"
        >
          Rank bonus is an additional percentage applied on top of your daily profit. Requirements are based on active direct referrals and total team investment volume.
        </motion.p>
      </div>
    </section>
  );
}
