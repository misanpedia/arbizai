import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart3, ArrowDownCircle, TrendingUp, ArrowUpCircle, Users,
  LogOut, ChevronLeft
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  showBack?: boolean;
}

export function DashboardLayout({ children, title, showBack = true }: DashboardLayoutProps) {
  const { signOut } = useAuth();
  const location = useLocation();

  const bottomNav = [
    { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
    { icon: ArrowDownCircle, label: "Deposit", path: "/deposit" },
    { icon: TrendingUp, label: "AI Bot", path: "/invest" },
    { icon: ArrowUpCircle, label: "Withdraw", path: "/withdraw" },
    { icon: Users, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Header */}
      <header className="gradient-primary p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {showBack && (
            <Link to="/dashboard" className="p-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          )}
          <h1 className="text-lg font-display font-bold text-primary-foreground">{title}</h1>
        </div>
        <button onClick={() => signOut()} className="p-2 rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Content */}
      <main className="px-4 py-6">{children}</main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border/50 px-2 py-2 flex justify-around md:hidden z-50">
        {bottomNav.map((item, i) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={i} to={item.path} className={`flex flex-col items-center gap-0.5 transition py-1 px-3 ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
