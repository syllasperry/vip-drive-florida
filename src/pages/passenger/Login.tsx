
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

      toast.success("Bem-vindo de volta!");
      
      if (bookingData) {
        navigate("/cars", { state: bookingData });
      } else {
        navigate("/passenger/dashboard");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no login");
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

        toast.success("Conta criada com sucesso!");
        
        localStorage.setItem("show_welcome_celebration", "true");
        
        if (bookingData) {
          navigate("/cars", { state: bookingData });
        } else {
          navigate("/passenger/dashboard");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha na criação da conta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Por favor, digite seu email");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;
      
      toast.success("Email de recuperação enviado!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar email de recuperação");
    } finally {
      setIsLoading(false);
    }
  };

  const renderSignUpStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <form onSubmit={handleBasicSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="João"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Silva"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="registerEmail">Email</Label>
              <Input
                id="registerEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="joao@exemplo.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="registerPassword">Senha</Label>
              <div className="relative">
                <Input
                  id="registerPassword"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Crie uma senha"
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        );

      case 2:
        return (
          <div className="space-y-6">
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
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={handlePhotoStep}
                className="flex-1"
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <PreferencesStep
              preferences={preferences}
              onPreferencesChange={setPreferences}
            />
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="flex-1"
                disabled={isLoading}
              >
                Voltar
              </Button>
              <Button
                onClick={handleCompleteSignUp}
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? "Criando conta..." : (
                  <>
                    Finalizar
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {currentStep > 1 ? "Complete seu perfil" : "Bem-vindo ao VIP Chauffeur"}
            </CardTitle>
            <CardDescription>
              {currentStep > 1 
                ? `Passo ${currentStep} de 3` 
                : "Entre na sua conta ou crie uma nova"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 ? (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Criar conta</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Digite seu email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="Digite sua senha"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Entrando..." : "Entrar"}
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
              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={handleForgotPassword}
                  disabled={isLoading || !email}
                  className="text-sm text-muted-foreground"
                >
                  Esqueceu sua senha?
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
