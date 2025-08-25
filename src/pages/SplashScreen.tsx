
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        navigate('/onboarding');
      }, 500); // Allow fade out animation to complete
    }, 5000); // Changed to 5 seconds

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center transition-opacity duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className="flex items-center justify-center">
        <div className="relative">
          <img 
            src="/lovable-uploads/50fb0053-2860-4417-b88e-318de1c999b2.png" 
            alt="VIP Chauffeur Service Logo"
            className="w-64 h-64 object-contain animate-pulse"
          />
          <div className="absolute -inset-8 bg-yellow-400/10 rounded-full animate-ping"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
