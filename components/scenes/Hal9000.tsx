import React from 'react';

const Hal9000: React.FC = () => {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center relative overflow-hidden">
      {/* Wrapper to scale down on very small screens */}
      <div className="transform scale-90 md:scale-100">
          {/* Metallic Plate */}
          <div className="relative w-64 h-96 bg-gradient-to-b from-neutral-800 to-black rounded-lg border border-neutral-800 shadow-2xl flex flex-col items-center justify-start py-12">
            {/* Nameplate */}
            <div className="w-full px-8 mb-8 flex justify-between items-center opacity-80">
              <div className="w-16 h-4 bg-blue-900/30 border border-blue-500/20 rounded-sm"></div>
              <div className="font-mono text-xs text-neutral-500 tracking-widest">HAL 9000</div>
            </div>

            {/* The Eye */}
            <div className="relative w-32 h-32 rounded-full bg-black border-4 border-neutral-700 shadow-[0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden">
                {/* Outer Rim Reflection */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50 z-20"></div>
                
                {/* The Lens */}
                <div className="w-24 h-24 rounded-full bg-red-900 relative flex items-center justify-center shadow-inner z-10">
                    {/* Glow Animation */}
                    <div className="absolute w-full h-full rounded-full bg-red-600 blur-md animate-[pulse_4s_ease-in-out_infinite]"></div>
                    
                    {/* Core */}
                    <div className="w-8 h-8 rounded-full bg-yellow-100 blur-[2px] shadow-[0_0_15px_10px_rgba(255,0,0,1)]"></div>
                </div>
            </div>

            {/* Reflections on the plate */}
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/5 to-transparent pointer-events-none"></div>
          </div>
      </div>
      
      {/* Ambient Red Glow */}
      <div className="absolute inset-0 bg-red-900/5 pointer-events-none mix-blend-screen"></div>
    </div>
  );
};

export default Hal9000;