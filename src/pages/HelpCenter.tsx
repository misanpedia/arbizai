import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { HelpCircle, ArrowDownCircle, ArrowUpCircle, TrendingUp, Users, Shield, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const defaultFaqs = [
  { q: "How do I make a deposit?", a: "Go to the Deposit menu, select a network (BEP20/TRC20/ERC20), enter the amount, and transfer to the provided wallet address. Your deposit will be credited after admin confirmation." },
  { q: "What is the minimum deposit?", a: "The minimum deposit is $5 USDT." },
  { q: "How do I withdraw?", a: "Go to the Withdraw menu, enter the amount and your destination wallet address. Withdrawals are processed within 24-48 hours." },
  { q: "What is the $10 welcome bonus?", a: "Every new user receives a $10 bonus that cannot be withdrawn. This bonus can only be used to activate AI bot/investment. Profits from the investment can be withdrawn." },
  { q: "What is the principal withdrawal penalty?", a: "A penalty is applied when withdrawing principal deposit: <60 days (30%), 60 days (20%), 90 days (10%), 120 days (5%), 150+ days (2%). Profit/commission withdrawals only have a 5% fee." },
  { q: "How does the referral system work?", a: "You earn commission from your downline's daily profit: Level 1 (5%), Level 2 (3%), Level 3 (2%), Level 4 (1%), Level 5 (0.5%)." },
  { q: "What is ARBIZ Token?", a: "ARBIZ is a reward token given when you activate an AI bot. These tokens can be claimed on dates set by the admin." },
];

const categories = [
  { icon: ArrowDownCircle, label: "Deposit", color: "text-success" },
  { icon: ArrowUpCircle, label: "Withdrawal", color: "text-warning" },
  { icon: TrendingUp, label: "AI Bot", color: "text-primary" },
  { icon: Users, label: "Referral", color: "text-accent" },
  { icon: Shield, label: "Security", color: "text-secondary" },
  { icon: Coins, label: "ARBIZ", color: "text-primary" },
];

const HelpCenter = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container px-4 max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-display font-bold gradient-text mb-4">Help Center</h1>
            <p className="text-muted-foreground">Find answers to your questions here.</p>
          </motion.div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
            {categories.map((cat, i) => (
              <div key={i} className="glass-strong rounded-xl p-3 text-center">
                <cat.icon className={`w-6 h-6 mx-auto mb-1 ${cat.color}`} />
                <p className="text-xs font-medium text-foreground">{cat.label}</p>
              </div>
            ))}
          </div>

          <div className="glass-strong rounded-2xl p-6">
            <h3 className="font-display font-semibold text-foreground mb-4">Frequently Asked Questions</h3>
            <Accordion type="single" collapsible className="space-y-2">
              {defaultFaqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-border/30">
                  <AccordionTrigger className="text-sm text-foreground hover:text-primary">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default HelpCenter;