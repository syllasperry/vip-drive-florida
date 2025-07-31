import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, User, Mail, Phone, Car, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DriverRegister = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    licensePlate: "",
    carType: "",
    brand: "",
    model: "",
    year: "",
    mileage: "",
    creditCards: [] as string[],
    digitalPayments: [] as string[],
    preferredPayment: "",
    paymentInstructions: "",
    zelleInfo: "",
    venmoInfo: "",
    applePayInfo: "",
    googlePayInfo: "",
    paymentLinkInfo: "",
    accountType: "",
    accountName: ""
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create new user account
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/driver/dashboard`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create driver record
        const { error: insertError } = await supabase
          .from('drivers')
          .insert({
            id: data.user.id,
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            license_plate: formData.licensePlate,
            car_type: formData.carType,
            car_make: formData.brand,
            car_model: formData.model,
            car_year: formData.year,
            payment_methods_credit_cards: formData.creditCards,
            payment_methods_digital: formData.digitalPayments,
            preferred_payment_method: formData.preferredPayment,
            payment_instructions: formData.paymentInstructions,
            zelle_info: formData.zelleInfo,
            venmo_info: formData.venmoInfo,
            apple_pay_info: formData.applePayInfo,
            google_pay_info: formData.googlePayInfo,
            payment_link_info: formData.paymentLinkInfo,
            profile_photo_url: null,
            account_type: formData.accountType || null,
            account_name: formData.accountName || null
          });

        if (insertError) throw insertError;

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });

        navigate("/driver/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/driver/login")}
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </div>

        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Become a Driver</h1>
          <p className="text-muted-foreground">Join our VIP chauffeur team</p>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                <User className="inline h-4 w-4 mr-2" />
                Full Name
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                required
                className="h-12"
              />
            </div>

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
              <Label htmlFor="phone">
                <Phone className="inline h-4 w-4 mr-2" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                <Eye className="inline h-4 w-4 mr-2" />
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

            <div className="space-y-2">
              <Label htmlFor="carType">
                <Car className="inline h-4 w-4 mr-2" />
                Vehicle Type
              </Label>
              <Select value={formData.carType} onValueChange={(value) => handleInputChange("carType", value)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select your vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electric">Electric Car</SelectItem>
                  <SelectItem value="sedan">Sedan</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">
                  <Car className="inline h-4 w-4 mr-2" />
                  Brand
                </Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange("brand", e.target.value)}
                  className="h-12"
                  placeholder="Tesla, BMW, Chevrolet"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">
                  <Car className="inline h-4 w-4 mr-2" />
                  Model
                </Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                  className="h-12"
                  placeholder="Model Y, 7 Series, Escalade"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">
                  <FileText className="inline h-4 w-4 mr-2" />
                  Year
                </Label>
                <Input
                  id="year"
                  value={formData.year}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  className="h-12"
                  placeholder="2022"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mileage">
                  <FileText className="inline h-4 w-4 mr-2" />
                  Mileage
                </Label>
                <Input
                  id="mileage"
                  value={formData.mileage}
                  onChange={(e) => handleInputChange("mileage", e.target.value)}
                  className="h-12"
                  placeholder="34,000 miles"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licensePlate">
                <FileText className="inline h-4 w-4 mr-2" />
                License Plate
              </Label>
              <Input
                id="licensePlate"
                value={formData.licensePlate}
                onChange={(e) => handleInputChange("licensePlate", e.target.value)}
                required
                className="h-12"
                placeholder="ABC-1234"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountType">
                <User className="inline h-4 w-4 mr-2" />
                Account Type (Optional)
              </Label>
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
                  <User className="inline h-4 w-4 mr-2" />
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

            <Button
              type="submit"
              variant="luxury"
              size="lg"
              className="w-full"
              disabled={loading || !formData.email || !formData.password || !formData.fullName || !formData.carType}
            >
              {loading ? "Creating Account..." : "Create Driver Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?
              <Button 
                variant="link" 
                size="sm"
                onClick={() => navigate("/driver/login")}
                className="ml-1 p-0"
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

export default DriverRegister;