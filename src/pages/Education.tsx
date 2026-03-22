import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { BookOpen, TrendingUp, Shield, Zap, Play, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const courses = [
  { title: "Crypto Arbitrage 101", desc: "Learn the basics of crypto arbitrage trading", icon: TrendingUp, level: "Beginner", lessons: 8, slug: "crypto-arbitrage-101" },
  { title: "Risk Management", desc: "Strategies to protect your investments", icon: Shield, level: "Intermediate", lessons: 6, slug: "risk-management" },
  { title: "AI Trading Bots", desc: "How AI-powered bots optimize your trades", icon: Zap, level: "Beginner", lessons: 5, slug: "ai-trading-bots" },
  { title: "Advanced Strategies", desc: "Multi-exchange arbitrage techniques", icon: BookOpen, level: "Advanced", lessons: 10, slug: "advanced-strategies" },
];

const articles = [
  { title: "What is Crypto Arbitrage?", excerpt: "Understanding price differences across exchanges and how to profit from them.", slug: "what-is-crypto-arbitrage" },
  { title: "How Arbiz AI Works", excerpt: "Our quantum AI engine scans thousands of trading pairs across 20+ exchanges.", slug: "how-arbiz-ai-works" },
  { title: "Understanding Daily Profits", excerpt: "How your investment generates daily returns through automated arbitrage.", slug: "understanding-daily-profits" },
  { title: "Referral Program Guide", excerpt: "Maximize your earnings by building your referral network.", slug: "referral-program-guide" },
  { title: "Security Best Practices", excerpt: "Keep your account safe with these essential security tips.", slug: "security-best-practices" },
];

const Education = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Education Center">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Courses */}
        <div>
          <h3 className="font-display font-semibold text-foreground mb-3">Featured Courses</h3>
          <div className="grid grid-cols-2 gap-3">
            {courses.map((course, i) => (
              <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                onClick={() => navigate(`/education/course/${course.slug}`)}
                className="glass-strong rounded-2xl p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <course.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{course.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{course.desc}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{course.level}</span>
                  <span className="text-[10px] text-muted-foreground">{course.lessons} lessons</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Articles */}
        <div>
          <h3 className="font-display font-semibold text-foreground mb-3">Knowledge Base</h3>
          <div className="space-y-2">
            {articles.map((article, i) => (
              <motion.div key={i} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.05 }}
                onClick={() => navigate(`/education/article/${article.slug}`)}
                className="glass-strong rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{article.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{article.excerpt}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-3" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Video Section */}
        <div className="glass-strong rounded-2xl p-5 space-y-3">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Play className="w-4 h-4 text-primary" /> Video Tutorials
          </h3>
          <p className="text-sm text-muted-foreground">Video tutorials coming soon. Stay tuned!</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Education;
