import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield, Lock } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // Check if user is admin
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
        if (data) {
          navigate("/admin", { replace: true });
        } else {
          toast({ title: "Access Denied", description: "You don't have admin privileges.", variant: "destructive" });
        }
      });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
    // The useEffect above will handle the redirect after login
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-background to-primary/5" />
      <div className="w-full max-w-md relative">
        <div className="glass-strong rounded-2xl p-8 space-y-6 border border-border/50">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">Restricted access — authorized personnel only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isLoading}>
              <Lock className="w-4 h-4 mr-2" />
              {isLoading ? "Authenticating..." : "Access Admin Panel"}
            </Button>
          </form>

          <p className="text-center text-[10px] text-muted-foreground">
            This login page is for administrators only. Unauthorized access attempts are logged.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
