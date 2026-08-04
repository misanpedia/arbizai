import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart3, Users, ShieldCheck, ArrowDownCircle, ArrowUpCircle,
  TrendingUp, Cpu, Wallet, GitBranch, FileText, Bell, Shield,
  Activity, Settings, UserCog, Menu, X, ChevronLeft, LogOut, Zap, Coins,
  Megaphone, CalendarCheck, Award, MessageCircle, CreditCard
} from "lucide-react";

const menuItems = [
  { path: "/admin", label: "Dashboard", icon: BarChart3 },
  { path: "/admin/users", label: "Users", icon: Users },
  { path: "/admin/kyc", label: "KYC", icon: ShieldCheck },
  { path: "/admin/deposits", label: "Deposits", icon: ArrowDownCircle },
  { path: "/admin/deposit-wallets", label: "Deposit Wallets", icon: Coins },
  { path: "/admin/payment-gateway", label: "Payment Gateway", icon: CreditCard },
  { path: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpCircle },
  { path: "/admin/withdrawal-settings", label: "Withdrawal Config", icon: Settings },
  { path: "/admin/plans", label: "Investment Plans", icon: TrendingUp },
  { path: "/admin/profit-engine", label: "Profit Engine", icon: Cpu },
  { path: "/admin/wallets", label: "Wallets", icon: Wallet },
  { path: "/admin/referral", label: "Referral", icon: GitBranch },
  { path: "/admin/rank-settings", label: "Rank Settings", icon: Award },
  { path: "/admin/reports", label: "Reports", icon: FileText },
  { path: "/admin/support", label: "Support Messages", icon: MessageCircle },
  { path: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { path: "/admin/notifications", label: "Notifications", icon: Bell },
  { path: "/admin/spin-control", label: "Spin Wheel", icon: Zap },
  { path: "/admin/checkin-settings", label: "Check-in", icon: CalendarCheck },
  { path: "/admin/security", label: "Security", icon: Shield },
  { path: "/admin/system-monitor", label: "System Monitor", icon: Activity },
  { path: "/admin/settings", label: "Settings", icon: Settings },
  { path: "/admin/admin-management", label: "Staff Management", icon: UserCog },
];

export function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-card border-r border-border z-50 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground">Admin Panel</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "gradient-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition">
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <button onClick={() => signOut()} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border px-4 lg:px-6 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted/50 text-muted-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold text-foreground">{title}</h1>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}