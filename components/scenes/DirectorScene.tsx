import React from 'react';
import { DirectorParams } from '../../types';

interface DirectorSceneProps {
  params: DirectorParams;
}

const DirectorScene: React.FC<DirectorSceneProps> = ({ params }) => {
  const { primaryColor, secondaryColor, accentColor, animationSpeed, shape } = params;

  const getDuration = () => {
    switch (animationSpeed) {
      case 'slow': return '10s';
      case 'fast': return '2s';
      default: return '5s';
    }
  };

  const duration = getDuration();

  return (
    <div 
        className="w-full h-full relative overflow-hidden flex items-center justify-center transition-colors duration-1000"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, #000)` }}
    >
      <style>
        {`
          @keyframes float {
            0% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(30px, -50px) rotate(10deg); }
            66% { transform: translate(-20px, 20px) rotate(-5deg); }
            100% { transform: translate(0, 0) rotate(0deg); }
          }
          @keyframes pulse-custom {
            0% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.2); opacity: 0.8; }
            100% { transform: scale(1); opacity: 0.5; }
          }
          @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Background Shapes */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 mix-blend-screen">
         {Array.from({ length: 5 }).map((_, i) => (
             <div 
                key={i}
                className={`absolute border-[2px] border-white/20`}
                style={{
                    width: `${(i + 1) * 200}px`,
                    height: `${(i + 1) * 200}px`,
                    borderRadius: shape === 'circle' ? '50%' : shape === 'line' ? '0' : '20px',
                    borderColor: i % 2 === 0 ? secondaryColor : accentColor,
                    animation: `spin-slow ${parseFloat(duration) * (i + 1)}s linear infinite`,
                    transformOrigin: 'center'
                }}
             />
         ))}
      </div>

      {/* Hero Element */}
      <div 
        className="relative z-10 blur-xl mix-blend-overlay"
        style={{
            width: '300px',
            height: '300px',
            backgroundColor: accentColor,
            borderRadius: shape === 'circle' ? '50%' : '10px',
            animation: `pulse-custom ${duration} ease-in-out infinite`
        }}
      ></div>

      <div 
        className="absolute z-20"
        style={{
            width: '200px',
            height: '200px',
            border: `4px solid ${secondaryColor}`,
            borderRadius: shape === 'circle' ? '50%' : '0px',
            animation: `float ${duration} ease-in-out infinite`
        }}
      ></div>
      
      {/* Noise Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
    </div>
  );
};

export default DirectorScene;