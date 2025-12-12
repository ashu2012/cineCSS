import React, { useMemo } from 'react';

const characters = 'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ9875210';

const Stream: React.FC<{ x: number; delay: number; duration: number; length: number }> = ({ x, delay, duration, length }) => {
  // Generate a static string of random chars for this stream to avoid constant re-rendering
  const chars = useMemo(() => {
    return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length)));
  }, [length]);

  return (
    <div
      className="absolute top-0 text-[#0f0] font-mono text-sm md:text-xl writing-vertical-rl opacity-0"
      style={{
        left: `${x}%`,
        animation: `matrixFall ${duration}s linear infinite`,
        animationDelay: `-${delay}s`,
        textOrientation: 'upright',
        writingMode: 'vertical-rl',
      }}
    >
      {chars.map((char, i) => (
        <span 
            key={i} 
            className={`${i === chars.length - 1 ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-[#00ff41]'} opacity-${Math.max(20, 100 - (chars.length - 1 - i) * 5)}`}
            style={{ textShadow: '0 0 5px rgba(0, 255, 65, 0.5)' }}
        >
          {char}
        </span>
      ))}
    </div>
  );
};

const MatrixRain: React.FC = () => {
  // Create a fixed number of streams
  const streams = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 5, // Slower fall for better visibility
      length: 10 + Math.floor(Math.random() * 15),
    }));
  }, []);

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      <style>
        {`
          @keyframes matrixFall {
            0% { transform: translateY(-100%); opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(110vh); opacity: 0; }
          }
        `}
      </style>
      <div className="absolute inset-0 bg-black z-0"></div>
      <div className="relative z-10 w-full h-full">
        {streams.map((s) => (
          <Stream key={s.id} {...s} />
        ))}
      </div>
      {/* CRT overlay effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
    </div>
  );
};

export default MatrixRain;