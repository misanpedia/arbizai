import { motion } from "framer-motion";
import { Users, TrendingUp, Award, Layers } from "lucide-react";

const commissionLevels = [
  { level: 1, rate: "10%" },
  { level: 2, rate: "5%" },
  { level: 3, rate: "5%" },
  { level: 4, rate: "4%" },
  { level: 5, rate: "4%" },
  { level: 6, rate: "3%" },
  { level: 7, rate: "3%" },
  { level: 8, rate: "2%" },
  { level: 9, rate: "2%" },
  { level: 10, rate: "1%" },
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
            Referral <span className="gradient-text">Commission</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Earn passive income from your network. Get commission rebates from your downline's daily profits across 10 levels.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto items-start">
          {/* Commission Table */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl">10-Level Commission</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {commissionLevels.map((item) => (
                <div
                  key={item.level}
                  className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3"
                >
                  <span className="text-sm text-muted-foreground">Level {item.level}</span>
                  <span className="font-display font-bold text-foreground">{item.rate}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              * Commission is calculated as a rebate from your downline's daily profit.
            </p>
          </motion.div>

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-5"
          >
            {[
              {
                icon: Users,
                title: "Invite Friends",
                desc: "Share your unique referral code. When they sign up and activate a bot, you start earning.",
              },
              {
                icon: TrendingUp,
                title: "Earn Daily Rebates",
                desc: "Receive a percentage of your downline's daily profit automatically credited to your wallet.",
              },
              {
                icon: Award,
                title: "Build Your Network",
                desc: "The deeper your network, the more you earn. Up to 10 levels of passive commission income.",
              },
            ].map((item, i) => (
              <div key={i} className="glass rounded-2xl p-5 flex gap-4 items-start">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
