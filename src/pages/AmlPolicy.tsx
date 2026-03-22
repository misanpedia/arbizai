import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";

const AmlPolicy = () => (
  <main className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16">
      <div className="container px-4 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-display font-bold gradient-text mb-8">Anti-Money Laundering Policy</h1>
          <div className="glass-strong rounded-2xl p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">1. Introduction</h2>
              <p>Arbiz AI is committed to preventing money laundering and terrorist financing. This AML Policy outlines our procedures and controls to detect, prevent, and report suspicious activities.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">2. Know Your Customer (KYC)</h2>
              <p>All users must complete KYC verification before withdrawals. Required documents include government-issued ID and proof of address. We verify the identity of all users to prevent fraud and illegal activities.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">3. Transaction Monitoring</h2>
              <p>We monitor all transactions for suspicious patterns including unusual transaction sizes, rapid movement of funds, and structuring to avoid reporting thresholds. Our system flags transactions that deviate from established patterns.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">4. Suspicious Activity Reporting</h2>
              <p>When suspicious activity is identified, we file reports with the relevant authorities. We maintain records of all transactions and KYC documents for the required retention period.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">5. Prohibited Jurisdictions</h2>
              <p>We do not provide services to users in jurisdictions where cryptocurrency services are prohibited. Users must confirm their jurisdiction during registration.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">6. Employee Training</h2>
              <p>All employees receive regular training on AML procedures, including recognizing and reporting suspicious activities.</p>
            </section>
            <p className="text-xs text-muted-foreground/70 pt-4 border-t border-border/30">Last updated: February 2026</p>
          </div>
        </motion.div>
      </div>
    </div>
    <Footer />
  </main>
);

export default AmlPolicy;
