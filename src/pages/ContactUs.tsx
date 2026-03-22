import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Mail, MessageSquare, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const ContactUs = () => {
  const [contactInfo, setContactInfo] = useState({
    support_email: "support@arbizai.com",
    business_email: "business@arbizai.com",
    telegram: "@ArbizAISupport",
    address: "Singapore",
    working_hours: "24/7 Support",
  });

  useEffect(() => {
    supabase.from("system_settings").select("key, value").in("key", [
      "support_email", "business_email", "telegram_support", "company_address", "working_hours"
    ]).then(({ data }) => {
      if (data) {
        const mapped: any = { ...contactInfo };
        data.forEach(s => {
          const val = String(s.value).replace(/"/g, "");
          if (s.key === "support_email" && val) mapped.support_email = val;
          if (s.key === "business_email" && val) mapped.business_email = val;
          if (s.key === "telegram_support" && val) mapped.telegram = val;
          if (s.key === "company_address" && val) mapped.address = val;
          if (s.key === "working_hours" && val) mapped.working_hours = val;
        });
        setContactInfo(mapped);
      }
    });
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container px-4 max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-display font-bold gradient-text mb-4">Contact Us</h1>
            <p className="text-muted-foreground">Reach out to us anytime. Our support team is ready to help you.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Mail, title: "Email Support", value: contactInfo.support_email, desc: "For general inquiries and technical support" },
              { icon: Mail, title: "Business Inquiry", value: contactInfo.business_email, desc: "For partnerships and collaborations" },
              { icon: MessageSquare, title: "Telegram", value: contactInfo.telegram, desc: "Fast response via Telegram" },
              { icon: MapPin, title: "Location", value: contactInfo.address, desc: "Our headquarters" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-strong rounded-2xl p-6">
                <item.icon className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-display font-bold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-primary font-medium mb-1">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass-strong rounded-2xl p-6 mt-6 text-center">
            <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
            <h3 className="font-display font-bold text-foreground mb-1">Operating Hours</h3>
            <p className="text-sm text-muted-foreground">{contactInfo.working_hours}</p>
          </motion.div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default ContactUs;