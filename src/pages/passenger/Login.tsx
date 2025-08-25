
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Eye, EyeOff, Camera, Upload, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { savePassengerPreferences, uploadPassengerAvatar } from "@/lib/api/passenger-preferences";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Photo upload state
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    air_conditioning: true,
    preferred_temperature: 72,
    temperature_unit: 'F' as const,
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handlePhotoSelect = (file: File) => {
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setSelectedPhoto(file);
      setPhotoPreview(previewUrl);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoSelect(file);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const updatePreference = <K extends keyof typeof preferences>(
    key: K,
    value: typeof preferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-gray-600 hover:text-gray-900 hover:bg-white/80 p-3 rounded-xl font-medium flex items-center gap-2"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </Button>

        <Card className="border-0 shadow-lg rounded-3xl bg-white">
          <CardHeader className="text-center pb-8 pt-8 px-8">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome to VIP Chauffeur
            </CardTitle>
            <CardDescription className="text-gray-600 text-sm mt-3">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 p-1 rounded-xl h-12">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 font-semibold py-3 rounded-lg transition-all duration-200"
                >
                  Sign in
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 font-semibold py-3 rounded-lg transition-all duration-200"
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
                      className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-xl h-14 text-base placeholder:text-gray-400"
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
                        className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-xl h-14 text-base placeholder:text-gray-400 pr-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white h-14 text-base font-semibold rounded-xl transition-colors duration-200" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        placeholder="John"
                        className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-xl h-14 text-base placeholder:text-gray-400"
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
                        className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-xl h-14 text-base placeholder:text-gray-400"
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
                      className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-xl h-14 text-base placeholder:text-gray-400"
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
                      className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-xl h-14 text-base placeholder:text-gray-400"
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
                        className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-xl h-14 text-base placeholder:text-gray-400 pr-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                      </Button>
                    </div>
                  </div>

                  {/* Photo Upload Section */}
                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    <Label className="text-sm font-medium text-gray-700">Profile Photo (Optional)</Label>
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <Avatar className="w-20 h-20 border-2 border-gray-200">
                          <AvatarImage src={photoPreview || undefined} alt="Profile" className="object-cover" />
                          <AvatarFallback className="text-lg bg-gray-100 text-gray-600">
                            {firstName && lastName ? getInitials(`${firstName} ${lastName}`) : <User className="w-8 h-8" />}
                          </AvatarFallback>
                        </Avatar>
                        
                        <Button
                          type="button"
                          size="sm"
                          className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 p-0 bg-[#FF385C] hover:bg-[#E31C5F] border-2 border-white"
                          onClick={() => document.getElementById('photo-input')?.click()}
                        >
                          <Camera className="w-4 h-4 text-white" />
                        </Button>
                      </div>

                      <div className="text-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('photo-input')?.click()}
                          className="text-[#FF385C] border-[#FF385C] hover:bg-[#FF385C] hover:text-white rounded-xl"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 10MB</p>
                      </div>

                      <input
                        id="photo-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />

                      {photoPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPhoto(null);
                            setPhotoPreview(null);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Remove photo
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Preferences Section */}
                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    <Label className="text-sm font-medium text-gray-700">Ride Preferences</Label>
                    
                    {/* Temperature */}
                    <div className="space-y-3">
                      <Label className="text-xs font-medium text-gray-600">Preferred Temperature</Label>
                      <RadioGroup
                        value={preferences.preferred_temperature.toString()}
                        onValueChange={(value) => updatePreference('preferred_temperature', parseInt(value))}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="65" id="cool" />
                          <Label htmlFor="cool" className="text-sm">Cool (65°F)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="72" id="neutral" />
                          <Label htmlFor="neutral" className="text-sm">Neutral (72°F)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="78" id="warm" />
                          <Label htmlFor="warm" className="text-sm">Warm (78°F)</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Music */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="music" className="text-xs font-medium text-gray-600">Music</Label>
                      <Switch
                        id="music"
                        checked={preferences.radio_on}
                        onCheckedChange={(checked) => updatePreference('radio_on', checked)}
                      />
                    </div>

                    {/* Conversation */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600">Ride Style</Label>
                      <Select
                        value={preferences.conversation_preference}
                        onValueChange={(value) => updatePreference('conversation_preference', value)}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-xl h-12">
                          <SelectValue placeholder="Choose preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no_preference">No preference</SelectItem>
                          <SelectItem value="friendly">Talkative ride</SelectItem>
                          <SelectItem value="quiet">Quiet ride</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Trip Purpose */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600">Trip Purpose</Label>
                      <Select
                        value={preferences.trip_purpose}
                        onValueChange={(value) => updatePreference('trip_purpose', value)}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-xl h-12">
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="leisure">Leisure</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white h-14 text-base font-semibold rounded-xl transition-colors duration-200" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Continue"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-8 text-center">
              <Button
                variant="link"
                onClick={handleForgotPassword}
                disabled={isLoading || !email}
                className="text-sm text-gray-600 hover:text-[#FF385C] transition-colors duration-200 font-medium"
              >
                Forgot your password?
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
