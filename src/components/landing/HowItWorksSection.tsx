import { motion } from "framer-motion";
import { ScanSearch, BarChart3, Cpu, Wallet } from "lucide-react";

const steps = [
  {
    icon: ScanSearch,
    title: "AI Scanner",
    description: "Our AI continuously scans 50+ crypto exchanges for price discrepancies in real-time.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: BarChart3,
    title: "Spread Detection",
    description: "Advanced algorithms identify profitable spreads between exchange pairs instantly.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: Cpu,
    title: "Auto Execution",
    description: "Trades are executed automatically within milliseconds to capture the spread.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Wallet,
    title: "Profit Distribution",
    description: "Profits are calculated daily and credited directly to your wallet balance.",
    color: "text-success",
    bg: "bg-success/10",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 relative" id="how-it-works">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            How <span className="gradient-text">AI Arbitrage</span> Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Four simple steps powered by cutting-edge artificial intelligence
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass rounded-2xl p-6 text-center relative group hover:border-primary/30 transition-colors"
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border" />
              )}
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${step.bg} mb-4`}>
                <step.icon className={`w-7 h-7 ${step.color}`} />
              </div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Step {i + 1}</div>
              <h3 className="font-display font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
