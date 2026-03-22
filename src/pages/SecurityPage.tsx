import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Shield, Lock, Key, Eye, Server, FileCheck } from "lucide-react";
import { motion } from "framer-motion";

const SecurityPage = () => (
  <main className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16">
      <div className="container px-4 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-display font-bold gradient-text mb-4">Security</h1>
          <p className="text-muted-foreground">Your asset security is our top priority.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: Lock, title: "End-to-End Encryption", desc: "All data and communications are encrypted using industry-standard AES-256 and TLS 1.3." },
            { icon: Key, title: "Two-Factor Authentication", desc: "An additional layer of security to protect your account from unauthorized access." },
            { icon: Eye, title: "24/7 Monitoring", desc: "Our security team monitors the platform around the clock to detect and prevent threats." },
            { icon: Server, title: "Cold Storage", desc: "The majority of digital assets are stored in cold storage disconnected from the internet." },
            { icon: FileCheck, title: "KYC/AML Compliance", desc: "Strict identity verification to prevent fraud and money laundering." },
            { icon: Shield, title: "DDoS Protection", desc: "Multi-layer protection against DDoS attacks to ensure service availability." },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-strong rounded-2xl p-6">
              <item.icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-display font-bold text-lg text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
    <Footer />
  </main>
);

export default SecurityPage;