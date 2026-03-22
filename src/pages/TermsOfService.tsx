import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";

const TermsOfService = () => (
  <main className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16">
      <div className="container px-4 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-display font-bold gradient-text mb-8">Terms of Service</h1>
          <div className="glass-strong rounded-2xl p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using Arbiz AI platform, you agree to be bound by these Terms of Service. If you do not agree, you may not use our services.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">2. Eligibility</h2>
              <p>You must be at least 18 years old and legally permitted to use cryptocurrency services in your jurisdiction. You are responsible for ensuring compliance with local laws.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">3. Account Responsibilities</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to immediately notify us of any unauthorized access to your account.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">4. Investment Risks</h2>
              <p>Cryptocurrency investments carry significant risk. Daily returns are variable and depend on market conditions. There is no guarantee of fixed income. Past performance does not predict future results. You may lose part or all of your invested capital.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">5. Fees and Penalties</h2>
              <p>A 5% withdrawal fee applies to profit and commission withdrawals. Principal withdrawals are subject to early withdrawal penalties based on deposit duration (30%-2%). Welcome bonus of $10 is non-withdrawable and can only be used for bot activation.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">6. Prohibited Activities</h2>
              <p>Users may not use the platform for money laundering, terrorist financing, fraud, or any other illegal activity. We reserve the right to suspend or terminate accounts engaged in prohibited activities.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">7. Limitation of Liability</h2>
              <p>Arbiz AI shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services, including but not limited to losses from market fluctuations.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">8. Modifications</h2>
              <p>We reserve the right to modify these terms at any time. Changes will be effective upon posting. Continued use of the platform constitutes acceptance of the modified terms.</p>
            </section>
            <p className="text-xs text-muted-foreground/70 pt-4 border-t border-border/30">Last updated: February 2026</p>
          </div>
        </motion.div>
      </div>
    </div>
    <Footer />
  </main>
);

export default TermsOfService;
