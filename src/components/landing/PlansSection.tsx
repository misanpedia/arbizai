import { motion } from "framer-motion";
import { Check, Star, Zap, Crown, Diamond } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Spatial Arbitrage",
    icon: Zap,
    range: "$5 – $100",
    daily: "0.1% – 1%",
    features: ["AI Arbitrage Engine", "Daily profit credits", "No lock period", "24/7 monitoring", "Basic analytics"],
    popular: false,
    gradient: "from-primary/20 to-primary/5",
  },
  {
    name: "Statistical Arbitrage",
    icon: Star,
    range: "$100 – $1,000",
    daily: "0.2% – 2%",
    features: ["Everything in Spatial", "Priority execution", "Advanced analytics", "Portfolio tracker", "Email alerts"],
    popular: true,
    gradient: "from-secondary/20 to-secondary/5",
  },
  {
    name: "Triangular Arbitrage",
    icon: Crown,
    range: "$1,000 – $10,000",
    daily: "0.3% – 3%",
    features: ["Everything in Statistical", "Multi-exchange scanning", "Risk management AI", "Team features", "API access"],
    popular: false,
    gradient: "from-accent/20 to-accent/5",
  },
  {
    name: "Cross-Chain Arbitrage",
    icon: Diamond,
    range: "$10,000 – $100,000",
    daily: "0.4% – 4%",
    features: ["Everything in Triangular", "Dedicated AI engine", "VIP support 24/7", "Custom strategies", "Maximum priority"],
    popular: false,
    gradient: "from-warning/20 to-warning/5",
  },
];

export function PlansSection() {
  return (
    <section className="py-24" id="plans">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            AI Bot <span className="gradient-text">Plans</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose a plan that fits your trading goals. No lock period, withdraw anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`glass rounded-2xl p-6 relative group hover:border-primary/30 transition-all duration-300 ${
                plan.popular ? "ring-2 ring-secondary glow-primary scale-[1.02]" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-primary text-xs font-bold text-primary-foreground">
                  Most Popular
                </div>
              )}

              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} mb-4`}>
                <plan.icon className="w-6 h-6 text-foreground" />
              </div>

              <h3 className="font-display font-bold text-xl mb-1">{plan.name}</h3>
              <div className="text-sm text-muted-foreground mb-4">{plan.range}</div>

              <div className="mb-6">
                <span className="text-3xl font-display font-bold gradient-text">{plan.daily}</span>
                <span className="text-sm text-muted-foreground ml-1">/ day</span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Button className={`w-full ${plan.popular ? "gradient-primary text-primary-foreground" : ""}`} variant={plan.popular ? "default" : "outline"}>
                Get Started
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            ⚠️ <strong>Risk Disclaimer:</strong> Daily returns are variable based on market conditions. Past performance does not guarantee future results. Crypto trading carries high risk. No fixed income guarantee.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
