import React from 'react';

const MatrixPills: React.FC = () => {
  return (
    <div className="w-full h-full bg-black relative overflow-hidden flex flex-col items-center justify-center font-mono">
      <style>
        {`
          @keyframes float-left {
            0% { transform: translateY(0px) rotate(-5deg); }
            50% { transform: translateY(-15px) rotate(-3deg); }
            100% { transform: translateY(0px) rotate(-5deg); }
          }
          @keyframes float-right {
            0% { transform: translateY(0px) rotate(5deg); }
            50% { transform: translateY(-20px) rotate(8deg); }
            100% { transform: translateY(0px) rotate(5deg); }
          }
          @keyframes glow-pulse {
            0% { opacity: 0.3; }
            50% { opacity: 0.6; }
            100% { opacity: 0.3; }
          }
        `}
      </style>

      {/* Ambient Background Code Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,50,0,0.4)_0%,_black_80%)]"></div>
      
      {/* Mirror Floor Reflection - Visible only on Desktop */}
      <div className="hidden md:block absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-green-900/10 to-transparent pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row gap-12 md:gap-32 items-center">
        
        {/* Blue Pill Option */}
        <div className="group flex flex-col items-center text-center max-w-xs transition-transform duration-500 hover:scale-105 cursor-pointer">
          <div 
            className="relative w-40 md:w-48 h-16 md:h-20 rounded-full shadow-[0_10px_30px_rgba(37,99,235,0.4)] animate-[float-left_4s_ease-in-out_infinite]"
            style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 50%, #172554 100%)'
            }}
          >
            {/* Gloss/Reflection */}
            <div className="absolute top-2 left-4 right-4 h-6 md:h-8 rounded-full bg-gradient-to-b from-white/30 to-transparent"></div>
            <div className="absolute bottom-2 right-8 w-2 h-2 rounded-full bg-white/40 blur-[1px]"></div>
          </div>
          
          <div className="mt-4 md:mt-8 space-y-1 md:space-y-2 opacity-90 md:opacity-80 group-hover:opacity-100 transition-opacity">
            <h3 className="text-blue-400 text-lg md:text-xl font-bold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">The Blue Pill</h3>
            <p className="text-blue-200/60 text-xs md:text-sm leading-relaxed">
              Delete account and<br/>go back to boring reality.
            </p>
          </div>
        </div>

        {/* OR Divider */}
        <div className="text-neutral-700 font-bold text-xl md:text-2xl animate-pulse">
            OR
        </div>

        {/* Red Pill Option */}
        <div className="group flex flex-col items-center text-center max-w-xs transition-transform duration-500 hover:scale-105 cursor-pointer">
           <div 
            className="relative w-40 md:w-48 h-16 md:h-20 rounded-full shadow-[0_10px_30px_rgba(220,38,38,0.4)] animate-[float-right_5s_ease-in-out_infinite]"
            style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 50%, #450a0a 100%)'
            }}
          >
            {/* Gloss/Reflection */}
            <div className="absolute top-2 left-4 right-4 h-6 md:h-8 rounded-full bg-gradient-to-b from-white/30 to-transparent"></div>
            <div className="absolute bottom-2 right-8 w-2 h-2 rounded-full bg-white/40 blur-[1px]"></div>
          </div>

          <div className="mt-4 md:mt-8 space-y-1 md:space-y-2 opacity-100 md:opacity-90 group-hover:opacity-100 transition-opacity">
            <h3 className="text-red-500 text-lg md:text-xl font-bold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">The Red Pill</h3>
            <p className="text-red-200/80 text-xs md:text-sm leading-relaxed font-semibold">
              Let's enjoy<br/>the ride.
            </p>
          </div>
        </div>

      </div>

      {/* Reflection on Floor - Only visible on Desktop */}
      <div className="hidden md:flex absolute bottom-20 gap-32 opacity-10 pointer-events-none scale-y-[-1] blur-sm mask-image-gradient">
         <div className="w-48 h-20 rounded-full bg-blue-700"></div>
         <div className="w-48 h-20 rounded-full bg-red-700"></div>
      </div>

    </div>
  );
};

export default MatrixPills;