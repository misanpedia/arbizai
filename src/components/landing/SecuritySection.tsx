import { motion } from "framer-motion";
import { Shield, Lock, Fingerprint, Server, Eye, AlertTriangle } from "lucide-react";

const features = [
  { icon: Lock, title: "Cold Wallet Storage", desc: "95% of funds stored in offline cold wallets for maximum security." },
  { icon: Fingerprint, title: "2FA Authentication", desc: "Google Authenticator and SMS OTP for every sensitive action." },
  { icon: Shield, title: "AI Risk Engine", desc: "Real-time threat detection and automated fraud prevention." },
  { icon: Server, title: "DDoS Protection", desc: "Enterprise-grade infrastructure with multi-layer protection." },
  { icon: Eye, title: "KYC Verification", desc: "Identity verification to ensure platform integrity." },
  { icon: AlertTriangle, title: "AML Compliance", desc: "Anti-money laundering monitoring on all transactions." },
];

export function SecuritySection() {
  return (
    <section className="py-24 relative" id="security">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Enterprise-Grade <span className="gradient-text">Security</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Your funds and data are protected by military-grade encryption and multi-layer security protocols.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 hover:border-primary/30 transition-colors group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <feat.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{feat.title}</h3>
              <p className="text-sm text-muted-foreground">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
