
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-navigate to onboarding after 3 seconds
    const timer = setTimeout(() => {
      navigate('/onboarding');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
      <div className="text-center">
        {/* VIP Logo */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-4xl font-bold text-red-600">VIP</span>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>

        {/* Welcome Text */}
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome to VIP Transportation
        </h1>
        <p className="text-red-100 text-lg">
          Premium rides at your fingertips
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
