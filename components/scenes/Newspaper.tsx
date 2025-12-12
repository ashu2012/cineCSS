import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, ArrowDownToLine, Maximize2, Upload, FileText, Loader2, Settings, Volume2, VolumeX, Clock, Sun, Palette, Zap, Type, MoveHorizontal, GripHorizontal, Pencil, Check, Move, MousePointer2, X, Plus, Image as ImageIcon, Trash2, Link as LinkIcon, ExternalLink } from 'lucide-react';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker for handling PDF uploads
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

/**
 * FoldState definitions:
 * READING: The newspaper is open and pages can be flipped.
 * CLOSED_VERTICAL: The book is closed (cover visible), preparing to fold.
 * FOLDING_HORIZONTAL: The newspaper is folding in half horizontally.
 * ON_TABLE: The newspaper is fully folded and resting on the table.
 */
type FoldState = 'READING' | 'CLOSED_VERTICAL' | 'FOLDING_HORIZONTAL' | 'ON_TABLE';

type FontStyle = 'classic' | 'typewriter' | 'modern';

interface SceneConfig {
    foldDuration: number;
    turnDuration: number;
    volume: number;
    isMuted: boolean;
    paperColor: string;
    lighting: number;
    fontStyle: FontStyle;
    publicationTitle: string;
}

interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface PageElement extends Box {
    id: string;
    type: 'headline' | 'text' | 'image';
    content: string;
    link?: string;
    zIndex: number;
}

const FONT_STYLES: Record<FontStyle, React.CSSProperties> = {
    classic: { fontFamily: '"Times New Roman", Times, serif' },
    typewriter: { fontFamily: '"Courier New", Courier, monospace', letterSpacing: '-0.5px' },
    modern: { fontFamily: '"Inter", sans-serif', letterSpacing: '-0.2px' }
};

