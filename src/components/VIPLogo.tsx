
import React from 'react';

const VIPLogo: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* 5 Stars with staggered animation */}
      <div className="flex space-x-6 mb-8">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="w-10 h-10 text-yellow-400"
            style={{ 
              animationDelay: `${index * 0.3}s`,
              animationDuration: '2s',
              animationIterationCount: 'infinite'
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-full h-full drop-shadow-lg animate-bounce"
              style={{ 
                animationDelay: `${index * 0.3}s`,
                filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))'
              }}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        ))}
      </div>

      {/* VIP Shield Logo */}
      <div className="relative mb-8">
        {/* Golden top border/crown */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-48 h-6 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 rounded-t-xl border-2 border-yellow-500"></div>
        
        {/* Main Shield */}
        <div className="relative w-56 h-64 bg-gradient-to-b from-slate-800 via-slate-900 to-black rounded-t-xl flex items-center justify-center border-4 border-yellow-500 shadow-2xl">
          {/* Shield point at bottom */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[28px] border-r-[28px] border-t-[32px] border-l-transparent border-r-transparent border-t-yellow-500"></div>
          
          {/* VIP Text */}
          <div className="text-8xl font-bold bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 bg-clip-text text-transparent tracking-wider drop-shadow-2xl">
            VIP
          </div>
          
          {/* Inner glow effect */}
          <div className="absolute inset-4 bg-gradient-to-b from-yellow-400/5 via-transparent to-transparent rounded-xl pointer-events-none"></div>
        </div>

        {/* Outer glow effect */}
        <div className="absolute -inset-4 bg-gradient-to-b from-yellow-400/20 via-yellow-400/10 to-transparent rounded-2xl blur-xl animate-pulse"></div>
        
        {/* Light beam effect at bottom */}
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-2 h-12 bg-gradient-to-t from-yellow-400/60 via-yellow-400/30 to-transparent animate-pulse"></div>
      </div>

      {/* Text Below */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white tracking-[0.3em] mb-3 drop-shadow-lg">
          CHAUFFEUR SERVICE
        </h1>
        <p className="text-xl text-slate-300 tracking-[0.2em] font-light">
          IN SOUTH FLORIDA
        </p>
      </div>
    </div>
  );
};

export default VIPLogo;
