import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "How does AI arbitrage trading work?",
    a: "Our AI engine simultaneously monitors price differences across 50+ cryptocurrency exchanges. When a profitable spread is detected, the system executes trades automatically to capture the price difference. This is known as arbitrage trading.",
  },
  {
    q: "What is the minimum investment amount?",
    a: "You can start investing with as little as $10 on our Spatial Arbitrage plan. Higher-tier plans offer greater daily return ranges.",
  },
  {
    q: "Are my funds safe?",
    a: "We implement enterprise-grade security including cold wallet storage for 95% of funds, 2FA authentication, KYC verification, and real-time AI risk monitoring.",
  },
  {
    q: "Can I withdraw anytime?",
    a: "Yes, there is no lock period. You can withdraw your capital anytime. A 5% withdrawal fee applies, and early principal withdrawal incurs a 10% penalty.",
  },
  {
    q: "How are daily profits calculated?",
    a: "Daily profits are calculated based on market conditions including volatility index, spread volume, and liquidity scores. Returns are variable and fall within your plan's daily range.",
  },
  {
    q: "Is there a guaranteed fixed income?",
    a: "No. Cryptocurrency markets are highly volatile. Daily returns fluctuate based on actual market conditions. We do not guarantee any fixed income. Past performance does not guarantee future results.",
  },
];

export function FAQSection() {
  return (
    <section className="py-24" id="faq">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="glass rounded-xl px-6 border-none">
                <AccordionTrigger className="text-left font-display font-semibold hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
