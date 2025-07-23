import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import vipLogo from "@/assets/vip-logo.jpg";

const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => navigate("/onboarding"), 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-background to-muted flex items-center justify-center z-50 transition-opacity duration-500 ${
      isVisible ? "opacity-100" : "opacity-0"
    }`}>
      <div className="text-center space-y-8">
        <div className="relative">
          <img 
            src={vipLogo} 
            alt="VIP Logo" 
            className="w-32 h-32 mx-auto animate-logo-glow"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary-glow/20 rounded-full animate-luxury-pulse"></div>
        </div>
        
        <div className="space-y-4 animate-slide-up">
          <h1 className="text-4xl font-bold text-foreground tracking-wide">
            VIP
          </h1>
          <p className="text-xl text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Your Professional Chauffeur Service in South Florida
          </p>
        </div>
        
        <div className="flex justify-center space-x-2 animate-fade-in">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;