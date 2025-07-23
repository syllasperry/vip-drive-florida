import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";

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
        {/* Logo with Stars */}
        <div className="relative flex flex-col items-center space-y-6">
          {/* Stars */}
          <div className="flex space-x-4 mb-4">
            <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-star-twinkle-1" />
            <Star className="w-10 h-10 text-yellow-400 fill-yellow-400 animate-star-twinkle-2" />
            <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 animate-star-twinkle-3" />
            <Star className="w-10 h-10 text-yellow-400 fill-yellow-400 animate-star-twinkle-4" />
            <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-star-twinkle-5" />
          </div>
          
          {/* VIP Logo */}
          <div className="relative">
            <img 
              src="/lovable-uploads/b69de5ff-ba48-4187-8d37-5673866975ba.png" 
              alt="VIP Logo" 
              className="w-48 h-32 mx-auto animate-logo-glow object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-yellow-500/10 rounded-lg animate-luxury-pulse"></div>
          </div>
          
          {/* Luxury shimmer effect overlay */}
          <div className="absolute inset-0 animate-luxury-shimmer rounded-lg"></div>
        </div>
        
        <div className="space-y-4 animate-slide-up">
          <h1 className="text-5xl font-bold text-foreground tracking-wide bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            VIP
          </h1>
          <p className="text-xl text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Your Professional Chauffeur Service in South Florida
          </p>
        </div>
        
        <div className="flex justify-center space-x-2 animate-fade-in">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;