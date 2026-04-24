import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useLogo } from "@/hooks/useLogo";

export function Footer() {
  const logo = useLogo();
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="container px-4">
        {/* Risk Disclaimer */}
        <div className="glass rounded-2xl p-6 mb-8 border-warning/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <h4 className="font-display font-bold text-sm mb-2">Important Risk Disclaimer</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cryptocurrency trading carries significant risk. Daily returns are variable and depend on market conditions including volatility, liquidity, and spread availability. 
                There is <strong>no guarantee of fixed income</strong>. Past performance does not predict future results. You may lose part or all of your capital. 
                Only use funds you can afford to lose. This platform does not provide financial advice. Please consult a qualified financial advisor before making trading decisions.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
          <div>
            <img src={logo} alt="Arbiz AI" className="h-24 mb-3" />
            <p className="text-sm text-muted-foreground">AI-powered crypto arbitrage automation platform.</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#plans" className="hover:text-primary transition-colors">AI Bot Plans</a></li>
              <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/server-status" className="hover:text-primary transition-colors">Server Status</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/aml" className="hover:text-primary transition-colors">AML Policy</Link></li>
              <li><Link to="/security-info" className="hover:text-primary transition-colors">Security</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Arbiz AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
