import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Clock, BookOpen, TrendingUp, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const coursesData: Record<string, {
  title: string; desc: string; icon: any; level: string; duration: string;
  overview: string;
  lessons: { title: string; content: string; duration: string }[];
}> = {
  "crypto-arbitrage-101": {
    title: "Crypto Arbitrage 101",
    desc: "Learn the basics of crypto arbitrage trading",
    icon: TrendingUp, level: "Beginner", duration: "~2 hours",
    overview: "This course covers the fundamentals of cryptocurrency arbitrage trading. You'll learn how price differences occur across exchanges, types of arbitrage strategies, and how to identify profitable opportunities.",
    lessons: [
      { title: "What is Crypto Arbitrage?", duration: "15 min", content: "Crypto arbitrage is the practice of buying cryptocurrency on one exchange where the price is lower and selling it on another where the price is higher. This price difference (spread) exists due to varying liquidity, trading volume, and regional demand across exchanges.\n\nKey concepts:\n• **Spread**: The price difference between buy and sell across exchanges\n• **Slippage**: Price change that occurs during transaction execution\n• **Latency**: Time delay in executing trades across platforms" },
      { title: "Types of Arbitrage", duration: "20 min", content: "There are several types of crypto arbitrage:\n\n1. **Spatial Arbitrage**: Buying on one exchange and selling on another\n2. **Triangular Arbitrage**: Exploiting price differences between three trading pairs on the same exchange (e.g., BTC→ETH→USDT→BTC)\n3. **Statistical Arbitrage**: Using mathematical models to identify temporary price inefficiencies\n4. **Cross-border Arbitrage**: Taking advantage of price differences in different countries (e.g., Kimchi Premium in South Korea)" },
      { title: "How Exchanges Work", duration: "15 min", content: "Understanding exchange mechanics is crucial:\n\n• **Order Book**: Lists of buy and sell orders at various prices\n• **Market Makers**: Provide liquidity by placing limit orders\n• **Trading Fees**: Each exchange charges different fees (0.05%–0.5%)\n• **Withdrawal Fees**: Network fees when transferring between exchanges\n\nArbiz AI scans 20+ exchanges simultaneously to find the best opportunities." },
      { title: "Understanding Trading Pairs", duration: "15 min", content: "A trading pair represents two currencies that can be traded against each other:\n\n• **Base Currency**: The currency being bought (e.g., BTC in BTC/USDT)\n• **Quote Currency**: The currency used to buy (e.g., USDT in BTC/USDT)\n• **Pair Liquidity**: Higher liquidity means tighter spreads and easier execution\n\nArbiz AI monitors thousands of trading pairs to find the highest profit margins." },
      { title: "Calculating Profit & Fees", duration: "20 min", content: "To determine actual profit from arbitrage:\n\n**Formula**: Net Profit = (Sell Price - Buy Price) × Amount - Trading Fees - Withdrawal Fees - Network Fees\n\n**Example**:\n• Buy 1 BTC at $60,000 on Exchange A\n• Sell 1 BTC at $60,150 on Exchange B\n• Gross Profit: $150\n• Trading Fees (~0.2%): $120 × 2 = $240... Wait!\n• This is why automated systems like Arbiz AI are essential — they calculate all fees instantly and only execute when profitable." },
      { title: "Market Volatility & Timing", duration: "15 min", content: "Arbitrage opportunities are closely tied to market conditions:\n\n• **High Volatility** = More price discrepancies = More opportunities\n• **Low Volatility** = Smaller spreads = Fewer opportunities\n• **News Events**: Major announcements create temporary price dislocations\n• **Network Congestion**: Slow blockchain confirmations can affect spatial arbitrage\n\nArbiz AI adapts its strategy based on real-time market conditions." },
      { title: "Common Risks in Arbitrage", duration: "15 min", content: "Understanding risks helps you make informed decisions:\n\n1. **Execution Risk**: Price may change before trade completes\n2. **Transfer Risk**: Blockchain delays can eliminate profit window\n3. **Liquidity Risk**: Not enough volume to execute at desired price\n4. **Regulatory Risk**: Some exchanges have regional restrictions\n5. **Counter-party Risk**: Exchange insolvency or withdrawal freezes\n\nArbiz AI mitigates these risks through advanced algorithms and risk management protocols." },
      { title: "Getting Started with Arbiz AI", duration: "10 min", content: "Now that you understand the basics, here's how to start:\n\n1. **Deposit USDT**: Minimum $5 to start\n2. **Activate AI Bot**: Choose an investment plan that suits your budget\n3. **Earn Daily Profits**: The AI bot works 24/7 to find and execute arbitrage trades\n4. **Withdraw Profits**: Request withdrawals anytime, processed within 24-48 hours\n5. **Build Your Team**: Invite friends and earn referral commissions up to 10 levels\n\nWelcome to the world of automated crypto arbitrage!" },
    ],
  },
  "risk-management": {
    title: "Risk Management",
    desc: "Strategies to protect your investments",
    icon: Shield, level: "Intermediate", duration: "~1.5 hours",
    overview: "Learn essential risk management strategies for crypto investments. This course teaches you how to protect your capital, understand withdrawal policies, and make informed investment decisions.",
    lessons: [
      { title: "Why Risk Management Matters", duration: "15 min", content: "Risk management is the cornerstone of successful investing:\n\n• **Capital Preservation**: Your primary goal should be protecting your principal\n• **Consistent Returns**: Small, steady profits compound into significant gains over time\n• **Emotional Control**: Having a plan prevents panic-driven decisions\n\nAt Arbiz AI, our bot is designed with multiple risk management layers to protect your investment." },
      { title: "Understanding Investment Plans", duration: "20 min", content: "Arbiz AI offers different investment tiers:\n\n• **Basic Plan**: Lower risk, suitable for beginners, smaller investment amounts\n• **Advance Plan**: Moderate risk, balanced returns\n• **Business Plan**: Higher potential returns with larger capital\n• **Elite Plan**: Premium tier for serious investors\n\nEach plan has its own daily profit range. Always invest only what you can afford to hold for the long term." },
      { title: "Diversification Strategies", duration: "15 min", content: "Don't put all eggs in one basket:\n\n1. **Multiple Bots**: Activate several bots across different plans\n2. **Gradual Investment**: Start small and increase as you gain confidence\n3. **Profit Separation**: Regularly withdraw profits while keeping principal working\n4. **Time Diversification**: Invest at different times to average out market conditions\n\nDiversification reduces the impact of any single negative event." },
      { title: "Withdrawal Timing & Penalties", duration: "20 min", content: "Understanding withdrawal policies helps you plan:\n\n**Principal Withdrawal Penalty Schedule**:\n• < 60 days: 30% penalty\n• 60 days: 20% penalty\n• 90 days: 10% penalty\n• 120 days: 5% penalty\n• 150+ days: 2% penalty\n\n**Profit Withdrawals**: Only 5% fee\n\n**Strategy**: Keep your principal invested for 150+ days to minimize penalties, and withdraw profits regularly." },
      { title: "Setting Realistic Expectations", duration: "15 min", content: "Key principles for long-term success:\n\n• **Compound Effect**: Daily profits reinvested grow exponentially\n• **Patience Pays**: Longer investment periods yield better net returns\n• **Market Cycles**: Returns vary with market conditions — this is normal\n• **No Guarantees**: Past performance doesn't guarantee future results\n\nUse our Profit Calculator tool to estimate returns based on different scenarios." },
      { title: "Security as Risk Management", duration: "10 min", content: "Protecting your account is part of risk management:\n\n1. **Strong Password**: Use unique, complex passwords\n2. **KYC Verification**: Complete verification for higher withdrawal limits\n3. **Secure Email**: Protect the email linked to your account\n4. **Regular Monitoring**: Check your dashboard and profit history regularly\n5. **Official Channels**: Only access Arbiz AI through official links\n\nYour security is our priority." },
    ],
  },
  "ai-trading-bots": {
    title: "AI Trading Bots",
    desc: "How AI-powered bots optimize your trades",
    icon: Zap, level: "Beginner", duration: "~1 hour",
    overview: "Discover how Arbiz AI's trading bots leverage artificial intelligence and machine learning to execute profitable arbitrage trades automatically. Learn the technology behind our system.",
    lessons: [
      { title: "What are AI Trading Bots?", duration: "15 min", content: "AI trading bots are automated software programs that:\n\n• **Scan Markets 24/7**: Monitor prices across multiple exchanges continuously\n• **Analyze Data**: Process thousands of data points per second\n• **Execute Trades**: Automatically place buy and sell orders when profitable opportunities are found\n• **Learn & Adapt**: Use machine learning to improve strategy over time\n\nArbiz AI's quantum-powered engine is designed to find the best arbitrage opportunities in real-time." },
      { title: "How Arbiz AI Bot Works", duration: "20 min", content: "Our bot operates in a continuous cycle:\n\n1. **Data Collection**: Scans order books across 20+ exchanges\n2. **Price Analysis**: Identifies price discrepancies in real-time\n3. **Risk Assessment**: Evaluates fees, slippage, and execution probability\n4. **Trade Execution**: Places simultaneous buy/sell orders when profitable\n5. **Profit Distribution**: Credits daily profits to your wallet\n\nAll of this happens automatically — you simply activate your bot and earn." },
      { title: "Activating Your First Bot", duration: "15 min", content: "Getting started is simple:\n\n1. Go to **AI Bot** page from the navigation\n2. Choose an investment plan (Basic, Advance, Business, or Elite)\n3. Enter the amount you want to invest\n4. Confirm the activation\n5. Your bot starts working immediately!\n\n**Note**: You can use your $10 welcome bonus to activate your first bot. Profits from the bonus investment can be withdrawn." },
      { title: "Understanding Daily Profits", duration: "15 min", content: "How your daily profits are calculated:\n\n• Each plan has a daily profit range (e.g., 0.5% - 1.5%)\n• The actual rate depends on market conditions and opportunities found\n• Profits are credited to your wallet daily\n• You can view detailed profit history in the **Profit History** page\n• Enable **Auto-Compound** to automatically reinvest profits for accelerated growth\n\n**Market Volatility Factor**: Higher market activity generally means higher profits." },
      { title: "Auto-Compound Feature", duration: "10 min", content: "Auto-compound automatically reinvests your daily profits:\n\n**Without Auto-Compound**:\n$1,000 × 1% daily = $10/day = $300/month\n\n**With Auto-Compound**:\n$1,000 → $1,010 → $1,020.10 → ... = ~$348/month\n\nThe difference compounds significantly over longer periods. You can toggle auto-compound on/off from your investment settings." },
    ],
  },
  "advanced-strategies": {
    title: "Advanced Strategies",
    desc: "Multi-exchange arbitrage techniques",
    icon: BookOpen, level: "Advanced", duration: "~3 hours",
    overview: "For experienced investors looking to maximize returns. Learn about multi-exchange strategies, team building for referral income, ARBIZ token mechanics, and how to optimize your overall Arbiz AI experience.",
    lessons: [
      { title: "Multi-Exchange Arbitrage", duration: "20 min", content: "Advanced arbitrage spans multiple exchanges simultaneously:\n\n• **Parallel Execution**: Place orders on 3+ exchanges at once\n• **Flash Arbitrage**: Ultra-fast trades during price spikes\n• **DEX-CEX Arbitrage**: Exploit price differences between decentralized and centralized exchanges\n• **Futures-Spot Arbitrage**: Trade between spot and futures markets\n\nArbiz AI's engine handles all these strategies automatically based on market conditions." },
      { title: "Building a Referral Network", duration: "25 min", content: "Maximize your earnings through team building:\n\n**Commission Structure (10 Levels)**:\n• Level 1: 5% of downline's daily profit\n• Level 2: 3%\n• Level 3: 2%\n• Level 4: 1%\n• Level 5: 0.5%\n• Levels 6-10: 0.1% - 0.5%\n\n**Tips**:\n1. Share your referral code on social media\n2. Create educational content about arbitrage\n3. Help your team members get started\n4. Build depth, not just width — deeper teams earn more commissions" },
      { title: "Understanding ARBIZ Token", duration: "20 min", content: "ARBIZ is our internal reward token:\n\n• **Earning**: You receive ARBIZ tokens when activating an AI bot\n• **Rate**: $0.1 per ARBIZ token\n• **Claiming**: Tokens can be claimed on dates set by the admin\n• **Purpose**: Reward loyal investors and active community members\n\nCheck the **ARBIZ Token** page in your dashboard to view your balance and claim schedule." },
      { title: "Rank System & Benefits", duration: "20 min", content: "Progress through ranks for additional perks:\n\n• **Bronze**: Default rank for all members\n• **Silver**: Achieved with growing team and investments\n• **Gold**: Access to enhanced features\n• **Platinum**: Priority support and exclusive opportunities\n• **Diamond**: Top-tier rank with maximum benefits\n\nRank is determined by your team performance and personal investment. Check your progress on the **Rank** page." },
      { title: "Maximizing Daily Check-in", duration: "15 min", content: "Don't forget your daily check-in rewards:\n\n• Visit the **Daily Check-in** page every day\n• Build consecutive day streaks for bigger rewards\n• Rewards are credited directly to your wallet\n• Missing a day resets your streak\n\n**Tip**: Set a daily reminder to maintain your streak!" },
      { title: "Spin Wheel Strategies", duration: "10 min", content: "Make the most of the Spin Wheel:\n\n• You get daily spins based on your activity\n• Prizes include USDT bonuses and ARBIZ tokens\n• Higher-value prizes have lower probability\n• Spin daily to accumulate rewards over time\n\nEvery spin counts — small rewards add up significantly over weeks and months." },
      { title: "Using the Profit Calculator", duration: "15 min", content: "Plan your investments wisely using our calculator:\n\n1. Go to **Profit Calculator** from the menu\n2. Enter your investment amount\n3. Select the plan and expected daily rate\n4. View projected earnings over 30, 90, and 180 days\n5. Compare with and without auto-compound\n\nThis tool helps you set realistic expectations and choose the right investment strategy." },
      { title: "Transfer & Internal Wallet", duration: "15 min", content: "Moving funds within Arbiz AI:\n\n• **Internal Transfer**: Send USDT to another Arbiz AI member instantly\n• **No Fees**: Internal transfers are free\n• **Recipient Code**: Use the member's referral code to transfer\n\n**Use Cases**:\n• Help team members get started\n• Consolidate funds between accounts\n• Gift bonuses to active team members" },
      { title: "Security Best Practices", duration: "15 min", content: "Advanced security measures:\n\n1. **Unique Password**: Don't reuse passwords from other platforms\n2. **Email Security**: Enable 2FA on your email account\n3. **Phishing Awareness**: Only access arbizai.com directly — never through links in messages\n4. **Regular Checks**: Monitor your transaction history for unauthorized activity\n5. **KYC Completion**: Complete KYC for identity protection and higher limits\n6. **Trusted Devices**: Only log in from your personal devices" },
      { title: "Long-term Investment Strategy", duration: "20 min", content: "Building wealth with Arbiz AI over time:\n\n1. **Start Small**: Begin with the minimum and understand the system\n2. **Reinvest Profits**: Use auto-compound for the first 3-6 months\n3. **Build Your Team**: Passive referral income compounds your returns\n4. **Diversify Plans**: Spread investment across multiple bots/plans\n5. **Minimize Penalties**: Keep principal for 150+ days (only 2% withdrawal fee)\n6. **Stay Informed**: Follow announcements for updates and opportunities\n\nConsistency and patience are the keys to maximizing your returns." },
    ],
  },
};

const CourseDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const course = coursesData[slug || ""];

  if (!course) {
    return (
      <DashboardLayout title="Course Not Found">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">This course doesn't exist.</p>
          <Button onClick={() => navigate("/education")} variant="outline">Back to Education</Button>
        </div>
      </DashboardLayout>
    );
  }

  const Icon = course.icon;

  return (
    <DashboardLayout title={course.title}>
      <div className="max-w-lg mx-auto space-y-5">
        <Button variant="ghost" size="sm" onClick={() => navigate("/education")} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Education
        </Button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-foreground">{course.title}</h2>
              <p className="text-xs text-muted-foreground">{course.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">{course.level}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration}</span>
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.lessons.length} lessons</span>
          </div>
        </motion.div>

        <div className="glass-strong rounded-2xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-2">Overview</h3>
          <p className="text-sm text-muted-foreground">{course.overview}</p>
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-3">Lessons</h3>
          <Accordion type="single" collapsible className="space-y-1">
            {course.lessons.map((lesson, i) => (
              <AccordionItem key={i} value={`lesson-${i}`} className="border-border/30">
                <AccordionTrigger className="text-sm text-foreground hover:text-primary py-3">
                  <div className="flex items-center gap-2 text-left">
                    <CheckCircle className="w-4 h-4 text-primary/40 shrink-0" />
                    <span>{lesson.title}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto mr-2">{lesson.duration}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground whitespace-pre-line pl-6">
                  {lesson.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseDetail;
