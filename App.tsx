import React, { useState, useEffect } from 'react';
import SceneSelector from './components/SceneSelector';
import Hal9000 from './components/scenes/Hal9000';
import MatrixRain from './components/scenes/MatrixRain';
import MatrixPills from './components/scenes/MatrixPills';
import Hyperspace from './components/scenes/Hyperspace';
import Noir from './components/scenes/Noir';
import StockNap from './components/scenes/StockNap';
import Newspaper from './components/scenes/Newspaper';
import FlyingAirplaneNewspaper from './components/scenes/FlyingAirplaneNewspaper';
import DirectorScene from './components/scenes/DirectorScene';
import DirectorPanel from './components/DirectorPanel';
import Documentation from './components/scenes/Documentation';
import { SceneConfig, SceneType, DirectorParams } from './types';

const scenes: SceneConfig[] = [
  {
    id: SceneType.NEWSPAPER,
    title: "The Daily Code",
    movie: "Harry Potter",
    year: "2001",
    description: "A magical newspaper with moving images and 3D page turning interactions."
  },
  {
    id: SceneType.COMMERCE_SHOWCASE,
    title: "Commerce Experience",
    movie: "Product Demo",
    year: "2024",
    description: "A showcase of how 'The Daily Code' folding mechanics can revolutionize digital product storytelling."
  },
  {
    id: SceneType.NEWSPAPER_AIRPLANE,
    title: "Fold & Fly",
    movie: "Interactive",
    year: "2024",
    description: "Edit your newspaper and launch it into the sky. A playful take on content delivery."
  },
  {
    id: SceneType.DOCUMENTATION,
    title: "Documentation",
    movie: "README.md",
    year: "2024",
    description: "Project documentation, write-ups, and usage instructions."
  },
  {
    id: SceneType.HAL_9000,
    title: "Logic Memory Center",
    movie: "2001: A Space Odyssey",
    year: "1968",
    description: "The unblinking red eye of HAL 9000. A study in minimal geometric menace."
  },
  {
    id: SceneType.MATRIX,
    title: "Digital Rain",
    movie: "The Matrix",
    year: "1999",
    description: "Streaming green code representing the simulated reality. A classic falling text effect."
  },
  {
    id: SceneType.MATRIX_PILLS,
    title: "The Choice",
    movie: "The Matrix",
    year: "1999",
    description: "Blue pill or Red pill. A moment of truth suspended in reflection."
  },
  {
    id: SceneType.HYPERSPACE,
    title: "Light Speed",
    movie: "Star Wars",
    year: "1977",
    description: "The stretching of stars into streaks of light as the Millennium Falcon jumps to hyperspace."
  },
  {
    id: SceneType.NOIR,
    title: "Shadows & Fog",
    movie: "Generic Noir",
    year: "1940s",
    description: "Venetian blinds casting shadows in a smoke-filled room. High contrast and mystery."
  },
  {
    id: SceneType.STOCK_NAP,
    title: "StockNap Splash",
    movie: "App Concept",
    year: "2024",
    description: "An animated splash screen featuring a sleeping figure on a moon and falling money."
  },
  {
    id: SceneType.AI_DIRECTOR,
    title: "AI Director",
    movie: "Generative",
    year: "2024",
    description: "Describe a scene, and the AI will generate an abstract CSS composition for it."
  }
];

const App: React.FC = () => {
  const [currentSceneId, setCurrentSceneId] = useState<SceneType>(SceneType.NEWSPAPER);
  const [directorParams, setDirectorParams] = useState<DirectorParams | null>(null);

  // URL Parameter Handling: Initial Load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sceneParam = params.get('scene');
    
    // Check if the param is a valid SceneType
    const isValidScene = Object.values(SceneType).includes(sceneParam as SceneType);
    
    if (isValidScene) {
      setCurrentSceneId(sceneParam as SceneType);
    }
  }, []);

  // Update URL whenever scene changes
  const handleSceneSelect = (id: SceneType) => {
    setCurrentSceneId(id);
    
    // Update URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.set('scene', id);
    window.history.pushState({}, '', url);
  };

  const currentSceneConfig = scenes.find(s => s.id === currentSceneId);

  const renderScene = () => {
    switch (currentSceneId) {
      case SceneType.HAL_9000:
        return <Hal9000 />;
      case SceneType.MATRIX:
        return <MatrixRain />;
      case SceneType.MATRIX_PILLS:
        return <MatrixPills />;
      case SceneType.HYPERSPACE:
        return <Hyperspace />;
      case SceneType.NOIR:
        return <Noir />;
      case SceneType.STOCK_NAP:
        return <StockNap />;
      case SceneType.NEWSPAPER:
        return <Newspaper />;
      case SceneType.NEWSPAPER_AIRPLANE:
        return <FlyingAirplaneNewspaper />;
      case SceneType.COMMERCE_SHOWCASE:
        return <FlyingAirplaneNewspaper />;
      case SceneType.DOCUMENTATION:
        return <Documentation />;
      case SceneType.AI_DIRECTOR:
        return directorParams ? (
          <DirectorScene params={directorParams} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black text-neutral-600 flex-col gap-4">
             <div className="w-16 h-16 border-2 border-neutral-800 border-t-purple-500 rounded-full animate-spin"></div>
             <p className="font-mono text-sm">Waiting for Director Input...</p>
          </div>
        );
      default:
        return <FlyingAirplaneNewspaper />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-black overflow-hidden select-none">
      {/* Sidebar / Topbar */}
      <div className="flex-shrink-0 z-40 bg-neutral-900 md:h-full">
        <SceneSelector 
          scenes={scenes} 
          currentSceneId={currentSceneId} 
          onSelect={handleSceneSelect} 
        />
      </div>

      {/* Main Stage */}
      <div className="flex-1 relative h-full w-full overflow-hidden">
        {renderScene()}

        {/* Info Overlay */}
        <div className={`absolute top-4 left-4 md:top-8 md:left-8 z-20 pointer-events-none ${
          currentSceneId === SceneType.STOCK_NAP || 
          currentSceneId === SceneType.MATRIX_PILLS || 
          currentSceneId === SceneType.NEWSPAPER ||
          currentSceneId === SceneType.NEWSPAPER_AIRPLANE ||
          currentSceneId === SceneType.COMMERCE_SHOWCASE ||
          currentSceneId === SceneType.DOCUMENTATION ? 'hidden' : ''
        }`}>
          <h2 className="text-2xl md:text-4xl font-bold text-white/90 tracking-tighter mix-blend-difference mb-1">
            {currentSceneConfig?.title}
          </h2>
          <div className="text-[10px] md:text-sm font-mono text-white/60 bg-black/30 backdrop-blur-md px-3 py-1 inline-block rounded-full">
            {currentSceneConfig?.movie} ({currentSceneConfig?.year})
          </div>
        </div>

        {/* AI Director Controls */}
        {currentSceneId === SceneType.AI_DIRECTOR && (
           <DirectorPanel onDirectorParamsChange={setDirectorParams} />
        )}

        {/* Mood Description Overlay (AI Mode Only) */}
        {currentSceneId === SceneType.AI_DIRECTOR && directorParams && (
            <div className="absolute bottom-8 left-8 right-auto md:w-96 z-10 pointer-events-none">
                <div className="bg-black/50 backdrop-blur-md p-4 rounded-lg border-l-2 border-purple-500">
                    <p className="text-xs md:text-sm text-gray-300 italic">"{directorParams.moodDescription}"</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;