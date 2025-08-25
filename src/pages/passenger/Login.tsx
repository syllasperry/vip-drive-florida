
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { PhotoUploadStep } from "@/components/onboarding/PhotoUploadStep";
import { PreferencesStep, PassengerPreferences } from "@/components/onboarding/PreferencesStep";
import { savePassengerPreferences, uploadPassengerAvatar } from "@/lib/api/passenger-preferences";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Photo upload state
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Preferences state
  const [preferences, setPreferences] = useState<PassengerPreferences>({
    air_conditioning: true,
    preferred_temperature: 72,
    temperature_unit: 'F',
    radio_on: true,
    preferred_music: 'no_preference',
    conversation_preference: 'no_preference',
    trip_purpose: 'leisure',
    trip_notes: ''
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Welcome back!");
      
      if (bookingData) {
        navigate("/cars", { state: bookingData });
      } else {
        navigate("/passenger/dashboard");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBasicSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  const handlePhotoStep = () => {
    setCurrentStep(3);
  };

  const handleCompleteSignUp = async () => {
    setIsLoading(true);

    try {
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: `${firstName} ${lastName}`,
            phone: phone,
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        let avatarUrl = null;
        
        // Upload photo if selected
        if (selectedPhoto) {
          try {
            avatarUrl = await uploadPassengerAvatar(selectedPhoto);
          } catch (photoError) {
            console.warn("Photo upload failed, continuing without it:", photoError);
          }
        }

        // Create passenger profile
        const { error: profileError } = await supabase
          .from('passengers')
          .insert([{
            user_id: data.user.id,
            full_name: `${firstName} ${lastName}`,
            email: email,
            phone: phone,
            profile_photo_url: avatarUrl,
          }]);

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }

        // Save preferences
        try {
          await savePassengerPreferences(preferences);
        } catch (preferencesError) {
          console.warn("Preferences saving failed:", preferencesError);
        }

        toast.success("Account created successfully!");
        
        localStorage.setItem("show_welcome_celebration", "true");
        
        if (bookingData) {
          navigate("/cars", { state: bookingData });
        } else {
          navigate("/passenger/dashboard");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Account creation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;
      
      toast.success("Reset email sent!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  const renderSignUpStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <form onSubmit={handleBasicSignUp} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="John"
                  className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-lg h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Doe"
                  className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-lg h-12"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="registerEmail" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="registerEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="john@example.com"
                className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-lg h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="(555) 123-4567"
                className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-lg h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="registerPassword" className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  id="registerPassword"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create a password"
                  minLength={6}
                  className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-lg h-12 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white h-12 text-base font-medium rounded-lg transition-colors duration-200" 
              disabled={isLoading}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        );

      case 2:
        return (
          <div className="space-y-8">
            <PhotoUploadStep
              onPhotoSelect={(file, preview) => {
                setSelectedPhoto(file);
                setPhotoPreview(preview);
              }}
              currentPhoto={photoPreview}
              userName={`${firstName} ${lastName}`}
            />
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1 h-12 text-base border-gray-300 hover:bg-gray-50 rounded-lg"
              >
                Back
              </Button>
              <Button
                onClick={handlePhotoStep}
                className="flex-1 bg-[#FF385C] hover:bg-[#E31C5F] text-white h-12 text-base font-medium rounded-lg"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <PreferencesStep
              preferences={preferences}
              onPreferencesChange={setPreferences}
            />
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="flex-1 h-12 text-base border-gray-300 hover:bg-gray-50 rounded-lg"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={handleCompleteSignUp}
                className="flex-1 bg-[#FF385C] hover:bg-[#E31C5F] text-white h-12 text-base font-medium rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : (
                  <>
                    Complete
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>

        <Card className="border-0 shadow-lg rounded-2xl">
          <CardHeader className="text-center pb-8 pt-8">
            <CardTitle className="text-2xl font-semibold text-gray-900">
              {currentStep > 1 ? "Complete your profile" : "Welcome to VIP Chauffeur"}
            </CardTitle>
            <CardDescription className="text-gray-600 text-base mt-2">
              {currentStep === 2 
                ? "Add your photo (optional)" 
                : currentStep === 3
                ? "Tell us your preferences"
                : "Sign in to your account or create a new one"
              }
            </CardDescription>
            {currentStep > 1 && (
              <div className="flex justify-center mt-4">
                <div className="flex space-x-2">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`w-2 h-2 rounded-full ${
                        step <= currentStep ? 'bg-[#FF385C]' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {currentStep === 1 ? (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger 
                    value="login" 
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 font-medium py-2 rounded-md"
                  >
                    Sign in
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register"
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 font-medium py-2 rounded-md"
                  >
                    Create account
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your email"
                        className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-lg h-12"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="Enter your password"
                          className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-lg h-12 pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                        </Button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white h-12 text-base font-medium rounded-lg transition-colors duration-200" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  {renderSignUpStep()}
                </TabsContent>
              </Tabs>
            ) : (
              renderSignUpStep()
            )}

            {currentStep === 1 && (
              <div className="mt-6 text-center">
                <Button
                  variant="link"
                  onClick={handleForgotPassword}
                  disabled={isLoading || !email}
                  className="text-sm text-gray-600 hover:text-[#FF385C] transition-colors duration-200"
                >
                  Forgot your password?
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
