import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Shield, Cpu, Users, Globe, Target, Award } from "lucide-react";
import { motion } from "framer-motion";

const AboutUs = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container px-4 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-display font-bold gradient-text mb-4">About Arbiz AI</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              An AI-powered crypto arbitrage investment platform designed to maximize your trading opportunities across global exchanges.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              { icon: Cpu, title: "AI-Powered Trading", desc: "Our AI engine analyzes thousands of arbitrage opportunities every second across global crypto exchanges." },
              { icon: Shield, title: "Guaranteed Security", desc: "Multi-layered security system with end-to-end encryption and cold storage for your digital assets." },
              { icon: Users, title: "Global Community", desc: "Join thousands of investors worldwide who have entrusted their investments with us." },
              { icon: Globe, title: "Multi-Exchange", desc: "Integrated with dozens of leading crypto exchanges to maximize arbitrage opportunities." },
              { icon: Target, title: "Consistent Profit", desc: "Our algorithm is designed to generate consistent daily profit from price differences across exchanges." },
              { icon: Award, title: "Referral Program", desc: "A 5-level referral system with attractive commissions for every member you invite." },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-strong rounded-2xl p-6">
                <item.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-display font-bold text-lg text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="glass-strong rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">Our Mission</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Making crypto investment easier, safer, and more profitable for everyone. 
              We are committed to continuously developing cutting-edge AI technology that provides 
              a competitive advantage for our investors.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default AboutUs;