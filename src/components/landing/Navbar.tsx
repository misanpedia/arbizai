import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(true);

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  // Set dark mode on mount
  useState(() => {
    document.documentElement.classList.add("dark");
  });

  const links = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Plans", href: "#plans" },
    { label: "About Us", href: "/about", isRoute: true },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container px-4 flex items-center justify-between h-16">
        <a href="/" className="flex items-center">
          <img src={logo} alt="Arbiz AI" className="h-8" />
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            l.isRoute ? (
              <Link key={l.href} to={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </Link>
            ) : (
              <a key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </a>
            )
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleDark} className="rounded-full">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" className="hidden md:inline-flex" asChild><Link to="/login">Log In</Link></Button>
          <Button className="hidden md:inline-flex gradient-primary text-primary-foreground" asChild><Link to="/register">Sign Up</Link></Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-strong border-t border-border/50"
          >
            <div className="container px-4 py-4 flex flex-col gap-3">
              {links.map((l) => (
                l.isRoute ? (
                  <Link key={l.href} to={l.href} onClick={() => setOpen(false)} className="text-sm py-2 text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                ) : (
                  <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm py-2 text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </a>
                )
              ))}
              <div className="flex gap-2 pt-2 border-t border-border/50">
                <Button variant="outline" className="flex-1" asChild><Link to="/login">Log In</Link></Button>
                <Button className="flex-1 gradient-primary text-primary-foreground" asChild><Link to="/register">Sign Up</Link></Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
