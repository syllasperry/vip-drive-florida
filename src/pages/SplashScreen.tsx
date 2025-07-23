import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Shield } from "lucide-react";

const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => navigate("/onboarding"), 500);
    }, 6000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50 transition-opacity duration-500 ${
      isVisible ? "opacity-100" : "opacity-0"
    }`}>
      <div className="text-center space-y-12 relative">
        {/* Elegant Shield Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <Shield className="w-96 h-96 text-yellow-400 animate-shield-glow" />
        </div>

        {/* Five Stars */}
        <div className="flex justify-center space-x-6 mb-8">
          <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-star-entrance-1" />
          <Star className="w-10 h-10 text-yellow-400 fill-yellow-400 animate-star-entrance-2" />
          <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 animate-star-entrance-3" />
          <Star className="w-10 h-10 text-yellow-400 fill-yellow-400 animate-star-entrance-4" />
          <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-star-entrance-5" />
        </div>
        
        {/* VIP Logo */}
        <div className="relative">
          <h1 className="text-8xl md:text-9xl font-black tracking-wider relative animate-vip-entrance">
            <span className="bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 bg-clip-text text-transparent 
                           drop-shadow-2xl relative z-10">
              VIP
            </span>
            {/* Luxury shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                           animate-luxury-shine transform -skew-x-12"></div>
          </h1>
        </div>
        
        {/* Subtext */}
        <div className="animate-subtext-entrance">
          <p className="text-2xl md:text-3xl text-gray-300 font-light tracking-wide">
            Chauffeur Service in South Florida
          </p>
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto mt-4"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;