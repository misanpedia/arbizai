import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Zap, Eye, EyeOff } from "lucide-react";
import { useLogo } from "@/hooks/useLogo";

const ResetPassword = () => {
  const logo = useLogo();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setIsValid(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success!", description: "Password has been reset successfully." });
      navigate("/login");
    }
  };

  if (!isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-strong rounded-2xl p-8 text-center space-y-4">
          <p className="text-muted-foreground">Reset link is invalid or has expired.</p>
          <Button onClick={() => navigate("/forgot-password")} variant="outline">Request New Link</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 gradient-primary opacity-5" />
      <div className="w-full max-w-md relative">
        <div className="glass-strong rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <img src={logo} alt="Arbiz AI" className="h-[120px]" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">New Password</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={isLoading}>
              {isLoading ? "Processing..." : "Reset Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;