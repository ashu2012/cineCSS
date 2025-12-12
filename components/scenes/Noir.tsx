import React from 'react';

const Noir: React.FC = () => {
  return (
    <div className="w-full h-full bg-neutral-900 relative overflow-hidden flex items-center justify-center">
      {/* Smoky Background */}
      <div className="absolute inset-0 bg-neutral-800">
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      </div>

      <style>
        {`
          @keyframes dustFloat {
            0% { transform: translateY(0px) translateX(0px); opacity: 0; }
            50% { opacity: 0.8; }
            100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
          }
          @keyframes flicker {
            0% { opacity: 0.9; }
            5% { opacity: 0.8; }
            10% { opacity: 0.9; }
            15% { opacity: 0.6; }
            20% { opacity: 0.9; }
            50% { opacity: 0.9; }
            55% { opacity: 0.7; }
            60% { opacity: 0.9; }
            100% { opacity: 0.9; }
          }
        `}
      </style>

      {/* Venetian Blinds Shadow */}
      <div className="absolute inset-0 z-20 pointer-events-none">
         {Array.from({ length: 10 }).map((_, i) => (
             <div 
                key={i} 
                className="absolute w-full bg-black shadow-xl transform -skew-y-6 origin-top-left"
                style={{
                    height: '10%',
                    top: `${i * 15}%`,
                    opacity: 0.85
                }}
             />
         ))}
      </div>

      {/* Silhouette */}
      <div className="relative z-10 w-64 h-80 bg-black mask-image-gradient rounded-full blur-sm opacity-90 flex flex-col items-center">
        <div className="w-40 h-40 bg-black rounded-full mt-10"></div>
        <div className="w-64 h-64 bg-black rounded-t-3xl -mt-10"></div>
      </div>

      {/* Cigarette Smoke */}
      <div className="absolute z-30 bottom-1/4 left-1/2 ml-10">
        {Array.from({ length: 15 }).map((_, i) => (
            <div 
                key={i}
                className="absolute w-8 h-8 bg-gray-300 rounded-full blur-xl"
                style={{
                    animation: `dustFloat ${3 + Math.random() * 2}s linear infinite`,
                    animationDelay: `${Math.random() * 5}s`,
                    opacity: 0
                }}
            />
        ))}
      </div>

      {/* Flickering Light Source */}
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/10 to-transparent pointer-events-none animate-[flicker_4s_steps(10)_infinite]"></div>
    </div>
  );
};

export default Noir;