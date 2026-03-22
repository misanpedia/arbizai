import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const floatingCoins = [
  { symbol: "BTC", price: 67432.18, change: 2.4 },
  { symbol: "ETH", price: 3521.45, change: -0.8 },
  { symbol: "USDT", price: 1.0, change: 0.01 },
  { symbol: "SOL", price: 178.92, change: 5.2 },
  { symbol: "BNB", price: 612.33, change: 1.1 },
];

export function HeroSection() {
  const [coins, setCoins] = useState(floatingCoins);

  useEffect(() => {
    const interval = setInterval(() => {
      setCoins((prev) =>
        prev.map((coin) => ({
          ...coin,
          price: coin.price * (1 + (Math.random() - 0.5) * 0.002),
          change: coin.change + (Math.random() - 0.5) * 0.3,
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-secondary/10 blur-3xl animate-pulse-glow delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Floating ticker */}
      <div className="absolute top-20 left-0 right-0 overflow-hidden border-b border-border/30 bg-card/30 backdrop-blur-sm">
        <div className="flex animate-ticker">
          {[...coins, ...coins].map((coin, i) => (
            <div key={i} className="flex items-center gap-2 px-6 py-2 whitespace-nowrap">
              <span className="font-display font-semibold text-sm">{coin.symbol}</span>
              <span className="text-sm text-muted-foreground">${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={`text-xs font-medium ${coin.change >= 0 ? "text-success" : "text-destructive"}`}>
                {coin.change >= 0 ? "+" : ""}{coin.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="container relative z-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm font-medium mb-8">
              <Zap className="w-4 h-4 text-primary" />
              <span>AI-Powered Arbitrage Engine v2.0</span>
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-7xl font-display font-bold leading-tight mb-6"
          >
            <span className="text-balance">Smart Crypto Automation with</span>{" "}
            <span className="gradient-text">AI Arbitrage</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance"
          >
            Our AI engine scans 50+ exchanges in real-time, detects price spreads, and executes profitable arbitrage trades automatically. Start with as little as $5.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="gradient-primary text-primary-foreground px-8 py-6 text-lg font-semibold glow-primary hover:opacity-90 transition-opacity">
              Start Free Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg glass">
              Learn More
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto"
          >
            {[
              { label: "Total Volume", value: "$128M+", icon: TrendingUp },
              { label: "Active Traders", value: "24,500+", icon: Zap },
              { label: "Uptime", value: "99.97%", icon: Shield },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4">
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="font-display font-bold text-xl md:text-2xl">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
