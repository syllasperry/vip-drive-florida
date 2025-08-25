
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VIPLogo from '@/components/VIPLogo';

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        navigate('/onboarding');
      }, 500); // Allow fade out animation to complete
    }, 5000); // 5 seconds display time

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center transition-opacity duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <VIPLogo />
    </div>
  );
};

export default SplashScreen;
