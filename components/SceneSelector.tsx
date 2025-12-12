import React from 'react';
import { SceneConfig, SceneType } from '../types';
import { Film, Eye, Zap, CloudRain, Search, Banknote, Pill, Newspaper, Send, ShoppingBag, FileText } from 'lucide-react';

interface SceneSelectorProps {
  scenes: SceneConfig[];
  currentSceneId: SceneType;
  onSelect: (id: SceneType) => void;
}

const SceneSelector: React.FC<SceneSelectorProps> = ({ scenes, currentSceneId, onSelect }) => {
  const getIcon = (id: SceneType) => {
    switch (id) {
      case SceneType.HAL_9000: return <Eye size={18} />;
      case SceneType.MATRIX: return <CloudRain size={18} />;
      case SceneType.MATRIX_PILLS: return <Pill size={18} />;
      case SceneType.HYPERSPACE: return <Zap size={18} />;
      case SceneType.NOIR: return <Film size={18} />;
      case SceneType.STOCK_NAP: return <Banknote size={18} />;
      case SceneType.NEWSPAPER: return <Newspaper size={18} />;
      case SceneType.NEWSPAPER_AIRPLANE: return <Send size={18} />;
      case SceneType.COMMERCE_SHOWCASE: return <ShoppingBag size={18} />;
      case SceneType.DOCUMENTATION: return <FileText size={18} />;
      case SceneType.AI_DIRECTOR: return <Search size={18} />;
      default: return <Film size={18} />;
    }
  };

  return (
    <div className="w-full md:w-80 bg-neutral-900 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col z-30 shadow-xl md:shadow-none h-auto md:h-full">
      <div className="p-4 md:p-6 border-b border-neutral-800 flex justify-between md:block items-center bg-neutral-900">
        <div>
            <h1 className="text-xl md:text-2xl font-bold font-mono tracking-tighter text-white flex items-center gap-2">
            <Film className="text-red-500" /> CineCSS
            </h1>
            <p className="text-[10px] md:text-xs text-neutral-500 mt-1 md:mt-2 hidden md:block">Pure CSS Cinematic Moments</p>
        </div>
        <div className="md:hidden text-[10px] text-neutral-500 font-mono border border-neutral-800 px-2 py-1 rounded">
            MENU
        </div>
      </div>
      
      {/* Scrollable list for mobile (horizontal) / desktop (vertical) */}
      <div className="flex-1 overflow-x-auto md:overflow-y-auto flex md:flex-col p-2 md:p-4 gap-2 scrollbar-hide">
        {scenes.map((scene) => (
          <button
            key={scene.id}
            onClick={() => onSelect(scene.id)}
            className={`flex-shrink-0 w-64 md:w-full text-left p-3 md:p-4 rounded-xl transition-all duration-300 group border relative ${
              currentSceneId === scene.id
                ? 'bg-neutral-800 border-neutral-700 shadow-lg'
                : 'bg-transparent border-transparent hover:bg-neutral-800/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
                <div className={`${currentSceneId === scene.id ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'}`}>
                    {getIcon(scene.id)}
                </div>
                <span className={`font-semibold text-sm ${currentSceneId === scene.id ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-200'}`}>
                    {scene.title}
                </span>
            </div>
            <div className="text-xs text-neutral-600 pl-8 truncate">
                {scene.movie} <span className="text-neutral-700">•</span> {scene.year}
            </div>
            
            {/* Active Indicator for Mobile */}
            {currentSceneId === scene.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-red-500 rounded-t-full md:hidden"></div>
            )}
          </button>
        ))}
      </div>
      
      <div className="hidden md:block p-4 border-t border-neutral-800">
        <div className="text-[10px] text-neutral-600 text-center font-mono">
          BUILT WITH REACT & TAILWIND
        </div>
      </div>
    </div>
  );
};

export default SceneSelector;