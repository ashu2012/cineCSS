import React, { useMemo } from 'react';

// CSS-only Dollar Bill Component
const DollarBill: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div 
    className="absolute z-20 pointer-events-none"
    style={style}
  >
    <div className="w-24 md:w-32 h-10 md:h-14 bg-[#f0fcf4] border-2 border-[#15803d] rounded-sm flex items-center justify-center relative overflow-hidden shadow-sm">
      {/* Corner numbers */}
      <span className="absolute top-0.5 left-1 text-[8px] font-bold text-[#15803d]">1</span>
      <span className="absolute bottom-0.5 right-1 text-[8px] font-bold text-[#15803d]">1</span>
      <span className="absolute top-0.5 right-1 text-[8px] font-bold text-[#15803d]">1</span>
      <span className="absolute bottom-0.5 left-1 text-[8px] font-bold text-[#15803d]">1</span>
      
      {/* Decorative border inside */}
      <div className="absolute inset-1 border border-[#15803d] opacity-50 rounded-sm"></div>
      
      {/* Center Seal */}
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-[#15803d]/30 flex items-center justify-center bg-[#dcfce7]/50">
        <span className="font-serif text-[#15803d] font-bold text-lg md:text-xl">$</span>
      </div>
      
      {/* Side decorative lines */}
      <div className="absolute left-2 md:left-3 w-0.5 h-6 md:h-8 bg-[#15803d]/20"></div>
      <div className="absolute right-2 md:right-3 w-0.5 h-6 md:h-8 bg-[#15803d]/20"></div>
    </div>
  </div>
);

const StockNap: React.FC = () => {
  // Generate random bills
  const bills = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
      rotationSpeed: 2 + Math.random() * 3,
      scale: 0.6 + Math.random() * 0.4,
    }));
  }, []);

  return (
    <div className="w-full h-full bg-white relative overflow-hidden flex flex-col items-center justify-center font-serif">
      <style>
        {`
          @keyframes fallTwist {
            0% { 
              transform: translateY(-10vh) translateX(0) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
              opacity: 0;
            }
            10% { opacity: 1; }
            50% { 
              transform: translateY(50vh) translateX(20px) rotateX(180deg) rotateY(180deg) rotateZ(45deg); 
            }
            100% { 
              transform: translateY(110vh) translateX(-20px) rotateX(360deg) rotateY(360deg) rotateZ(90deg);
              opacity: 1;
            }
          }
          @keyframes logoFloat {
            0% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0); }
          }
          @keyframes growBar {
            0% { height: 0; opacity: 0; }
            100% { opacity: 1; }
          }
        `}
      </style>

      {/* Money Rain Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none perspective-[1000px]">
        {bills.map((bill) => (
          <DollarBill
            key={bill.id}
            style={{
              left: `${bill.left}%`,
              animation: `fallTwist ${bill.duration}s linear infinite`,
              animationDelay: `-${bill.delay}s`,
              transformOrigin: 'center center',
              scale: bill.scale
            }}
          />
        ))}
      </div>

      {/* Main Logo Container */}
      <div className="relative z-30 flex flex-col items-center animate-[logoFloat_6s_ease-in-out_infinite]">
        
        {/* Logo Graphic Area (Bars + Hammock/Moon) */}
        <div className="flex items-end gap-2 md:gap-3 mb-4"> 
            
            {/* Left Bars */}
            <div className="flex items-end gap-1 md:gap-1.5 mb-2">
                <div className="w-2 md:w-3 h-6 md:h-8 bg-gradient-to-t from-orange-400 to-yellow-300 rounded-sm animate-[growBar_1s_ease-out_forwards]" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 md:w-3 h-10 md:h-14 bg-gradient-to-t from-orange-400 to-yellow-300 rounded-sm animate-[growBar_1s_ease-out_forwards]" style={{animationDelay: '0.4s'}}></div>
                <div className="w-2 md:w-3 h-4 md:h-6 bg-gradient-to-t from-orange-400 to-yellow-300 rounded-sm animate-[growBar_1s_ease-out_forwards]" style={{animationDelay: '0.6s'}}></div>
            </div>

            {/* Moon/Person Icon - Refined to look like reference */}
            <div className="relative w-24 h-16 md:w-40 md:h-28 mx-1">
                <svg viewBox="0 0 160 100" className="w-full h-full drop-shadow-sm">
                    <defs>
                        <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#fca5a5" /> {/* Light Red/Pinkish Orange */}
                            <stop offset="50%" stopColor="#fb923c" /> {/* Orange */}
                            <stop offset="100%" stopColor="#facc15" /> {/* Yellow */}
                        </linearGradient>
                    </defs>
                    
                    {/* Crescent / Hammock */}
                    <path 
                        d="M 10,30 Q 80,110 150,30 Q 80,80 10,30 Z" 
                        fill="url(#moonGradient)" 
                    />
                    
                    {/* Sleeping Person Figure (White Outline) */}
                    <circle cx="45" cy="45" r="7" stroke="white" strokeWidth="2.5" fill="none" />
                    <path d="M 35,55 L 25,45 L 45,35" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 45,52 L 80,75 L 130,45" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            {/* Right Bar */}
            <div className="flex items-end mb-2">
                <div className="w-2 md:w-3 h-8 md:h-10 bg-gradient-to-t from-orange-400 to-yellow-300 rounded-sm animate-[growBar_1s_ease-out_forwards]" style={{animationDelay: '0.8s'}}></div>
            </div>
        </div>

        {/* Text */}
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#ef4444] tracking-tight mb-2" 
            style={{ 
                fontFamily: '"Times New Roman", Times, serif', 
                background: 'linear-gradient(to right, #dc2626, #ea580c)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
          StockNap
        </h1>

        {/* Bottom Line */}
        <div className="w-64 md:w-80 h-1 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 rounded-full shadow-sm"></div>
      </div>

    </div>
  );
};

export default StockNap;