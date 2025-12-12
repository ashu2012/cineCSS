import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, ArrowDownToLine, Maximize2, Upload, FileText, Loader2 } from 'lucide-react';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

type FoldState = 'READING' | 'CLOSED_VERTICAL' | 'FOLDING_HORIZONTAL' | 'ON_TABLE';

const Newspaper: React.FC = () => {
  // State for content inputs
  const [headline, setHeadline] = useState('AI TAKES OVER HOLLYWOOD');
  const [images, setImages] = useState([
    'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800', // Cover (Img 0)
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800', // Page 2 (Img 1)
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800', // Page 3 (Img 2)
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800', // Page 4 (Img 3)
    'https://images.unsplash.com/photo-1469474932316-d6df4d5d7932?auto=format&fit=crop&q=80&w=800', // Page 5 (Img 4)
  ]);

  // State for page flipping (0 = cover visible, 1 = first spread open, etc)
  const [flippedIndex, setFlippedIndex] = useState(0);
  
  // State for folding sequence
  const [foldState, setFoldState] = useState<FoldState>('READING');

  // PDF Loading state
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSheets = 3; // Cover+P2, P3+P4, P5+P6
  const FOLD_DURATION = 1500; 

  // Sound Synthesis
  const playSound = (type: 'turn' | 'rustle' | 'thud' | 'fold') => {
    if (typeof window === 'undefined') return;
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    // Create Noise Buffer
    const bufferSize = ctx.sampleRate * (type === 'rustle' || type === 'fold' ? 1.0 : 0.5);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (type === 'turn') {
        filter.type = 'highpass';
        filter.frequency.value = 1200;
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    } else if (type === 'rustle') {
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    } else if (type === 'fold') {
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    } else if (type === 'thud') {
        filter.type = 'lowpass';
        filter.frequency.value = 150;
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    }

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  };

  const handleNext = () => {
    if (flippedIndex < totalSheets) {
        playSound('turn');
        setFlippedIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (flippedIndex > 0) {
        playSound('turn');
        setFlippedIndex(prev => prev - 1);
    }
  };

  const handleFold = () => {
    // 1. Vertical Fold (Close Pages)
    if (flippedIndex > 0) {
        playSound('turn');
        setFlippedIndex(0);
        
        // Wait for vertical close animation (1000ms duration) to fully complete
        setTimeout(() => {
            setFoldState('CLOSED_VERTICAL');
            // Small buffer before starting horizontal fold
            setTimeout(() => {
                 startHorizontalFold();
            }, 100);
        }, 1100);
    } else {
        startHorizontalFold();
    }
  };

  const startHorizontalFold = () => {
      // 2. Start Horizontal Fold
      setFoldState('FOLDING_HORIZONTAL');
      playSound('fold');

      // Wait for fold animation then drop to table
      setTimeout(() => {
          setFoldState('ON_TABLE');
          // Wait for drop animation to hit
          setTimeout(() => playSound('thud'), 600);
      }, FOLD_DURATION);
  };

  const handleUnfold = () => {
      if (foldState === 'ON_TABLE') {
          playSound('rustle');
          // Reverse: Lift from table
          setFoldState('FOLDING_HORIZONTAL');
          
          setTimeout(() => {
              // Unfold Horizontal
              setFoldState('CLOSED_VERTICAL'); // Or READING
              playSound('fold'); // Reverse fold sound
              
              setTimeout(() => {
                setFoldState('READING');
              }, 600);
          }, FOLD_DURATION);
      }
  };

  const updateImage = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;

    setIsPdfLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // We want to slice the PDF content continuously.
      // 1. Determine dimensions.
      // Newspaper Content Width = 352px (roughly).
      // Heights:
      // Img 0 (Cover): 192px
      // Img 1 (Pg 2): 226px
      // Img 2 (Pg 3): 160px
      // Img 3 (Pg 4): 160px
      // Img 4 (Pg 5): 160px
      // Total needed height relative to width 352: ~898px.
      
      // 2. Create a "Source Roll" canvas.
      const sourceWidth = 1000; // High res width
      // Scale factor = 1000 / 352 ~= 2.84
      const scaleFactor = sourceWidth / 352;
      
      const targetHeights = [
          192 * scaleFactor, // Slot 0
          226 * scaleFactor, // Slot 1
          160 * scaleFactor, // Slot 2
          160 * scaleFactor, // Slot 3
          160 * scaleFactor, // Slot 4
      ];
      
      const totalHeightNeeded = targetHeights.reduce((a, b) => a + b, 0);
      
      // Render PDF pages onto a temp canvas until we have enough height
      const rollCanvas = document.createElement('canvas');
      rollCanvas.width = sourceWidth;
      rollCanvas.height = totalHeightNeeded + 2000; // Extra buffer
      const rollCtx = rollCanvas.getContext('2d');
      if (!rollCtx) throw new Error("No context");
      
      rollCtx.fillStyle = '#ffffff';
      rollCtx.fillRect(0, 0, rollCanvas.width, rollCanvas.height);

      let currentPdfY = 0;
      const maxPdfPages = Math.min(pdf.numPages, 4); // Limit to first 4 pages

      for (let i = 0; i < maxPdfPages; i++) {
          const page = await pdf.getPage(i + 1);
          const viewport = page.getViewport({ scale: sourceWidth / page.getViewport({ scale: 1 }).width });
          
          // Draw this page onto the roll
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = viewport.width;
          pageCanvas.height = viewport.height;
          const pageCtx = pageCanvas.getContext('2d');
          
          if (pageCtx) {
               pageCtx.fillStyle = '#ffffff';
               pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
               await page.render({ canvasContext: pageCtx, viewport }).promise;
               
               // Copy to roll
               rollCtx.drawImage(pageCanvas, 0, currentPdfY);
               currentPdfY += viewport.height;
          }
          
          if (currentPdfY >= totalHeightNeeded) break;
      }

      // 3. Slice
      const newImages = [...images];
      let sliceY = 0;
      
      for (let i = 0; i < 5; i++) {
          const h = targetHeights[i];
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = sourceWidth;
          sliceCanvas.height = h;
          const sliceCtx = sliceCanvas.getContext('2d');
          
          if (sliceCtx) {
              sliceCtx.drawImage(rollCanvas, 0, sliceY, sourceWidth, h, 0, 0, sourceWidth, h);
              newImages[i] = sliceCanvas.toDataURL('image/jpeg', 0.85);
              sliceY += h;
          }
      }

      setImages(newImages);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Auto open if folded
      if (foldState !== 'READING') handleUnfold();

    } catch (err) {
      console.error("PDF Error:", err);
      alert("Failed to process PDF file.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Helper to determine image style based on content type
  const getImageClassName = (src: string) => {
    return "w-full h-full object-cover object-top bg-white";
  };

  // Helper to render consistent cover content
  const renderCoverContent = () => (
    <div className="absolute inset-0 bg-[#f4f1ea] shadow-[inset_2px_0_5px_rgba(0,0,0,0.1)] p-6 flex flex-col h-full overflow-hidden">
        {/* Blocking layer for opacity */}
        <div className="absolute inset-0 bg-[#f4f1ea] -z-10"></div>
        
        <div className="text-center border-b-2 border-black pb-4 mb-4">
            <h1 className="font-serif text-4xl font-black tracking-tight text-black mb-1">THE CINE TIMES</h1>
            <div className="flex justify-between text-[9px] font-sans font-bold text-neutral-600 border-t border-black pt-1 mt-1">
                <span>VOL. CCLIV</span>
                <span>CSS EDITION</span>
                <span>$1.50</span>
            </div>
        </div>
        
        <h2 className="font-serif text-3xl font-bold leading-none mb-3 text-neutral-900 line-clamp-2">{headline}</h2>
        
        <div className="w-full h-48 bg-neutral-300 mb-4 overflow-hidden relative grayscale contrast-110 shrink-0">
            <img src={images[0]} alt="Cover" className={getImageClassName(images[0])} />
            <div className="absolute bottom-0 left-0 bg-black text-white text-[8px] px-1 py-0.5">FIG 1.1</div>
        </div>

        <div className="columns-2 gap-4 text-[10px] font-serif text-justify leading-tight text-neutral-800">
            <p className="mb-2"><span className="font-bold text-2xl float-left mr-1 leading-none mt-[-2px]">L</span>orem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.</p>
            <p>Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit.</p>
            <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        </div>
        
        {/* Page Number */}
        <div className="absolute bottom-4 right-4 z-50 font-serif text-[12px] font-bold text-neutral-900 bg-white/50 px-1 rounded-sm backdrop-blur-[1px]">1</div>
    </div>
  );

  const getPropTransform = () => {
      switch (foldState) {
          case 'ON_TABLE':
              return 'translateY(100px) translateZ(-100px) rotateX(70deg) rotateZ(-10deg) scale(0.6)';
          case 'FOLDING_HORIZONTAL':
              return 'translateY(125px) rotateX(0) scale(1)';
          default:
              return 'translateY(0) rotateX(0) scale(1)';
      }
  };

  const faceStyle: React.CSSProperties = {
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] flex flex-col relative overflow-hidden">
      {/* 3D Scene Container */}
      <div className="flex-1 flex items-center justify-center overflow-hidden py-8 relative">
        
        {/* Navigation Arrows */}
        <div className="absolute flex justify-between w-full max-w-[320px] sm:max-w-[450px] md:max-w-[600px] lg:max-w-[850px] xl:max-w-[950px] px-4 pointer-events-none z-50">
             <button 
                onClick={handlePrev}
                disabled={flippedIndex === 0}
                className={`pointer-events-auto p-3 md:p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all ${foldState !== 'READING' ? 'opacity-0' : 'opacity-100'}`}
            >
                <ArrowLeft size={32} />
            </button>
            <button 
                onClick={handleNext}
                disabled={flippedIndex === totalSheets}
                className={`pointer-events-auto p-3 md:p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all ${foldState !== 'READING' ? 'opacity-0' : 'opacity-100'}`}
            >
                <ArrowRight size={32} />
            </button>
        </div>

        {/* Scaled Wrapper for 3D Content */}
        <div className="transform scale-[0.35] sm:scale-[0.5] md:scale-[0.65] lg:scale-[0.85] xl:scale-100 transition-transform duration-300 origin-center flex items-center justify-center pointer-events-none">
            
            {/* The Stage */}
            <div className="relative w-[800px] h-[500px] perspective-[1500px] flex items-center justify-center pointer-events-auto">
                
                {/* --- Mode 1: Interactive Reading Book --- */}
                <div 
                    className={`relative w-full h-full transition-all duration-1000 ease-in-out ${
                        (foldState === 'READING' || foldState === 'CLOSED_VERTICAL') ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'
                    }`}
                    style={{ 
                        transformStyle: 'preserve-3d',
                        transform: flippedIndex === 0 ? 'translateX(-200px)' : 'translateX(0px)' 
                    }}
                >
                    {/* Left Base (Empty Desk) */}
                    <div 
                        className={`absolute top-0 bottom-0 right-[50%] w-[400px] bg-[#e5e5e5] rounded-l-md shadow-2xl flex items-center justify-center border-r border-neutral-300 transition-opacity duration-500 ${flippedIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
                        style={{ transform: 'translateZ(-50px)' }}
                    >
                        <div className="text-neutral-300 font-serif rotate-[-5deg]">End of Paper</div>
                    </div>

                    {/* Right Base (Back Cover Backdrop) */}
                    <div 
                        className="absolute top-0 bottom-0 left-[50%] w-[400px] bg-[#f4f1ea] rounded-r-md shadow-xl p-6 flex flex-col border-l border-neutral-300"
                        style={{ transform: 'translateZ(-50px)' }}
                    >
                        <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-300 pb-2 mb-4">Back Cover</div>
                        <div className="flex-1 border-2 border-dashed border-neutral-300 flex items-center justify-center">
                            <span className="text-neutral-400 font-serif italic">Subscription Card</span>
                        </div>
                    </div>

                    {/* Sheet 2 (Pages 5 & 6) */}
                    <div 
                        className={`absolute top-0 left-[50%] w-[400px] h-full transition-transform duration-1000 ease-[cubic-bezier(0.645,0.045,0.355,1)] transform-style-3d origin-left`}
                        style={{ 
                            transform: `rotateY(${flippedIndex >= 3 ? -180 : 0}deg) translateZ(5px)` 
                        }}
                    >
                        {/* Front (Page 5) */}
                        <div 
                            className="absolute inset-0 bg-[#f4f1ea] shadow-[inset_10px_0_20px_rgba(0,0,0,0.1)] p-6 flex flex-col" 
                            style={{ ...faceStyle, transform: 'translateZ(1px)' }}
                        >
                            <div className="absolute inset-0 bg-[#f4f1ea] -z-10"></div>
                            <div className="flex justify-between text-[10px] text-neutral-500 border-b border-black mb-4 pb-1 font-serif">
                                <span>TRAVEL</span>
                                <span>PAGE 5</span>
                            </div>
                            <h3 className="text-xl font-serif font-bold text-neutral-800 mb-2 leading-tight">Escaping The Matrix</h3>
                            <div className="w-full h-40 bg-neutral-200 mb-3 overflow-hidden grayscale contrast-125">
                                <img src={images[4]} alt="Page 5" className={getImageClassName(images[4])} />
                            </div>
                            <div className="flex-1 columns-2 gap-4 text-[9px] text-justify font-serif text-neutral-700 leading-3">
                                <p className="mb-2">Exploring the hidden corners of the digital world. Why simulations feel more real than reality.</p>
                                <p>Pack your bags for a journey into the unknown depths of code.</p>
                            </div>
                            <div className="absolute bottom-4 right-4 z-50 font-serif text-[12px] font-bold text-neutral-900 bg-white/50 px-1 rounded-sm backdrop-blur-[1px]">5</div>
                        </div>
                        {/* Back (Page 6) */}
                        <div 
                            className="absolute inset-0 bg-[#f4f1ea] shadow-[inset_-10px_0_20px_rgba(0,0,0,0.1)] p-6 flex flex-col rounded-l-md" 
                            style={{ ...faceStyle, transform: 'rotateY(180deg) translateZ(1px)' }}
                        >
                            <div className="absolute inset-0 bg-[#f4f1ea] -z-10"></div>
                            <div className="flex-1 flex flex-col items-center justify-center border-4 double border-neutral-800 p-4">
                                <div className="font-serif text-xl font-bold">The End</div>
                            </div>
                            <div className="absolute bottom-4 left-4 z-50 font-serif text-[12px] font-bold text-neutral-900 bg-white/50 px-1 rounded-sm backdrop-blur-[1px]">6</div>
                        </div>
                    </div>

                    {/* Sheet 1 (Pages 3 & 4) */}
                    <div 
                        className={`absolute top-0 left-[50%] w-[400px] h-full transition-transform duration-1000 ease-[cubic-bezier(0.645,0.045,0.355,1)] transform-style-3d origin-left`}
                        style={{ 
                            transform: `rotateY(${flippedIndex >= 2 ? -180 : 0}deg) translateZ(10px)` 
                        }}
                    >
                        {/* Front (Page 3) */}
                        <div 
                            className="absolute inset-0 bg-[#f4f1ea] shadow-[inset_10px_0_20px_rgba(0,0,0,0.1)] p-6 flex flex-col" 
                            style={{ ...faceStyle, transform: 'translateZ(1px)' }}
                        >
                            <div className="absolute inset-0 bg-[#f4f1ea] -z-10"></div>
                            <div className="flex justify-between text-[10px] text-neutral-500 border-b border-black mb-4 pb-1 font-serif">
                                <span>LIFESTYLE</span>
                                <span>PAGE 3</span>
                            </div>
                            <h3 className="text-xl font-serif font-bold text-neutral-800 mb-2 leading-tight">Modern Tech Aesthetics</h3>
                            <div className="w-full h-40 bg-neutral-200 mb-3 overflow-hidden grayscale contrast-125 sepia-[.3]">
                                <img src={images[2]} alt="Page 3" className={getImageClassName(images[2])} />
                            </div>
                            <div className="flex-1 columns-2 gap-4 text-[9px] text-justify font-serif text-neutral-700 leading-3">
                                <p className="mb-2">In a world dominated by screens, the return to tactile design is imminent. We explore the latest trends in retro-futurism.</p>
                                <p>The convergence of digital and physical mediums creates a new canvas for creators.</p>
                            </div>
                            <div className="absolute bottom-4 right-4 z-50 font-serif text-[12px] font-bold text-neutral-900 bg-white/50 px-1 rounded-sm backdrop-blur-[1px]">3</div>
                        </div>
                        {/* Back (Page 4) */}
                        <div 
                            className="absolute inset-0 bg-[#f4f1ea] shadow-[inset_-10px_0_20px_rgba(0,0,0,0.1)] p-6 flex flex-col rounded-l-md" 
                            style={{ ...faceStyle, transform: 'rotateY(180deg) translateZ(1px)' }}
                        >
                            <div className="absolute inset-0 bg-[#f4f1ea] -z-10"></div>
                            <div className="flex justify-between text-[10px] text-neutral-500 border-b border-black mb-4 pb-1 font-serif">
                                <span>SCIENCE</span>
                                <span>PAGE 4</span>
                            </div>
                            <h3 className="text-xl font-serif font-bold text-neutral-800 mb-2 leading-tight">Quantum CSS</h3>
                            <div className="w-full h-40 bg-neutral-200 mb-3 overflow-hidden grayscale contrast-125">
                                <img src={images[3]} alt="Page 4" className={getImageClassName(images[3])} />
                            </div>
                            <div className="flex-1 text-[9px] text-justify font-serif text-neutral-700 leading-3">
                                <p>Can an element be both visible and hidden? Schrödinger's Div explains all.</p>
                            </div>
                            <div className="absolute bottom-4 left-4 z-50 font-serif text-[12px] font-bold text-neutral-900 bg-white/50 px-1 rounded-sm backdrop-blur-[1px]">4</div>
                        </div>
                    </div>

                    {/* Sheet 0 (Cover & Page 2) */}
                    <div 
                        className={`absolute top-0 left-[50%] w-[400px] h-full transition-transform duration-1000 ease-[cubic-bezier(0.645,0.045,0.355,1)] transform-style-3d origin-left`}
                        style={{ 
                            transform: `rotateY(${flippedIndex >= 1 ? -180 : 0}deg) translateZ(15px)` 
                        }}
                    >
                        {/* Front (Cover) */}
                        <div 
                            className="absolute inset-0 bg-[#f4f1ea]" 
                            style={{ ...faceStyle, transform: 'translateZ(1px)' }}
                        >
                            {renderCoverContent()}
                        </div>
                        {/* Back (Page 2) */}
                        <div 
                            className="absolute inset-0 bg-[#f4f1ea] shadow-[inset_-10px_0_20px_rgba(0,0,0,0.05)] p-6 flex flex-col rounded-l-md" 
                            style={{ ...faceStyle, transform: 'rotateY(180deg) translateZ(1px)' }}
                        >
                            <div className="absolute inset-0 bg-[#f4f1ea] -z-10"></div>
                            <div className="flex justify-between text-[10px] text-neutral-500 border-b border-black mb-4 pb-1 font-serif">
                                <span>OPINION</span>
                                <span>PAGE 2</span>
                            </div>
                            <div className="flex flex-col h-full">
                                <div className="w-full h-1/2 bg-neutral-800 mb-4 overflow-hidden relative">
                                    <img src={images[1]} alt="Page 2" className={getImageClassName(images[1])} />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        {!images[1].startsWith('data:') && <h3 className="text-white font-serif text-2xl font-bold text-center px-4 drop-shadow-md">"Why We Love Animation"</h3>}
                                    </div>
                                </div>
                                <div className="columns-2 gap-3 text-[9px] font-serif text-justify leading-3 text-neutral-700">
                                    <p>Unlike video, CSS animations are lightweight and crisp. They breathe life into the DOM without the weight of heavy assets.</p>
                                    <p className="mt-2">This newspaper itself is merely a collection of divs, rotated in 3D space. No WebGL, no canvas. Just pure geometry and style.</p>
                                </div>
                            </div>
                            <div className="absolute bottom-4 left-4 z-50 font-serif text-[12px] font-bold text-neutral-900 bg-white/50 px-1 rounded-sm backdrop-blur-[1px]">2</div>
                        </div>
                    </div>
                </div>

                {/* --- Mode 2: Folding Prop --- */}
                <div 
                    className={`relative w-[400px] h-[500px] transition-all ease-[cubic-bezier(0.645,0.045,0.355,1)] ${
                        (foldState === 'FOLDING_HORIZONTAL' || foldState === 'ON_TABLE') ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'
                    } ${foldState === 'ON_TABLE' ? 'cursor-pointer group' : ''}`}
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: getPropTransform(),
                        transitionDuration: `${FOLD_DURATION}ms`
                    }}
                    onClick={handleUnfold}
                >
                    {/* Hover hint */}
                    <div className={`absolute -top-32 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full backdrop-blur-md opacity-0 transition-opacity duration-300 pointer-events-none flex items-center gap-2 ${foldState === 'ON_TABLE' ? 'group-hover:opacity-100' : ''}`} style={{ transform: 'rotateX(-70deg)' }}>
                        <Maximize2 size={16} />
                        <span>Click to Unfold</span>
                    </div>

                    {/* Top Half (Visible & Static) */}
                    <div className="absolute top-0 w-full h-[250px] overflow-hidden z-20 bg-[#f4f1ea] backface-hidden shadow-md">
                        <div className="w-full h-[500px] relative">
                            {renderCoverContent()}
                        </div>
                        <div 
                            className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none transition-opacity"
                            style={{ 
                                opacity: (foldState === 'FOLDING_HORIZONTAL' || foldState === 'ON_TABLE') ? 1 : 0, 
                                transitionDuration: `${FOLD_DURATION}ms`,
                                transitionTimingFunction: 'cubic-bezier(0.645,0.045,0.355,1)'
                            }} 
                        />
                    </div>

                    {/* Bottom Half (Folds Under) */}
                    <div 
                        className="absolute top-[250px] w-full h-[250px] origin-[50%_0] transform-style-3d transition-transform ease-[cubic-bezier(0.645,0.045,0.355,1)] z-10"
                        style={{
                            transform: (foldState === 'FOLDING_HORIZONTAL' || foldState === 'ON_TABLE') ? 'rotateX(-179deg)' : 'rotateX(0deg)',
                            transitionDuration: `${FOLD_DURATION}ms`
                        }}
                    >
                        <div className="absolute inset-0 overflow-hidden bg-[#f4f1ea] backface-hidden">
                            <div className="w-full h-[500px] relative -top-[250px]">
                                {renderCoverContent()}
                            </div>
                            <div 
                                className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent pointer-events-none transition-opacity" 
                                style={{ 
                                    opacity: (foldState === 'FOLDING_HORIZONTAL' || foldState === 'ON_TABLE') ? 1 : 0,
                                    transitionDuration: `${FOLD_DURATION}ms`,
                                    transitionTimingFunction: 'cubic-bezier(0.645,0.045,0.355,1)'
                                }} 
                            />
                        </div>

                        <div 
                            className="absolute inset-0 bg-[#e5e5e5] backface-hidden flex items-center justify-center border border-neutral-300 shadow-inner"
                            style={{ transform: 'rotateX(180deg)' }}
                        >
                            <span className="text-neutral-400 text-xs font-serif rotate-180">CineCSS Times</span>
                            <div className="absolute top-0 w-full h-12 bg-gradient-to-b from-black/10 to-transparent rotate-180"></div>
                        </div>
                    </div>
                </div>

            </div>

        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-neutral-900 border-t border-neutral-800 p-4 md:p-6 z-30 overflow-y-auto h-auto max-h-[30vh] md:h-64">
        <div className="max-w-4xl mx-auto flex flex-col h-full justify-between gap-4">
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs md:text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Editor's Desk
                    </h3>
                    
                    {/* PDF Upload Button */}
                    <div className="relative">
                        <input 
                            type="file" 
                            accept=".pdf" 
                            onChange={handlePdfUpload}
                            className="hidden" 
                            ref={fileInputRef}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isPdfLoading}
                            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] md:text-xs px-3 py-1.5 rounded-full border border-neutral-700 transition-all"
                        >
                            {isPdfLoading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                            {isPdfLoading ? 'Processing PDF...' : 'Import PDF Pages'}
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3">
                    <div className="space-y-1 col-span-2 md:col-span-1">
                        <label className="text-[10px] text-neutral-500 font-mono">HEADLINE</label>
                        <input 
                            type="text" 
                            value={headline}
                            onChange={(e) => setHeadline(e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-green-500"
                        />
                    </div>
                    {images.map((img, i) => (
                        <div key={i} className="space-y-1">
                            <label className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                                <FileText size={8} />
                                {i === 0 ? 'COVER' : `PG ${i + 1}`}
                            </label>
                            <input 
                                type="text" 
                                value={img.length > 50 && img.startsWith('data:') ? 'PDF Page Loaded' : img}
                                onChange={(e) => updateImage(i, e.target.value)}
                                disabled={img.startsWith('data:')}
                                className={`w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none focus:border-green-500 truncate ${img.startsWith('data:') ? 'italic text-green-500/70 cursor-not-allowed' : ''}`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Fold Control Button */}
            <div className="flex justify-center md:mt-4">
                <button
                    onClick={handleFold}
                    disabled={foldState !== 'READING'}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-serif text-sm border transition-all shadow-lg active:scale-95 ${
                        foldState !== 'READING'
                        ? 'bg-neutral-800/50 text-neutral-600 border-neutral-800 cursor-default'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700 hover:shadow-xl'
                    }`}
                >
                    <ArrowDownToLine size={16} />
                    {foldState === 'READING' ? 'Fold & Place on Table' : 'Folded'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Newspaper;