import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, ArrowDownRight, Zap } from "lucide-react";

interface Trade {
  id: number;
  pair: string;
  buyExchange: string;
  sellExchange: string;
  spread: number;
  profit: number;
  status: "executed" | "scanning" | "pending";
  timestamp: Date;
}

const cexExchanges = ["Binance", "Bybit", "OKX", "Coinbase", "Kraken", "KuCoin", "Gate.io", "Huobi"];
const dexExchanges = ["Uniswap", "PancakeSwap", "SushiSwap", "Raydium", "Jupiter", "dYdX", "Curve", "1inch"];
const exchanges = [...cexExchanges, ...dexExchanges];
const pairs = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", "ADA/USDT", "DOGE/USDT", "AVAX/USDT", "MATIC/USDT", "ARB/USDT"];

function generateTrade(id: number): Trade {
  const buyIdx = Math.floor(Math.random() * exchanges.length);
  let sellIdx = Math.floor(Math.random() * exchanges.length);
  while (sellIdx === buyIdx) sellIdx = Math.floor(Math.random() * exchanges.length);

  return {
    id,
    pair: pairs[Math.floor(Math.random() * pairs.length)],
    buyExchange: exchanges[buyIdx],
    sellExchange: exchanges[sellIdx],
    spread: 0.1 + Math.random() * 2.5,
    profit: 5 + Math.random() * 500,
    status: ["executed", "scanning", "pending"][Math.floor(Math.random() * 3)] as Trade["status"],
    timestamp: new Date(),
  };
}

export function LiveFeedSection() {
  const [trades, setTrades] = useState<Trade[]>(() => Array.from({ length: 8 }, (_, i) => generateTrade(i)));

  useEffect(() => {
    const interval = setInterval(() => {
      setTrades((prev) => {
        const newTrade = generateTrade(Date.now());
        return [newTrade, ...prev.slice(0, 7)];
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />
      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-sm mb-4">
            <Activity className="w-4 h-4 text-success" />
            <span>Live Activity</span>
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Real-Time <span className="gradient-text">Arbitrage Feed</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Watch our AI engine detect and execute cross-exchange opportunities
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto glass-strong rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary animate-pulse-glow" />
              <span className="text-sm font-medium text-foreground">AI Scanner</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-success font-medium">Online</span>
            </div>
          </div>

          {/* Table Header - hidden on small screens, use card layout instead */}
          <div className="hidden md:grid md:grid-cols-6 gap-2 px-4 py-2.5 border-b border-border/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Pair</span>
            <span>Buy</span>
            <span>Sell</span>
            <span className="text-right">Spread</span>
            <span className="text-right">Profit</span>
            <span className="text-right">Status</span>
          </div>

          {/* Desktop Table Rows */}
          <div className="hidden md:block divide-y divide-border/20">
            {trades.map((trade, i) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="grid grid-cols-6 gap-2 px-4 py-3 text-sm hover:bg-muted/20 transition-colors"
              >
                <span className="font-bold font-display text-foreground">{trade.pair}</span>
                <span className="text-muted-foreground">{trade.buyExchange}</span>
                <span className="text-muted-foreground">{trade.sellExchange}</span>
                <span className="text-right font-mono font-semibold">
                  {trade.spread >= 1 ? (
                    <span className="text-success flex items-center justify-end gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      {trade.spread.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-warning flex items-center justify-end gap-1">
                      <ArrowDownRight className="w-3 h-3" />
                      {trade.spread.toFixed(2)}%
                    </span>
                  )}
                </span>
                <span className="text-right font-mono font-semibold text-success">${trade.profit.toFixed(2)}</span>
                <span className="text-right">
                  <StatusBadge status={trade.status} />
                </span>
              </motion.div>
            ))}
          </div>

          {/* Mobile Card Rows */}
          <div className="md:hidden divide-y divide-border/20">
            {trades.map((trade, i) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="px-4 py-3 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold font-display text-foreground text-sm">{trade.pair}</span>
                  <StatusBadge status={trade.status} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {trade.buyExchange} → {trade.sellExchange}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold">
                      {trade.spread >= 1 ? (
                        <span className="text-success flex items-center gap-0.5">
                          <ArrowUpRight className="w-3 h-3" />
                          {trade.spread.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-warning flex items-center gap-0.5">
                          <ArrowDownRight className="w-3 h-3" />
                          {trade.spread.toFixed(2)}%
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-semibold text-success">${trade.profit.toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: Trade["status"] }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
      status === "executed" ? "bg-success/15 text-success" :
      status === "scanning" ? "bg-primary/15 text-primary" :
      "bg-warning/15 text-warning"
    }`}>
      {status === "scanning" && <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {status}
    </span>
  );
}
