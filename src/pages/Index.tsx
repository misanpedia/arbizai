import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { LiveFeedSection } from "@/components/landing/LiveFeedSection";
import { PlansSection } from "@/components/landing/PlansSection";
import { ReferralSection } from "@/components/landing/ReferralSection";
import { RankSection } from "@/components/landing/RankSection";
import { TokenSection } from "@/components/landing/TokenSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { FAQSection } from "@/components/landing/FAQSection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <LiveFeedSection />
      <PlansSection />
      <ReferralSection />
      <RankSection />
      <TokenSection />
      <SecuritySection />
      <FAQSection />
      <Footer />
    </main>
  );
};

export default Index;
