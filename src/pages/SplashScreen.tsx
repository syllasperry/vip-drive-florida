
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
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center transition-opacity duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className="text-center text-white">
        <div className="mb-8 relative">
          <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center animate-pulse">
            <span className="text-3xl font-bold text-red-600">VIP</span>
          </div>
          <div className="absolute -inset-2 bg-white/20 rounded-full animate-ping"></div>
        </div>
        
        <h1 className="text-4xl font-bold mb-2 animate-fade-in">
          VIP Chauffeur
        </h1>
        <p className="text-xl text-red-100 animate-fade-in-delay">
          Premium Transportation
        </p>
        
        <div className="mt-8">
          <div className="flex space-x-1 justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-white rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
