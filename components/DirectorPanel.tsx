import React, { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { DirectorParams } from '../types';
import { analyzeSceneRequest } from '../services/geminiService';

interface DirectorPanelProps {
  onDirectorParamsChange: (params: DirectorParams) => void;
}

const DirectorPanel: React.FC<DirectorPanelProps> = ({ onDirectorParamsChange }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const result = await analyzeSceneRequest(prompt);
      if (result) {
        onDirectorParamsChange(result);
      } else {
        setError('Failed to interpret scene. Try being more descriptive.');
      }
    } catch (err) {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-auto md:right-8 md:w-96 bg-black/80 backdrop-blur-xl border border-neutral-700 p-4 md:p-6 rounded-2xl shadow-2xl z-50">
      <div className="flex items-center gap-2 mb-3 md:mb-4 text-purple-400">
        <Sparkles size={16} />
        <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest">AI Director Mode</h3>
      </div>
      
      <p className="text-[10px] md:text-xs text-neutral-400 mb-3 md:mb-4 hidden md:block">
        Describe a movie scene, mood, or concept. Gemini will generate an abstract visual representation.
      </p>
      
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe a scene..."
          className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-purple-500 h-16 md:h-24 resize-none mb-3 md:mb-4"
        />
        
        <button
          onClick={handleAnalyze}
          disabled={loading || !prompt.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Analyzing...
            </>
          ) : (
            'Generate Scene'
          )}
        </button>
      </div>

      {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
    </div>
  );
};

export default DirectorPanel;