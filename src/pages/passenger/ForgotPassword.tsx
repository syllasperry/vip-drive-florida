import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would call your backend/Supabase auth API
    console.log("Password reset requested for:", email);
    setIsSubmitted(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsSubmitted(false);
      navigate("/passenger/login");
    }, 3000);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="bg-card p-8 rounded-xl shadow-lg">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-card-foreground mb-2">
              Reset Link Sent!
            </h1>
            <p className="text-muted-foreground mb-4">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Check your email and follow the instructions to reset your password.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/passenger/login")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Login</span>
          </Button>
        </div>

        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Forgot Password?</h1>
          <p className="text-muted-foreground">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline h-4 w-4 mr-2" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="h-12"
              />
            </div>

            <Button type="submit" variant="luxury" size="lg" className="w-full">
              Send Reset Link
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
              <Button 
                variant="link" 
                size="sm"
                onClick={() => navigate("/passenger/login")}
                className="p-0"
              >
                Sign in
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;