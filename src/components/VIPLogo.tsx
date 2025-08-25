
import React from 'react';

const VIPLogo: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* 5 Stars with staggered animation */}
      <div className="flex space-x-4 mb-6">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="w-8 h-8 text-yellow-400 animate-bounce"
            style={{ 
              animationDelay: `${index * 0.2}s`,
              animationDuration: '1.5s',
              animationIterationCount: '3'
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-full h-full drop-shadow-lg"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        ))}
      </div>

      {/* VIP Shield Logo */}
      <div className="relative">
        {/* Shield Background */}
        <div className="relative w-48 h-56 flex flex-col items-center justify-center">
          {/* Top curved line */}
          <div className="absolute top-0 w-40 h-4 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-t-full transform -skew-x-12"></div>
          
          {/* Shield body */}
          <div className="w-40 h-48 bg-gradient-to-b from-slate-800 to-slate-900 relative flex items-center justify-center border-2 border-yellow-400 rounded-b-full">
            {/* VIP Text */}
            <div className="text-6xl font-bold text-yellow-400 tracking-wider drop-shadow-2xl">
              VIP
            </div>
            
            {/* Bottom shield point */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[20px] border-r-[20px] border-t-[24px] border-l-transparent border-r-transparent border-t-yellow-400"></div>
          </div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 w-40 h-48 bg-gradient-to-b from-yellow-400/10 to-transparent rounded-b-full animate-pulse"></div>
        </div>

        {/* Light beam effect */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-gradient-to-t from-yellow-400/80 to-transparent animate-pulse"></div>
      </div>

      {/* Text Below */}
      <div className="mt-8 text-center">
        <h1 className="text-2xl font-bold text-white tracking-wider mb-2">
          CHAUFFEUR SERVICE
        </h1>
        <p className="text-lg text-slate-300 tracking-wide">
          IN SOUTH FLORIDA
        </p>
      </div>
    </div>
  );
};

export default VIPLogo;
