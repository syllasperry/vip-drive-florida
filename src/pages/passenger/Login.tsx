import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, Upload, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PassengerLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    hearAbout: "",
    profilePhoto: null as File | null,
    accountType: "",
    accountName: ""
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state;
  const { toast } = useToast();

  const handleForceLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      localStorage.clear();
      sessionStorage.clear();
      toast({
        title: "Logged out",
        description: "Session cleared successfully.",
      });
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      // Force clear even if logout fails
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          navigate(bookingData ? "/passenger/choose-vehicle" : "/passenger/dashboard", 
                 { state: bookingData });
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };
    checkAuth();
  }, [navigate, bookingData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You've been successfully signed in.",
        });

        navigate(bookingData ? "/passenger/choose-vehicle" : "/passenger/dashboard", 
               { state: bookingData });
      } else {
        // Check if email already exists in passengers table
        const { data: existingPassenger } = await supabase
          .from('passengers')
          .select('email')
          .eq('email', formData.email)
          .single();

        if (existingPassenger) {
          throw new Error("This email is already registered. Please log in instead.");
        }

        // Create new user account
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/passenger/dashboard`,
            data: {
              full_name: formData.name,
              phone: formData.phone,
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          let profilePhotoUrl = null;
          
          // Upload profile photo if provided
          if (formData.profilePhoto) {
            const fileExt = formData.profilePhoto.name.split('.').pop();
            const fileName = `${data.user.id}-profile.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, formData.profilePhoto, {
                upsert: true
              });

            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);
              profilePhotoUrl = publicUrl;
            }
          }

          // Create passenger record
          const { error: insertError } = await supabase
            .from('passengers')
            .insert({
              id: data.user.id,
              full_name: formData.name,
              email: formData.email,
              phone: formData.phone,
              profile_photo_url: profilePhotoUrl,
              account_type: formData.accountType || null,
              account_name: formData.accountName || null
            });

          if (insertError) throw insertError;

          localStorage.setItem("show_welcome_celebration", "true");
          localStorage.setItem("new_user_name", formData.name);
          
          toast({
            title: "Account created!",
            description: "Welcome to VIP! Your account has been created.",
          });

          navigate(bookingData ? "/passenger/choose-vehicle" : "/passenger/dashboard", 
                 { state: bookingData });
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let errorMessage = error.message || "Something went wrong. Please try again.";
      
      // Handle specific errors with user-friendly messages
      if (error.message?.includes('duplicate key value violates unique constraint')) {
        errorMessage = "A user with this email already exists. Please log in instead.";
        // Switch to login mode automatically
        setIsLogin(true);
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Please check your email and click the confirmation link to activate your account.";
      } else if (error.message?.includes('Password')) {
        errorMessage = "Password must be at least 6 characters long.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPG, PNG)');
        return;
      }
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setFormData(prev => ({ ...prev, profilePhoto: file }));
    }
  };


  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/passenger/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error('Google auth error:', error);
        throw error;
      }
      
      // Note: The redirect will happen automatically, so we don't set loading to false here
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      let errorMessage = "Google sign-in failed. Please try again.";
      
      if (error.message?.includes('popup')) {
        errorMessage = "Popup was blocked. Please allow popups for this site and try again.";
      } else if (error.message?.includes('unauthorized')) {
        errorMessage = "Google sign-in is not properly configured. Please contact support.";
      }
      
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header with Go Back and Force Logout */}
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/home")}
            className="text-muted-foreground hover:text-foreground text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleForceLogout}
            className="text-muted-foreground hover:text-destructive text-base"
            title="Clear session and logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Clear Session
          </Button>
        </div>
        
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? "Sign in to continue" : "Join VIP for premium rides"}
          </p>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <User className="inline h-4 w-4 mr-2" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required={!isLogin}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="inline h-4 w-4 mr-2" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    required={!isLogin}
                    className="h-12"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline h-4 w-4 mr-2" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                <Lock className="inline h-4 w-4 mr-2" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  className="h-12 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label>
                    <Upload className="inline h-4 w-4 mr-2" />
                    Profile Photo
                  </Label>
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                      {formData.profilePhoto ? (
                        <img 
                          src={URL.createObjectURL(formData.profilePhoto)} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="cursor-pointer w-full"
                        onClick={() => document.getElementById('photo-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload Photo
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>How did you hear about us?</Label>
                  <Select onValueChange={(value) => handleInputChange("hearAbout", value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="friend">Friend Referral</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type (Optional)</Label>
                  <Select value={formData.accountType} onValueChange={(value) => handleInputChange("accountType", value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.accountType && (
                  <div className="space-y-2">
                    <Label htmlFor="accountName">
                      {formData.accountType === 'individual' ? 'Full Name' : 'Business Name'}
                    </Label>
                    <Input
                      id="accountName"
                      value={formData.accountName}
                      onChange={(e) => handleInputChange("accountName", e.target.value)}
                      placeholder={formData.accountType === 'individual' ? 'Enter your full name' : 'Enter business name'}
                      className="h-12"
                    />
                  </div>
                )}
              </>
            )}

            <Button 
              type="submit" 
              variant="luxury" 
              size="lg" 
              className="w-full"
              disabled={loading || !formData.email || !formData.password || (!isLogin && !formData.name)}
            >
              {loading ? "Loading..." : (isLogin ? "Sign In" : "Create Account")}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="lg" 
              className="w-full"
              onClick={handleGoogleAuth}
              disabled={loading}
              type="button"
            >
              {loading ? (
                "Connecting..."
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            {isLogin && (
              <div className="text-center">
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => navigate("/passenger/forgot-password")}
                >
                  Forgot your password?
                </Button>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <Button 
                variant="link" 
                size="sm"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 p-0"
              >
                {isLogin ? "Create account" : "Sign in"}
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerLogin;