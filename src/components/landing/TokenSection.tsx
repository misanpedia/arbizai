import { motion } from "framer-motion";
import { Coins, Gift, Rocket, Calendar } from "lucide-react";

export function TokenSection() {
  return (
    <section className="py-24" id="token">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            ARBIZ <span className="gradient-text">Token</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Earn ARBIZ tokens as rewards for your trading activity. Hold and claim them when the token launches.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            {
              icon: Gift,
              title: "Earn Tokens",
              desc: "Receive ARBIZ tokens every time you activate a new investment bot. Tokens are credited automatically to your ARBIZ balance.",
            },
            {
              icon: Coins,
              title: "Token Rate",
              desc: "Each ARBIZ token is valued at $0.10. The rate is set by the platform and may increase as the ecosystem grows.",
            },
            {
              icon: Calendar,
              title: "Claim Schedule",
              desc: "Token claims will be available on a date announced by the admin. Stay active to maximize your token holdings.",
            },
            {
              icon: Rocket,
              title: "Future Utility",
              desc: "ARBIZ tokens will unlock premium features, governance rights, and exclusive benefits within the Arbiz ecosystem.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 text-center group hover:border-primary/30 transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4 group-hover:scale-110 transition-transform">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
