import React from 'react';

const Hyperspace: React.FC = () => {
  return (
    <div className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center perspective-[500px]">
      <style>
        {`
          @keyframes warp {
            0% { transform: translateZ(-500px) scale(0.1); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translateZ(500px) scale(1.5); opacity: 0; }
          }
          .star {
             position: absolute;
             width: 2px;
             height: 2px;
             background: white;
             border-radius: 50%;
          }
          .streak {
            position: absolute;
            width: 200px;
            height: 2px;
            background: linear-gradient(90deg, transparent, #fff, transparent);
            transform-origin: center;
          }
        `}
      </style>
      
      {/* Central glow */}
      <div className="absolute inset-0 bg-radial-gradient from-blue-900/20 to-black pointer-events-none"></div>

      {/* Stars/Streaks */}
      <div className="relative w-full h-full flex items-center justify-center transform-style-3d">
        {Array.from({ length: 80 }).map((_, i) => {
            const angle = Math.random() * 360;
            const delay = Math.random() * 2;
            const distance = 50 + Math.random() * 200;
            
            return (
                <div 
                    key={i}
                    className="streak shadow-[0_0_10px_rgba(100,200,255,0.8)]"
                    style={{
                        transform: `rotate(${angle}deg) translateX(${distance}px)`,
                        animation: `warp 0.8s linear infinite`,
                        animationDelay: `-${delay}s`,
                        opacity: 0
                    }}
                />
            );
        })}
      </div>
      
      {/* Cockpit Overlay (Abstract) */}
      <div className="absolute inset-0 pointer-events-none border-[50px] border-black/80 rounded-[100px] blur-sm scale-110"></div>
    </div>
  );
};

export default Hyperspace;