// --- Resizable Box Helper ---
const ResizableBox: React.FC<{
    element: PageElement;
    onUpdate: (newBox: Partial<PageElement>) => void;
    onDelete: () => void;
    isActive: boolean;
    scale: number;
    children: React.ReactNode;
}> = ({ element, onUpdate, onDelete, isActive, scale, children }) => {
    const nodeRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef<{ startX: number; startY: number; startBox: Box; mode: 'move' | 'resize' } | null>(null);

    const handleMouseDown = (e: React.MouseEvent, mode: 'move' | 'resize') => {
        if (!isActive) return;
        e.stopPropagation();
        e.preventDefault();
        draggingRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startBox: { x: element.x, y: element.y, w: element.w, h: element.h },
            mode
        };
    };

    useEffect(() => {
        if (!isActive) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!draggingRef.current) return;
            const { startX, startY, startBox, mode } = draggingRef.current;
            
            // Adjust delta by the scene scale to ensure 1:1 mouse tracking
            const deltaX = (e.clientX - startX) / scale;
            const deltaY = (e.clientY - startY) / scale;

            if (mode === 'move') {
                onUpdate({
                    x: startBox.x + deltaX,
                    y: startBox.y + deltaY
                });
            } else {
                onUpdate({
                    w: Math.max(20, startBox.w + deltaX),
                    h: Math.max(20, startBox.h + deltaY)
                });
            }
        };

        const handleMouseUp = () => {
            draggingRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isActive, onUpdate, scale]);

    const isLink = !!element.link && !isActive;

    return (
        <div
            ref={nodeRef}
            className={`absolute ${isActive ? 'cursor-move ring-2 ring-blue-500 hover:bg-black/5' : ''}`}
            style={{
                left: element.x,
                top: element.y,
                width: element.w,
                height: element.h,
                zIndex: isActive ? 1000 : element.zIndex
            }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
        >
            {/* Render Content */}
            <div className={`w-full h-full overflow-hidden ${isActive ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                {isLink ? (
                    <a 
                        href={element.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block w-full h-full cursor-pointer hover:opacity-80 transition-opacity relative group"
                        title={element.link}
                    >   
                        {/* Link Hint Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-blue-500/10 transition-colors flex items-center justify-center">
                            <ExternalLink size={16} className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                        </div>
                        {children}
                    </a>
                ) : (
                    children
                )}
            </div>

            {/* Render Edit UI */}
            {isActive && (
                <>
                     {/* Resize Handle */}
                    <div
                        className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-nwse-resize z-50 flex items-center justify-center"
                        onMouseDown={(e) => handleMouseDown(e, 'resize')}
                    >
                        <div className="w-2 h-2 border-r border-b border-white"></div>
                    </div>
                    {/* Type Label */}
                    <div className="absolute -top-5 left-0 bg-blue-500 text-white text-[9px] px-1 rounded-t uppercase font-bold tracking-wider pointer-events-none whitespace-nowrap flex items-center gap-1">
                        {element.type}
                        {element.link && <LinkIcon size={8} />}
                    </div>
                    {/* Delete Button */}
                    <button 
                        onMouseDown={(e) => e.stopPropagation()} // Prevent drag start
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm z-50 transition-transform hover:scale-110 active:scale-90 cursor-pointer"
                        title="Remove Element"
                    >
                        <X size={10} />
                    </button>
                </>
            )}
        </div>
    );
};


const Newspaper: React.FC = () => {
  // --- State Management ---
  
  // Layout State
  const [controlPanelHeight, setControlPanelHeight] = useState(350);
  const [sceneScale, setSceneScale] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);

  const sceneWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Configuration State
  const [config, setConfig] = useState<SceneConfig>({
      foldDuration: 1500,
      turnDuration: 1000,
      volume: 0.3,
      isMuted: false,
      paperColor: '#f4f1ea',
      lighting: 1.0,
      fontStyle: 'classic',
      publicationTitle: 'THE CINE TIMES'
  });

  // Unified Pages State
  const [pages, setPages] = useState<PageElement[][]>([
    // Page 0 (Cover)
    [
        { id: 'h1', type: 'headline', x: 24, y: 120, w: 352, h: 70, content: 'AI TAKES OVER HOLLYWOOD', zIndex: 1 },
        { id: 'i1', type: 'image', x: 24, y: 200, w: 352, h: 180, content: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800', zIndex: 1 },
        { id: 't1', type: 'text', x: 24, y: 390, w: 352, h: 80, content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.", zIndex: 1 }
    ],
    // Page 1 (Opinion - Page 2)
    [
        { id: 'i2', type: 'image', x: 24, y: 60, w: 352, h: 220, content: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800', zIndex: 1 },
        { id: 't2', type: 'text', x: 24, y: 290, w: 352, h: 180, content: "Unlike video, CSS animations are lightweight and crisp. They breathe life into the DOM without the weight of heavy assets.", zIndex: 1 }
    ],
    // Page 2 (Lifestyle - Page 3)
    [
        { id: 'i3', type: 'image', x: 24, y: 60, w: 352, h: 180, content: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800', zIndex: 1 },
        { id: 't3', type: 'text', x: 24, y: 250, w: 352, h: 220, content: "In a world dominated by screens, the return to tactile design is imminent. We explore the latest trends in retro-futurism.", zIndex: 1 }
    ],
    // Page 3 (Science - Page 4)
    [
        { id: 'i4', type: 'image', x: 24, y: 60, w: 352, h: 180, content: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800', zIndex: 1 },
        { id: 't4', type: 'text', x: 24, y: 250, w: 352, h: 220, content: "Can an element be both visible and hidden? Schrödinger's Div explains all.", zIndex: 1 }
    ],
    // Page 4 (Travel - Page 5)
    [
        { id: 'i5', type: 'image', x: 24, y: 60, w: 352, h: 180, content: 'https://images.unsplash.com/photo-1469474932316-d6df4d5d7932?auto=format&fit=crop&q=80&w=800', zIndex: 1 },
        { id: 't5', type: 'text', x: 24, y: 250, w: 352, h: 220, content: "Exploring the hidden corners of the digital world. Why simulations feel more real than reality.", zIndex: 1 }
    ],
    // Page 5 (Back Cover - Page 6)
    [
        { id: 'end', type: 'text', x: 50, y: 200, w: 300, h: 100, content: "The End", zIndex: 1 }
    ]
  ]);

  const updatePageElement = (pageIndex: number, elementId: string, updates: Partial<PageElement>) => {
      setPages(prev => {
          const newPages = [...prev];
          newPages[pageIndex] = newPages[pageIndex].map(el => 
              el.id === elementId ? { ...el, ...updates } : el
          );
          return newPages;
      });
  };

  const addPageElement = (pageIndex: number, type: 'text' | 'image') => {
      setPages(prev => {
          const newPages = [...prev];
          const newId = Math.random().toString(36).substr(2, 9);
          const newElement: PageElement = {
              id: newId,
              type,
              x: 50,
              y: 50,
              w: 300,
              h: type === 'image' ? 200 : 100,
              content: type === 'image' ? 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800' : 'New text block...',
              zIndex: newPages[pageIndex].length + 1
          };
          newPages[pageIndex] = [...newPages[pageIndex], newElement];
          return newPages;
      });
  };

  const deletePageElement = (pageIndex: number, elementId: string) => {
      if(!window.confirm("Delete this element?")) return;
      setPages(prev => {
          const newPages = [...prev];
          newPages[pageIndex] = newPages[pageIndex].filter(el => el.id !== elementId);
          return newPages;
      });
  };

  // Page flipping logic: 0 = Cover, 1 = First Spread, etc.
  const [flippedIndex, setFlippedIndex] = useState(0);
  
  // Animation sequence state
  const [foldState, setFoldState] = useState<FoldState>('READING');

  // PDF Processing state
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSheets = 3; // Cover+P2, P3+P4, P5+P6
  
  // --- Auto-Scaling Logic ---
  useEffect(() => {
    if (!sceneWrapperRef.current) return;

    const calculateScale = () => {
        if (!sceneWrapperRef.current) return;
        const { width, height } = sceneWrapperRef.current.getBoundingClientRect();
        
        // Target Content dimensions
        const contentHeight = 510; 
        const contentWidth = 950; 

        // Desired gap: 5px top + 5px bottom = 10px total
        const verticalGap = 10;
        
        const availableHeight = height - verticalGap;
        const availableWidth = width;

        const scaleX = availableWidth / contentWidth;
        const scaleY = availableHeight / contentHeight;

        const newScale = Math.min(scaleX, scaleY);
        setSceneScale(Math.max(0.2, newScale)); 
    };

    const observer = new ResizeObserver(calculateScale);
    observer.observe(sceneWrapperRef.current);
    calculateScale();

    return () => observer.disconnect();
  }, [controlPanelHeight]);

  // --- Resizable Divider Logic ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const newHeight = containerRect.bottom - e.clientY;
        const minHeight = 150;
        const maxHeight = containerRect.height - 100;
        setControlPanelHeight(Math.max(minHeight, Math.min(newHeight, maxHeight)));
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  // --- Audio Engine ---
  const playSound = (type: 'turn' | 'rustle' | 'thud' | 'fold') => {
    if (typeof window === 'undefined') return;
    if (config.isMuted || config.volume <= 0) return;

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.value = config.volume;
    masterGain.connect(ctx.destination);
    
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
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.turnDuration / 1000 * 0.3);
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
    gain.connect(masterGain);
    noise.start();
  };

  // --- Navigation Handlers ---

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

  // --- Animation Orchestration ---

  const handleFold = () => {
    if (flippedIndex > 0) {
        playSound('turn');
        setFlippedIndex(0);
        setTimeout(() => {
            setFoldState('CLOSED_VERTICAL');
            setTimeout(() => {
                 startHorizontalFold();
            }, 100);
        }, config.turnDuration + 100);
    } else {
        startHorizontalFold();
    }
  };

  const startHorizontalFold = () => {
      setFoldState('FOLDING_HORIZONTAL');
      playSound('fold');
      setTimeout(() => {
          setFoldState('ON_TABLE');
          setTimeout(() => playSound('thud'), config.foldDuration * 0.4);
      }, config.foldDuration);
  };

  const handleUnfold = () => {
      if (foldState === 'ON_TABLE') {
          playSound('rustle');
          setFoldState('FOLDING_HORIZONTAL');
          setTimeout(() => {
              setFoldState('CLOSED_VERTICAL'); 
              playSound('fold'); 
              setTimeout(() => {
                setFoldState('READING');
              }, 600);
          }, config.foldDuration);
      }
  };

  // --- PDF Import Logic ---
  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;

    setIsPdfLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const sourceWidth = 1000;
      
      const rollCanvas = document.createElement('canvas');
      // Approximate height for 5 pages worth of content
      rollCanvas.width = sourceWidth;
      rollCanvas.height = 3000; 
      const rollCtx = rollCanvas.getContext('2d');
      if (!rollCtx) throw new Error("No context");
      
      rollCtx.fillStyle = config.paperColor;
      rollCtx.fillRect(0, 0, rollCanvas.width, rollCanvas.height);

      let currentPdfY = 0;
      const maxPdfPages = Math.min(pdf.numPages, 5);

      for (let i = 0; i < maxPdfPages; i++) {
          const page = await pdf.getPage(i + 1);
          const viewport = page.getViewport({ scale: sourceWidth / page.getViewport({ scale: 1 }).width });
          
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = viewport.width;
          pageCanvas.height = viewport.height;
          const pageCtx = pageCanvas.getContext('2d');
          
          if (pageCtx) {
               pageCtx.fillStyle = config.paperColor;
               pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
               await page.render({ canvasContext: pageCtx, viewport } as any).promise;
               
               // For simplicity in this new structure, we will just create ONE full-page image per PDF page for each Newspaper Page
               const imgData = pageCanvas.toDataURL('image/jpeg', 0.85);
               
               // Update the corresponding page with a single full image element
               setPages(prev => {
                   const newPages = [...prev];
                   if (newPages[i]) {
                       // Clear existing and add full page image
                       newPages[i] = [{
                           id: `pdf-${i}`,
                           type: 'image',
                           x: 0,
                           y: 0,
                           w: 400, // Full width of page container
                           h: 500, // Full height
                           content: imgData,
                           zIndex: 1
                       }];
                   }
                   return newPages;
               });
          }
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
      if (foldState !== 'READING') handleUnfold();

    } catch (err) {
      console.error("PDF Error:", err);
      alert("Failed to process PDF file.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  const getImageClassName = (src: string) => {
    return "w-full h-full object-cover object-top";
  };

  const getPaperStyle = (): React.CSSProperties => ({
      backgroundColor: config.paperColor,
      ...FONT_STYLES[config.fontStyle]
  });

  // --- Render Helpers ---

  const renderPageContent = (pageIndex: number, extraStaticContent?: React.ReactNode) => {
      const pageElements = pages[pageIndex] || [];
      
      return (
        <div className="absolute inset-0 shadow-[inset_2px_0_5px_rgba(0,0,0,0.1)] flex flex-col h-full overflow-hidden" style={getPaperStyle()}>
            <div className="absolute inset-0 -z-10" style={{backgroundColor: config.paperColor}}></div>
            
            {/* Static Content (Like Header) */}
            {extraStaticContent}
            
            {/* Dynamic Elements */}
            {pageElements.map(el => (
                <ResizableBox 
                    key={el.id}
                    element={el}
                    onUpdate={(updates) => updatePageElement(pageIndex, el.id, updates)}
                    onDelete={() => deletePageElement(pageIndex, el.id)}
                    isActive={isEditMode}
                    scale={sceneScale}
                >
                    {el.type === 'image' ? (
                        <div className="w-full h-full bg-neutral-200 overflow-hidden relative group">
                             {el.content.startsWith('http') || el.content.startsWith('data:') ? (
                                <img src={el.content} alt="Content" className={getImageClassName(el.content)} style={{ backgroundColor: config.paperColor }} />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center bg-neutral-300 text-neutral-500 text-[10px]">Invalid Image URL</div>
                             )}
                        </div>
                    ) : (
                        <div className={`w-full h-full text-justify leading-tight text-neutral-800 overflow-hidden ${el.type === 'headline' ? 'font-bold text-3xl leading-none' : 'text-[9px]'}`} style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}>
                            <p>{el.content}</p>
                        </div>
                    )}
                </ResizableBox>
            ))}
            
            {/* Page Number */}
            {pageIndex < 5 && (
                <div className={`absolute bottom-4 ${pageIndex % 2 === 0 ? 'right-4' : 'left-4'} z-10 text-[12px] font-bold text-neutral-900 bg-white/50 px-1 rounded-sm backdrop-blur-[1px] pointer-events-none`} style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}>
                    {pageIndex + 1}
                </div>
            )}
        </div>
      );
  };

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

  // Helper to manage z-indices for sheets
  const getSheetZIndex = (sheetIndex: number) => {
      const isFlipped = sheetIndex < flippedIndex;
      if (isFlipped) {
          return sheetIndex;
      } else {
          return 100 - sheetIndex;
      }
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-[#1a1a1a] flex flex-col relative overflow-hidden transition-all duration-1000" style={{ filter: `brightness(${config.lighting})` }}>
      
      {/* 3D Scene Container - Flex grow to fill available space */}
      <div ref={sceneWrapperRef} className="flex-1 flex items-center justify-center overflow-hidden relative min-h-0">
        
        {/* Navigation Arrows - Positioning relative to container */}
        <div className="absolute flex justify-between w-full max-w-[90%] px-4 pointer-events-none z-50 top-1/2 -translate-y-1/2">
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

        {/* Scaled Wrapper for 3D Content - Using Dynamic Scale */}
        <div 
            className="transition-transform duration-300 origin-center flex items-center justify-center"
            style={{ 
                transform: `scale(${sceneScale})`,
                pointerEvents: isEditMode ? 'auto' : 'none' 
            }}
        >
            
            {/* The Stage: Sets the perspective for 3D transformations */}
            <div className="relative w-[800px] h-[500px] perspective-[1500px] flex items-center justify-center pointer-events-auto">
                
                {/* Mode 1: Interactive Reading Book */}
                <div 
                    className={`relative w-full h-full transition-all ease-in-out ${
                        (foldState === 'READING' || foldState === 'CLOSED_VERTICAL') ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'
                    }`}
                    style={{ 
                        transformStyle: 'preserve-3d',
                        transform: flippedIndex === 0 ? 'translateX(-200px)' : 'translateX(0px)',
                        transitionDuration: '1000ms'
                    }}
                >
                    {/* Left Base (Empty Desk under the left pages) */}
                    <div 
                        className={`absolute top-0 bottom-0 right-[50%] w-[400px] bg-[#e5e5e5] rounded-l-md shadow-2xl flex items-center justify-center border-r border-neutral-300 transition-opacity duration-500 ${flippedIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
                        style={{ transform: 'translateZ(-50px)' }}
                    >
                        <div className="text-neutral-300 font-serif rotate-[-5deg]">End of Paper</div>
                    </div>

                    {/* Right Base (Back Cover Backdrop) */}
                    <div 
                        className="absolute top-0 bottom-0 left-[50%] w-[400px] rounded-r-md shadow-xl p-6 flex flex-col border-l border-neutral-300"
                        style={{ transform: 'translateZ(-50px)', ...getPaperStyle() }}
                    >
                        <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-300 pb-2 mb-4">Back Cover</div>
                        <div className="flex-1 border-2 border-dashed border-neutral-300 flex items-center justify-center">
                            <span className="text-neutral-400 italic" style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}>Subscription Card</span>
                        </div>
                    </div>

                    {/* Sheet 2 (Pages 5 & 6) */}
                    <div 
                        className={`absolute top-0 left-[50%] w-[400px] h-full transition-transform ease-[cubic-bezier(0.645,0.045,0.355,1)] transform-style-3d origin-left`}
                        style={{ 
                            transform: `rotateY(${flippedIndex >= 3 ? -180 : 0}deg) translateZ(5px)`,
                            transformStyle: 'preserve-3d',
                            transitionDuration: `${config.turnDuration}ms`,
                            zIndex: getSheetZIndex(2)
                        }}
                    >
                        {/* Front (Page 5) */}
                        <div 
                            className="absolute inset-0 shadow-[inset_10px_0_20px_rgba(0,0,0,0.1)] flex flex-col" 
                            style={{ ...faceStyle, transform: 'translateZ(1px)', ...getPaperStyle() }}
                        >
                            {renderPageContent(4, 
                                <div className="flex justify-between text-[10px] text-neutral-500 border-b border-black mb-4 pb-1 mx-6 mt-6" style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}>
                                    <span>TRAVEL</span>
                                    <span>PAGE 5</span>
                                </div>
                            )}
                        </div>
                        {/* Back (Page 6 - The End) */}
                        <div 
                            className="absolute inset-0 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.1)] p-6 flex flex-col rounded-l-md" 
                            style={{ ...faceStyle, transform: 'rotateY(180deg) translateZ(1px)', ...getPaperStyle() }}
                        >
                             {renderPageContent(5, 
                                <div className="absolute inset-0 flex flex-col items-center justify-center border-4 double border-neutral-800 m-4 pointer-events-none opacity-50">
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sheet 1 (Pages 3 & 4) */}
                    <div 
                        className={`absolute top-0 left-[50%] w-[400px] h-full transition-transform ease-[cubic-bezier(0.645,0.045,0.355,1)] transform-style-3d origin-left`}
                        style={{ 
                            transform: `rotateY(${flippedIndex >= 2 ? -180 : 0}deg) translateZ(10px)`,
                            transformStyle: 'preserve-3d',
                            transitionDuration: `${config.turnDuration}ms`,
                            zIndex: getSheetZIndex(1)
                        }}
                    >
                        {/* Front (Page 3) */}
                        <div 
                            className="absolute inset-0 shadow-[inset_10px_0_20px_rgba(0,0,0,0.1)] flex flex-col" 
                            style={{ ...faceStyle, transform: 'translateZ(1px)', ...getPaperStyle() }}
                        >
                             {renderPageContent(2, 
                                <div className="flex justify-between text-[10px] text-neutral-500 border-b border-black mb-4 pb-1 mx-6 mt-6" style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}>
                                    <span>LIFESTYLE</span>
                                    <span>PAGE 3</span>
                                </div>
                            )}
                        </div>
                        {/* Back (Page 4) */}
                        <div 
                            className="absolute inset-0 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.1)] flex flex-col rounded-l-md" 
                            style={{ ...faceStyle, transform: 'rotateY(180deg) translateZ(1px)', ...getPaperStyle() }}
                        >
                            {renderPageContent(3, 
                                <div className="flex justify-between text-[10px] text-neutral-500 border-b border-black mb-4 pb-1 mx-6 mt-6" style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}>
                                    <span>SCIENCE</span>
                                    <span>PAGE 4</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sheet 0 (Cover & Page 2) */}
                    <div 
                        className={`absolute top-0 left-[50%] w-[400px] h-full transition-transform ease-[cubic-bezier(0.645,0.045,0.355,1)] transform-style-3d origin-left`}
                        style={{ 
                            transform: `rotateY(${flippedIndex >= 1 ? -180 : 0}deg) translateZ(15px)`,
                            transformStyle: 'preserve-3d',
                            transitionDuration: `${config.turnDuration}ms`,
                            zIndex: getSheetZIndex(0)
                        }}
                    >
                        {/* Front (Cover - Page 0) */}
                        <div 
                            className="absolute inset-0" 
                            style={{ ...faceStyle, transform: 'translateZ(1px)', ...getPaperStyle() }}
                        >
                            {renderPageContent(0, 
                                <div className="text-center border-b-2 border-black pb-4 mb-0 pt-6 px-6 pointer-events-none">
                                    <h1 className="text-4xl font-black tracking-tight text-black mb-1" style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}>{config.publicationTitle}</h1>
                                    <div className="flex justify-between text-[9px] font-sans font-bold text-neutral-600 border-t border-black pt-1 mt-1">
                                        <span>VOL. CCLIV</span>
                                        <span>CSS EDITION</span>
                                        <span>$1.50</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Back (Page 2 - Page 1) */}
                        <div 
                            className="absolute inset-0 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.05)] flex flex-col rounded-l-md" 
                            style={{ ...faceStyle, transform: 'rotateY(180deg) translateZ(1px)', ...getPaperStyle() }}
                        >
                            {renderPageContent(1, 
                                <div className="flex justify-between text-[10px] text-neutral-500 border-b border-black mb-4 pb-1 mx-6 mt-6" style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}>
                                    <span>OPINION</span>
                                    <span>PAGE 2</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mode 2: Folding Prop */}
                <div 
                    className={`relative w-[400px] h-[500px] transition-all ease-[cubic-bezier(0.645,0.045,0.355,1)] ${
                        (foldState === 'FOLDING_HORIZONTAL' || foldState === 'ON_TABLE') ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'
                    } ${foldState === 'ON_TABLE' ? 'cursor-pointer group' : ''}`}
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: getPropTransform(),
                        transitionDuration: `${config.foldDuration}ms`
                    }}
                    onClick={handleUnfold}
                >
                    {/* Hover hint when folded on table */}
                    <div className={`absolute -top-32 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full backdrop-blur-md opacity-0 transition-opacity duration-300 pointer-events-none flex items-center gap-2 ${foldState === 'ON_TABLE' ? 'group-hover:opacity-100' : ''}`} style={{ transform: 'rotateX(-70deg)' }}>
                        <Maximize2 size={16} />
                        <span>Click to Unfold</span>
                    </div>

                    {/* Top Half (Visible & Static) */}
                    <div className="absolute top-0 w-full h-[250px] overflow-hidden z-20 backface-hidden shadow-md" style={getPaperStyle()}>
                        <div className="w-full h-[500px] relative">
                             {/* Render simplified cover for folded view */}
                             <div className="absolute inset-0 shadow-[inset_2px_0_5px_rgba(0,0,0,0.1)] flex flex-col h-full overflow-hidden" style={getPaperStyle()}>
                                <div className="absolute inset-0 -z-10" style={{backgroundColor: config.paperColor}}></div>
                                <div className="text-center border-b-2 border-black pb-4 mb-0 pt-6 px-6">
                                    <h1 className="text-4xl font-black tracking-tight text-black mb-1" style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}>{config.publicationTitle}</h1>
                                </div>
                                <div className="p-6">
                                    {/* Simply grab the first image and headline from page 0 for the preview prop */}
                                    <h2 className="text-3xl font-bold leading-none text-neutral-900 mb-2" style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}>
                                        {pages[0].find(e => e.type === 'headline')?.content || "HEADLINE"}
                                    </h2>
                                    <div className="w-full h-32 bg-neutral-300 overflow-hidden relative grayscale contrast-110">
                                         <img src={pages[0].find(e => e.type === 'image')?.content || ""} className="w-full h-full object-cover" style={{ backgroundColor: config.paperColor }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div 
                            className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none transition-opacity"
                            style={{ 
                                opacity: (foldState === 'FOLDING_HORIZONTAL' || foldState === 'ON_TABLE') ? 1 : 0, 
                                transitionDuration: `${config.foldDuration}ms`,
                                transitionTimingFunction: 'cubic-bezier(0.645,0.045,0.355,1)'
                            }} 
                        />
                    </div>

                    {/* Bottom Half (Folds Under) */}
                    <div 
                        className="absolute top-[250px] w-full h-[250px] origin-[50%_0] transform-style-3d transition-transform ease-[cubic-bezier(0.645,0.045,0.355,1)] z-10"
                        style={{
                            transform: (foldState === 'FOLDING_HORIZONTAL' || foldState === 'ON_TABLE') ? 'rotateX(-179deg)' : 'rotateX(0deg)',
                            transitionDuration: `${config.foldDuration}ms`
                        }}
                    >
                        <div className="absolute inset-0 overflow-hidden backface-hidden" style={getPaperStyle()}>
                            <div className="w-full h-[500px] relative -top-[250px]">
                                {/* Simplified bottom half cover */}
                                <div className="absolute inset-0 shadow-[inset_2px_0_5px_rgba(0,0,0,0.1)] flex flex-col h-full overflow-hidden" style={getPaperStyle()}>
                                     <div className="p-6 mt-[250px]">
                                         <p className="text-[10px]" style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}>
                                            {pages[0].find(e => e.type === 'text')?.content || "Text content..."}
                                         </p>
                                     </div>
                                </div>
                            </div>
                            <div 
                                className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent pointer-events-none transition-opacity" 
                                style={{ 
                                    opacity: (foldState === 'FOLDING_HORIZONTAL' || foldState === 'ON_TABLE') ? 1 : 0,
                                    transitionDuration: `${config.foldDuration}ms`,
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

      {/* Draggable Divider */}
      <div 
        onMouseDown={handleMouseDown}
        className="h-2 bg-neutral-800 hover:bg-neutral-700 cursor-row-resize flex items-center justify-center z-40 transition-colors shrink-0 border-t border-b border-neutral-800"
      >
        <div className="w-12 h-1 bg-neutral-600 rounded-full flex items-center justify-center gap-0.5">
           <GripHorizontal size={12} className="text-neutral-400 opacity-50"/>
        </div>
      </div>

      {/* Control Panel / Editor's Desk */}
      <div 
        style={{ height: controlPanelHeight }} 
        className="bg-neutral-900 z-30 overflow-y-auto shrink-0"
      >
         <div className="p-4 md:p-6 max-w-4xl mx-auto flex flex-col gap-6">
            
            {/* Top Row: Fold Button & Editor Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
                <div className="flex-1 w-full space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs md:text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Editor's Desk
                        </h3>

                        <div className="flex items-center gap-2">
                             {/* Edit Mode Toggle */}
                            <button
                                onClick={() => setIsEditMode(!isEditMode)}
                                className={`flex items-center gap-2 text-[10px] md:text-xs px-3 py-1.5 rounded-full border transition-all ${isEditMode ? 'bg-blue-600 border-blue-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'}`}
                            >
                                {isEditMode ? <Check size={12} /> : <Pencil size={12} />}
                                {isEditMode ? 'Done Editing' : 'Edit Layout'}
                            </button>
                            
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
                                    {isPdfLoading ? 'Processing...' : 'Import PDF'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Content Editor */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3">
                        {/* Publication Title - Spans 2 cols */}
                        <div className="space-y-1 col-span-2 md:col-span-2">
                            <label className="text-[10px] text-neutral-500 font-mono">PUBLICATION TITLE</label>
                            <input 
                                type="text" 
                                value={config.publicationTitle}
                                onChange={(e) => setConfig({...config, publicationTitle: e.target.value})}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-green-500"
                            />
                        </div>
                        
                        {/* Font Selection */}
                         <div className="space-y-1 col-span-2 md:col-span-2">
                            <label className="text-[10px] text-neutral-500 font-mono">TYPOGRAPHY</label>
                            <div className="flex gap-1">
                                {['classic', 'modern', 'typewriter'].map((f) => (
                                    <button 
                                        key={f}
                                        onClick={() => setConfig({...config, fontStyle: f as FontStyle})}
                                        className={`flex-1 px-1 py-1 rounded text-[10px] capitalize border ${config.fontStyle === f ? 'bg-neutral-700 border-neutral-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Page Content Editor - Lists all dynamic elements */}
                        <div className="col-span-2 md:col-span-6 space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar border-t border-neutral-800 pt-4">
                            {pages.map((pageElements, pIndex) => (
                                <div key={pIndex} className="space-y-2">
                                    <div className="flex items-center justify-between sticky top-0 bg-neutral-900/90 backdrop-blur-sm py-1 z-10 border-b border-neutral-800">
                                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase">
                                            {pIndex === 0 ? 'COVER PAGE' : `PAGE ${pIndex + 1}`}
                                        </span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => addPageElement(pIndex, 'text')}
                                                className="text-[9px] flex items-center gap-1 text-neutral-400 hover:text-white bg-neutral-800 px-2 py-0.5 rounded"
                                            >
                                                <Plus size={8} /> Text
                                            </button>
                                            <button 
                                                onClick={() => addPageElement(pIndex, 'image')}
                                                className="text-[9px] flex items-center gap-1 text-neutral-400 hover:text-white bg-neutral-800 px-2 py-0.5 rounded"
                                            >
                                                <ImageIcon size={8} /> Image
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {pageElements.map((el) => (
                                            <div key={el.id} className="group relative flex flex-col gap-1 p-2 border border-neutral-800 rounded bg-neutral-900/50">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-1">
                                                        <label className="text-[9px] text-neutral-500 font-mono uppercase truncate">{el.type}</label>
                                                        {el.link && <LinkIcon size={8} className="text-blue-500" />}
                                                    </div>
                                                    <button onClick={() => deletePageElement(pIndex, el.id)} className="text-neutral-700 hover:text-red-500 transition-colors"><Trash2 size={10} /></button>
                                                </div>
                                                
                                                {/* Content Input */}
                                                {el.type === 'image' ? (
                                                    <input 
                                                        type="text" 
                                                        value={el.content.startsWith('data:') ? 'PDF Asset' : el.content}
                                                        onChange={(e) => updatePageElement(pIndex, el.id, { content: e.target.value })}
                                                        disabled={el.content.startsWith('data:')}
                                                        placeholder="Image URL"
                                                        className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-[10px] text-neutral-300 focus:outline-none focus:border-green-500 placeholder:text-neutral-600"
                                                    />
                                                ) : (
                                                    <textarea
                                                        value={el.content}
                                                        onChange={(e) => updatePageElement(pIndex, el.id, { content: e.target.value })}
                                                        placeholder="Content..."
                                                        className="w-full h-8 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-[10px] text-neutral-300 focus:outline-none focus:border-green-500 resize-none leading-tight placeholder:text-neutral-600"
                                                    />
                                                )}

                                                {/* Link Input */}
                                                <div className="relative mt-1">
                                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none">
                                                        <LinkIcon size={8} />
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        value={el.link || ''}
                                                        onChange={(e) => updatePageElement(pIndex, el.id, { link: e.target.value })}
                                                        placeholder="Add Link URL..."
                                                        className="w-full bg-neutral-800 border border-neutral-700 rounded pl-5 pr-2 py-1 text-[9px] text-blue-300 focus:outline-none focus:border-blue-500 placeholder:text-neutral-700"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {pageElements.length === 0 && (
                                            <div className="col-span-2 text-[10px] text-neutral-600 italic py-2">No elements on this page. Add one!</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Action Button */}
                <button
                    onClick={handleFold}
                    disabled={foldState !== 'READING'}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-serif text-sm border transition-all shadow-lg active:scale-95 whitespace-nowrap h-fit ${
                        foldState !== 'READING'
                        ? 'bg-neutral-800/50 text-neutral-600 border-neutral-800 cursor-default'
                        : 'bg-gradient-to-r from-neutral-700 to-neutral-800 hover:from-neutral-600 hover:to-neutral-700 text-white border-neutral-600 hover:border-neutral-500 hover:shadow-xl'
                    }`}
                >
                    <ArrowDownToLine size={18} />
                    {foldState === 'READING' ? 'Fold & Place on Table' : 'Folded'}
                </button>
            </div>

            {/* Production Controls Panel */}
            <div className="border-t border-neutral-800 pt-4">
                 <div className="flex items-center gap-2 mb-4">
                    <Settings size={14} className="text-neutral-500" />
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Production Settings</h4>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-5 gap-6 bg-black/20 p-4 rounded-lg border border-neutral-800/50">
                    
                    {/* 1. Fold Speed */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-neutral-400 font-mono uppercase">
                            <span className="flex items-center gap-1"><Clock size={10} /> Fold Speed</span>
                            <span>{config.foldDuration}ms</span>
                        </div>
                        <input 
                            type="range" 
                            min="500" 
                            max="3000" 
                            step="100" 
                            value={config.foldDuration}
                            onChange={(e) => setConfig({...config, foldDuration: Number(e.target.value)})}
                            className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-neutral-300 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-white"
                        />
                        <div className="flex justify-between text-[9px] text-neutral-600">
                            <span>Fast</span>
                            <span>Slow</span>
                        </div>
                    </div>

                    {/* 2. Turn Speed */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-neutral-400 font-mono uppercase">
                            <span className="flex items-center gap-1"><MoveHorizontal size={10} /> Turn Speed</span>
                            <span>{config.turnDuration}ms</span>
                        </div>
                        <input 
                            type="range" 
                            min="300" 
                            max="2000" 
                            step="100" 
                            value={config.turnDuration}
                            onChange={(e) => setConfig({...config, turnDuration: Number(e.target.value)})}
                            className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-neutral-300 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-white"
                        />
                        <div className="flex justify-between text-[9px] text-neutral-600">
                            <span>Zip</span>
                            <span>Languid</span>
                        </div>
                    </div>

                    {/* 3. Audio Control */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-neutral-400 font-mono uppercase">
                            <span className="flex items-center gap-1">
                                {config.isMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                                Audio Level
                            </span>
                            <span>{config.isMuted ? 'MUTE' : `${Math.round(config.volume * 100)}%`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setConfig({...config, isMuted: !config.isMuted})}
                                className={`p-1 rounded hover:bg-neutral-700 ${config.isMuted ? 'text-red-400' : 'text-neutral-400'}`}
                            >
                                {config.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            </button>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.05" 
                                value={config.volume}
                                disabled={config.isMuted}
                                onChange={(e) => setConfig({...config, volume: Number(e.target.value)})}
                                className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-neutral-300 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-white disabled:opacity-50"
                            />
                        </div>
                    </div>

                    {/* 4. Paper Stock */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-neutral-400 font-mono uppercase">
                             <span className="flex items-center gap-1"><Palette size={10} /> Paper Stock</span>
                             <span className="w-3 h-3 rounded-full border border-neutral-600" style={{background: config.paperColor}}></span>
                        </div>
                        <div className="flex gap-2">
                            {['#f4f1ea', '#ffffff', '#e2e8f0', '#fef3c7', '#1e293b'].map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setConfig({...config, paperColor: color})}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${config.paperColor === color ? 'border-green-500 scale-110' : 'border-neutral-600'}`}
                                    style={{backgroundColor: color}}
                                    title={color === '#1e293b' ? 'Dark Mode' : color === '#fef3c7' ? 'Vintage' : 'Standard'}
                                />
                            ))}
                            <input 
                                type="color" 
                                value={config.paperColor}
                                onChange={(e) => setConfig({...config, paperColor: e.target.value})}
                                className="w-6 h-6 rounded overflow-hidden border-0 p-0 bg-transparent cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* 5. Studio Lighting */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-neutral-400 font-mono uppercase">
                            <span className="flex items-center gap-1"><Sun size={10} /> Lighting</span>
                            <span>{Math.round(config.lighting * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0.2" 
                            max="1.5" 
                            step="0.1" 
                            value={config.lighting}
                            onChange={(e) => setConfig({...config, lighting: Number(e.target.value)})}
                            className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-neutral-300 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-white"
                        />
                         <div className="flex justify-between text-[9px] text-neutral-600">
                            <span>Dim</span>
                            <span>Bright</span>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Newspaper;