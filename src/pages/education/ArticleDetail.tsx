import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const articlesData: Record<string, { title: string; content: string }> = {
  "what-is-crypto-arbitrage": {
    title: "What is Crypto Arbitrage?",
    content: `## Understanding Crypto Arbitrage

Crypto arbitrage is a trading strategy that exploits price differences for the same cryptocurrency across different exchanges. Because crypto markets are decentralized and operate 24/7, price discrepancies occur frequently.

### How It Works

When Bitcoin is priced at $60,000 on Exchange A and $60,150 on Exchange B, an arbitrage trader can:
1. Buy 1 BTC on Exchange A for $60,000
2. Sell 1 BTC on Exchange B for $60,150
3. Pocket the $150 difference (minus fees)

### Why Do Price Differences Exist?

- **Liquidity Variations**: Different exchanges have different amounts of trading volume
- **Regional Demand**: Some regions have higher demand for certain cryptocurrencies
- **Transfer Delays**: Blockchain network speeds affect price convergence
- **Market Inefficiency**: Not all traders have access to real-time data across all exchanges

### Types of Crypto Arbitrage

**1. Spatial Arbitrage**
The most common form — buying on one exchange and selling on another. Simple in concept but requires fast execution and careful fee calculation.

**2. Triangular Arbitrage**
Exploiting price differences between three trading pairs on the same exchange. For example: USDT → BTC → ETH → USDT, where the final USDT amount is higher than the starting amount.

**3. Statistical Arbitrage**
Using mathematical models and historical data to predict temporary price deviations and trade accordingly.

### Why Automation is Essential

Manual arbitrage is nearly impossible in today's fast-moving crypto markets:
- Price differences last only seconds
- You need to monitor dozens of exchanges simultaneously
- Fee calculations must be instant and accurate
- Execution must be simultaneous across exchanges

This is why Arbiz AI uses advanced AI algorithms to automate the entire process, scanning thousands of trading pairs across 20+ exchanges every second.

### Getting Started

With Arbiz AI, you don't need any trading experience. Simply:
1. Deposit USDT into your wallet
2. Activate an AI Bot
3. Receive daily profits automatically

Our system handles all the complexity while you enjoy the returns.`,
  },
  "how-arbiz-ai-works": {
    title: "How Arbiz AI Works",
    content: `## The Technology Behind Arbiz AI

Arbiz AI leverages cutting-edge artificial intelligence and quantum computing concepts to execute profitable arbitrage trades across the cryptocurrency market.

### Our AI Engine

At the core of Arbiz AI is our proprietary trading engine that:
- **Scans 20+ exchanges** in real-time
- **Analyzes thousands of trading pairs** simultaneously
- **Processes millions of data points** per second
- **Executes trades in milliseconds** when opportunities arise

### The Trading Process

**Step 1: Data Collection**
Our system connects to exchange APIs to receive real-time order book data, trade history, and market depth information.

**Step 2: Opportunity Detection**
AI algorithms compare prices across exchanges, factoring in:
- Trading fees on both exchanges
- Withdrawal/transfer fees
- Network confirmation times
- Current market volatility
- Available liquidity

**Step 3: Risk Assessment**
Before executing any trade, the system evaluates:
- Probability of successful execution
- Maximum potential loss
- Expected profit after all fees
- Market conditions and trends

**Step 4: Trade Execution**
When a profitable opportunity passes all checks, the system simultaneously places buy and sell orders across exchanges.

**Step 5: Profit Distribution**
Daily profits are calculated and credited to users' wallets automatically.

### Security Measures

- All trading operations are isolated and secured
- Multiple redundancy layers prevent system failures
- Real-time monitoring detects and responds to anomalies
- Regular security audits ensure system integrity

### Investment Plans

Different investment amounts access different tiers of our AI engine:
- **Basic**: Standard arbitrage scanning
- **Advance**: Enhanced scanning with more exchange coverage
- **Business**: Priority execution and advanced strategies
- **Elite**: Full access to all strategies including flash arbitrage

### Why Choose Arbiz AI?

1. **Fully Automated**: No trading knowledge required
2. **24/7 Operation**: The bot never sleeps
3. **Risk Management**: Built-in safeguards protect your capital
4. **Transparent**: Daily profit reports and full transaction history
5. **Community**: Join thousands of successful investors worldwide`,
  },
  "understanding-daily-profits": {
    title: "Understanding Daily Profits",
    content: `## How Daily Profits Work at Arbiz AI

One of the most common questions from new members is "How are my daily profits calculated?" This article explains everything you need to know.

### Profit Generation

Your daily profit comes from the AI bot's arbitrage trading activity:
1. The bot scans exchanges continuously for price discrepancies
2. When profitable opportunities are found, trades are executed
3. Profits from all successful trades are pooled
4. Your share is calculated based on your investment amount and plan

### Daily Profit Rates

Each investment plan has a daily profit range:
- The rate varies daily based on market conditions
- Higher market volatility generally means more opportunities
- Rates are within the specified range for your plan
- Profits are credited to your wallet once per day

### Viewing Your Profits

You can track your profits in several ways:
- **Dashboard**: Shows today's profit and total accumulated
- **Profit History**: Detailed daily profit breakdown
- **Investment Page**: Per-bot profit tracking

### Auto-Compound

Enable auto-compound to reinvest daily profits automatically:

**Example without auto-compound ($1,000 investment at 1% daily):**
- Day 1: $10 profit → Total: $1,010 (but only $1,000 works)
- Day 30: $300 total profit

**Example with auto-compound ($1,000 investment at 1% daily):**
- Day 1: $10 profit → New principal: $1,010
- Day 2: $10.10 profit → New principal: $1,020.10
- Day 30: ~$348 total profit

Over longer periods, the difference becomes dramatic!

### Market Volatility Factor

Your profit history may show a "market volatility" indicator:
- **High Volatility**: More trading opportunities, potentially higher profits
- **Normal Volatility**: Steady, consistent returns
- **Low Volatility**: Fewer opportunities, but still generating profit

### Important Notes

- Profits are not guaranteed and depend on market conditions
- Past performance does not guarantee future results
- The AI bot optimizes for consistent, sustainable returns
- Withdrawing profits has only a 5% fee (vs. higher penalties for principal)

### Best Practices

1. **Check daily**: Monitor your profit history regularly
2. **Enable auto-compound**: For maximum long-term growth
3. **Diversify**: Activate multiple bots across different plans
4. **Be patient**: Consistent daily profits compound into significant wealth over time`,
  },
  "referral-program-guide": {
    title: "Referral Program Guide",
    content: `## Arbiz AI Referral Program

The referral program allows you to earn passive income by inviting others to join Arbiz AI. With up to 10 levels of commission, your earning potential is substantial.

### How It Works

1. Share your unique referral code with friends and family
2. When they register using your code, they become your Level 1 referral
3. When your Level 1 referrals invite others, those become your Level 2, and so on
4. You earn a percentage of your downline's daily profits as commission

### Commission Rates (10 Levels)

| Level | Commission Rate |
|-------|----------------|
| Level 1 | 5.0% |
| Level 2 | 3.0% |
| Level 3 | 2.0% |
| Level 4 | 1.0% |
| Level 5 | 0.5% |
| Level 6 | 0.5% |
| Level 7 | 0.3% |
| Level 8 | 0.2% |
| Level 9 | 0.1% |
| Level 10 | 0.1% |

*Note: Rates may be adjusted by admin. Check the Commissions page for current rates.*

### Example Calculation

If your Level 1 referral earns $100 in daily profit:
- You receive: $100 × 5% = **$5.00** commission

If that person's referral (your Level 2) earns $100:
- You receive: $100 × 3% = **$3.00** commission

### Building Your Team

**Tips for Success:**
1. **Educate**: Help prospects understand crypto arbitrage
2. **Support**: Assist new members in getting started
3. **Demonstrate**: Show your own profit results (with permission)
4. **Consistency**: Regularly share opportunities on social media
5. **Build Depth**: Encourage your team to also recruit

### Tracking Your Team

- **My Team Page**: View all your downline members across 10 levels
- **Group Turnover**: See total active bot investments in your team
- **Commission History**: Track all commission earnings
- **Search Function**: Find specific team members by name or code

### Rank Advancement

Your team's performance contributes to your rank:
- **Bronze** → **Silver** → **Gold** → **Platinum** → **Diamond**
- Higher ranks unlock additional benefits and recognition

### Withdrawing Commissions

- Commission earnings are credited directly to your wallet
- Withdrawal fee for commissions: only 5%
- No waiting period — withdraw commissions anytime

### Important Rules

- Referral code cannot be changed once registered
- Self-referral is not allowed
- Commission is only earned when downline members have active investments
- All commission calculations are automated and transparent`,
  },
  "security-best-practices": {
    title: "Security Best Practices",
    content: `## Keeping Your Arbiz AI Account Secure

Your account security is our top priority. Follow these best practices to protect your investment and personal information.

### Account Security

**1. Strong Password**
- Use at least 12 characters
- Mix uppercase, lowercase, numbers, and symbols
- Never reuse passwords from other websites
- Consider using a password manager

**2. Email Security**
- Use a secure email provider (Gmail, Outlook)
- Enable 2FA on your email account
- Don't share your email password with anyone
- Regularly check for suspicious login activity

**3. KYC Verification**
Complete KYC verification for:
- Identity protection
- Higher withdrawal limits
- Priority support access
- Full platform features

### Avoiding Scams

**Phishing Awareness**
- Always type arbizai.com directly in your browser
- Never click links in suspicious messages claiming to be from Arbiz AI
- Official communications only come from @arbizai.com email addresses
- We will NEVER ask for your password

**Social Engineering**
- Don't share your login credentials with anyone
- Arbiz AI support will never ask for your password
- Be wary of "too good to be true" offers from unofficial sources
- Report suspicious contacts to support@arbizai.com

### Device Security

1. **Keep Software Updated**: Always use the latest browser version
2. **Antivirus Protection**: Use reputable antivirus software
3. **Secure Networks**: Avoid logging in on public WiFi without VPN
4. **Trusted Devices**: Only access your account from personal devices
5. **Log Out**: Always log out when using shared devices

### Transaction Security

- **Verify Addresses**: Double-check wallet addresses before withdrawing
- **Start Small**: When using a new wallet address, send a small test amount first
- **Monitor History**: Regularly check your transaction history for unauthorized activity
- **Report Issues**: Contact support immediately if you notice anything unusual

### What to Do If Compromised

If you suspect your account has been compromised:
1. Change your password immediately
2. Check your recent transaction history
3. Contact support at support@arbizai.com
4. Secure your email account
5. Review connected devices and sessions

### Our Security Measures

Arbiz AI employs multiple layers of security:
- **Encrypted Data**: All data is encrypted in transit and at rest
- **Secure Infrastructure**: Enterprise-grade server security
- **Regular Audits**: Ongoing security assessments
- **RLS Policies**: Row-level security on all database tables
- **Monitoring**: 24/7 system monitoring for suspicious activity

Your security is a shared responsibility. Stay vigilant and follow these practices to keep your account safe.`,
  },
};

const ArticleDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const article = articlesData[slug || ""];

  if (!article) {
    return (
      <DashboardLayout title="Article Not Found">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">This article doesn't exist.</p>
          <Button onClick={() => navigate("/education")} variant="outline">Back to Education</Button>
        </div>
      </DashboardLayout>
    );
  }

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-display font-bold text-foreground mt-6 mb-3">{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-base font-display font-semibold text-foreground mt-5 mb-2">{line.replace('### ', '')}</h3>;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-sm font-semibold text-foreground mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
      if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="text-sm text-muted-foreground ml-4 mb-1">{line.replace(/^[-•] /, '')}</li>;
      if (line.match(/^\d+\. /)) return <li key={i} className="text-sm text-muted-foreground ml-4 mb-1 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
      if (line.startsWith('| ')) return null; // skip table formatting for simplicity
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="text-sm text-muted-foreground mb-2">{line}</p>;
    });
  };

  return (
    <DashboardLayout title={article.title}>
      <div className="max-w-lg mx-auto space-y-5">
        <Button variant="ghost" size="sm" onClick={() => navigate("/education")} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Education
        </Button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground">Knowledge Base</span>
          </div>
          <div className="prose-sm">
            {renderContent(article.content)}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ArticleDetail;
