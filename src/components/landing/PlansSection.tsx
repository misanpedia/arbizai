import { motion } from "framer-motion";
import { Check, Zap, Star, Crown, Diamond } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PLAN_ICONS: Record<string, typeof Zap> = {
  basic: Zap,
  advance: Star,
  business: Crown,
  elite: Diamond,
};

const PLAN_FEATURES: Record<string, string[]> = {
  basic: ["AI Arbitrage Engine", "Daily profit credits", "No lock period", "24/7 monitoring", "Basic analytics"],
  advance: ["Everything in Spatial", "Priority execution", "Advanced analytics", "Portfolio tracker", "Email alerts"],
  business: ["Everything in Statistical", "Multi-exchange scanning", "Risk management AI", "Team features", "API access"],
  elite: ["Everything in Triangular", "Dedicated AI engine", "VIP support 24/7", "Custom strategies", "Maximum priority"],
};

const PLAN_GRADIENTS: Record<string, string> = {
  basic: "from-primary/20 to-primary/5",
  advance: "from-secondary/20 to-secondary/5",
  business: "from-accent/20 to-accent/5",
  elite: "from-warning/20 to-warning/5",
};

export function PlansSection() {
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("investment_plans")
      .select("*")
      .eq("is_active", true)
      .order("min_amount")
      .then(({ data }) => {
        if (data) setPlans(data);
      });
  }, []);

  return (
    <section className="py-20 md:py-24" id="plans">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            AI Bot <span className="gradient-text">Plans</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto text-pretty">
            Choose a plan that fits your trading goals. No lock period, withdraw anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => {
            const Icon = PLAN_ICONS[plan.name] || Zap;
            const features = PLAN_FEATURES[plan.name] || [];
            const gradient = PLAN_GRADIENTS[plan.name] || "from-primary/20 to-primary/5";
            const isPopular = plan.name === "advance";

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`glass rounded-2xl p-5 md:p-6 relative group hover:border-primary/30 transition-all duration-300 ${
                  isPopular ? "ring-2 ring-secondary glow-primary sm:scale-[1.02]" : ""
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-primary text-xs font-bold text-primary-foreground whitespace-nowrap">
                    Most Popular
                  </div>
                )}

                <div className={`inline-flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${gradient} mb-3 md:mb-4`}>
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
                </div>

                <h3 className="font-display font-bold text-lg md:text-xl mb-1">{plan.display_name}</h3>
                <div className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                  ${Number(plan.min_amount).toLocaleString()} – ${Number(plan.max_amount).toLocaleString()}
                </div>

                <div className="mb-5 md:mb-6">
                  <span className="text-2xl md:text-3xl font-display font-bold gradient-text">
                    {Number(plan.daily_profit_min)}%–{Number(plan.daily_profit_max)}%
                  </span>
                  <span className="text-xs md:text-sm text-muted-foreground ml-1">/ day</span>
                </div>

                <ul className="space-y-2.5 md:space-y-3 mb-5 md:mb-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs md:text-sm">
                      <Check className="w-4 h-4 text-success shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${isPopular ? "gradient-primary text-primary-foreground" : ""}`}
                  variant={isPopular ? "default" : "outline"}
                  asChild
                >
                  <Link to="/register">Get Started</Link>
                </Button>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto px-2">
            ⚠️ <strong>Risk Disclaimer:</strong> Daily returns are variable based on market conditions. Past performance does not guarantee future results. Crypto trading carries high risk. No fixed income guarantee.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
