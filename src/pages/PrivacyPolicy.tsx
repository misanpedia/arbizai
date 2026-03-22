import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";

const PrivacyPolicy = () => (
  <main className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16">
      <div className="container px-4 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-display font-bold gradient-text mb-8">Privacy Policy</h1>
          <div className="glass-strong rounded-2xl p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">1. Information We Collect</h2>
              <p>We collect personal information including name, email, phone number, and KYC documents. We also collect usage data, IP addresses, and device information for security purposes.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">2. How We Use Your Information</h2>
              <p>Your information is used to provide and improve our services, verify your identity, process transactions, communicate with you, and comply with legal obligations.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">3. Data Security</h2>
              <p>We implement industry-standard security measures including encryption, secure servers, and access controls. KYC documents are stored in encrypted storage with restricted access.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">4. Data Sharing</h2>
              <p>We do not sell your personal information. We may share data with law enforcement when required by law, and with service providers necessary for platform operation.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">5. Cookies</h2>
              <p>We use cookies and similar technologies to enhance your experience, analyze usage patterns, and maintain session security.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">6. Your Rights</h2>
              <p>You have the right to access, correct, or delete your personal information. Contact our support team to exercise these rights.</p>
            </section>
            <section>
              <h2 className="text-lg font-display font-bold text-foreground mb-3">7. Data Retention</h2>
              <p>We retain your data for as long as your account is active and as required by law. Transaction records are maintained for compliance purposes.</p>
            </section>
            <p className="text-xs text-muted-foreground/70 pt-4 border-t border-border/30">Last updated: February 2026</p>
          </div>
        </motion.div>
      </div>
    </div>
    <Footer />
  </main>
);

export default PrivacyPolicy;
