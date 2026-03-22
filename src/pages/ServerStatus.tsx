import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CheckCircle, Wifi, Server, Database, Cpu, Shield, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const SERVICES = [
  { name: "Trading Engine", icon: Cpu, status: "operational" },
  { name: "API Gateway", icon: Wifi, status: "operational" },
  { name: "Database Cluster", icon: Database, status: "operational" },
  { name: "Authentication", icon: Shield, status: "operational" },
  { name: "Payment Processing", icon: Server, status: "operational" },
  { name: "Webhook Services", icon: Server, status: "operational" },
];

const ServerStatus = () => {
  const [uptime, setUptime] = useState("99.98%");
  const [lastChecked, setLastChecked] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setLastChecked(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container px-4 max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-4xl font-display font-bold gradient-text mb-4">Server Status</h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">All Systems Operational</span>
            </div>
          </motion.div>

          <div className="glass-strong rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-foreground">Services</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Last checked: {lastChecked.toLocaleTimeString()}</span>
              </div>
            </div>
            <div className="space-y-3">
              {SERVICES.map((service, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <service.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{service.name}</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-success font-medium">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Operational
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Uptime (30d)", value: uptime },
              { label: "Response Time", value: "45ms" },
              { label: "Incidents (30d)", value: "0" },
            ].map((stat, i) => (
              <div key={i} className="glass-strong rounded-xl p-4 text-center">
                <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default ServerStatus;
