
import React from 'react';

const VIPLogo: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* 5 Stars with staggered animation - exactly as in photo */}
      <div className="flex space-x-8 mb-6">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="w-12 h-12 text-yellow-400"
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
                filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))'
              }}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        ))}
      </div>

      {/* Shield Logo - exactly matching the photo */}
      <div className="relative mb-8">
        {/* Top golden crown/arch - matching photo exactly */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <svg width="280" height="40" viewBox="0 0 280 40" className="drop-shadow-lg">
            <path 
              d="M20 35 Q140 5 260 35 L260 40 L20 40 Z" 
              fill="url(#goldGradient)"
              stroke="#d97706"
              strokeWidth="2"
            />
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ca8a04" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        {/* Main Shield Body - matching photo proportions */}
        <div className="relative w-72 h-80 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 flex items-center justify-center border-4 border-yellow-500 shadow-2xl"
             style={{
               clipPath: 'polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)'
             }}>
          
          {/* VIP Text - matching photo style exactly */}
          <div className="text-9xl font-bold bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 bg-clip-text text-transparent tracking-wider drop-shadow-2xl mt-8"
               style={{
                 textShadow: '0 0 30px rgba(251, 191, 36, 0.5)',
                 fontFamily: 'serif'
               }}>
            VIP
          </div>
          
          {/* Inner glow effect */}
          <div className="absolute inset-4 bg-gradient-to-b from-yellow-400/10 via-transparent to-transparent pointer-events-none"
               style={{
                 clipPath: 'polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)'
               }}></div>
        </div>

        {/* Outer glow effect */}
        <div className="absolute -inset-4 bg-gradient-to-b from-yellow-400/20 via-yellow-400/10 to-transparent blur-xl animate-pulse"
             style={{
               clipPath: 'polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)'
             }}></div>
        
        {/* Light beam effect at bottom point */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-2 h-16 bg-gradient-to-t from-yellow-400/80 via-yellow-400/40 to-transparent animate-pulse"></div>
      </div>

      {/* Text Below - exactly matching photo */}
      <div className="text-center mt-4">
        <h1 className="text-4xl font-bold text-white tracking-[0.4em] mb-4 drop-shadow-lg">
          CHAUFFEUR SERVICE
        </h1>
        <p className="text-2xl text-slate-300 tracking-[0.3em] font-light">
          IN SOUTH FLORIDA
        </p>
      </div>
    </div>
  );
};

export default VIPLogo;
