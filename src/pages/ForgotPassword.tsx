import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Zap, Mail } from "lucide-react";
import { useLogo } from "@/hooks/useLogo";

const ForgotPassword = () => {
  const logo = useLogo();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 gradient-primary opacity-5" />
      <div className="w-full max-w-md relative">
        <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        <div className="glass-strong rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <img src={logo} alt="Arbiz AI" className="h-[120px]" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Reset Password</h1>
            <p className="text-muted-foreground text-sm">Enter your email to receive a reset link</p>
          </div>

          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <p className="text-foreground font-medium">Email sent!</p>
              <p className="text-sm text-muted-foreground">Check the inbox of <strong>{email}</strong> for the password reset link.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;