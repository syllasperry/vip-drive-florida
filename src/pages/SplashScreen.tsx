
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
    }, 7000); // Extended to 7 seconds for better experience

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50 transition-opacity duration-500 ${
      isVisible ? "opacity-100" : "opacity-0"
    }`}>
      <div className="text-center space-y-12 relative">
        {/* Elegant Shield Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <Shield className="w-96 h-96 text-yellow-400 animate-pulse" />
        </div>

        {/* Five Stars with improved animation */}
        <div className="flex justify-center space-x-6 mb-8">
          <Star 
            className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-bounce" 
            style={{ 
              animationDelay: '0ms',
              animationDuration: '1.5s'
            }} 
          />
          <Star 
            className="w-10 h-10 text-yellow-400 fill-yellow-400 animate-bounce" 
            style={{ 
              animationDelay: '200ms',
              animationDuration: '1.5s'
            }} 
          />
          <Star 
            className="w-12 h-12 text-yellow-400 fill-yellow-400 animate-bounce" 
            style={{ 
              animationDelay: '400ms',
              animationDuration: '1.5s'
            }} 
          />
          <Star 
            className="w-10 h-10 text-yellow-400 fill-yellow-400 animate-bounce" 
            style={{ 
              animationDelay: '600ms',
              animationDuration: '1.5s'
            }} 
          />
          <Star 
            className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-bounce" 
            style={{ 
              animationDelay: '800ms',
              animationDuration: '1.5s'
            }} 
          />
        </div>
        
        {/* VIP Logo with improved scaling animation */}
        <div className="relative">
          <h1 className="text-8xl md:text-9xl font-black tracking-wider relative">
            <span 
              className="bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 bg-clip-text text-transparent 
                         drop-shadow-2xl relative z-10 animate-pulse"
              style={{
                animationDuration: '2s',
                transform: 'scale(1)',
                transition: 'transform 0.5s ease-out'
              }}
            >
              VIP
            </span>
          </h1>
        </div>
        
        {/* Fixed subtitle with proper styling */}
        <div className="opacity-0 animate-fade-in" style={{ animationDelay: '1.5s', animationFillMode: 'forwards' }}>
          <p className="text-2xl md:text-3xl text-slate-200 font-light tracking-wide leading-relaxed px-4">
            Chauffeur Service in South Florida
          </p>
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto mt-6 opacity-0 animate-fade-in" 
               style={{ animationDelay: '2s', animationFillMode: 'forwards' }}>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
