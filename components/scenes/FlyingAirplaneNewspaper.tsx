import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, ArrowDownToLine, Maximize2, Upload, FileText, Loader2, Settings, Volume2, VolumeX, Clock, Sun, Palette, Zap, Type, MoveHorizontal, GripHorizontal, Pencil, Check, Move, MousePointer2, X, Plus, Image as ImageIcon, Trash2, Link as LinkIcon, ExternalLink, Send, CircleDashed, Footprints, Plane } from 'lucide-react';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker for handling PDF uploads
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

/**
 * FoldState definitions:
 * Shared: READING, CLOSED_VERTICAL
 * Airplane: FOLDING_1 (Corners), FOLDING_2 (Center), FOLDING_3 (Wings), FLYING
 * Ball: CRUMPLING, TRASHED
 * Dinosaur: DINO_BASE, DINO_NECK, DINO_HEAD, DINO_DONE
 */
type FoldState = 
    | 'READING' | 'CLOSED_VERTICAL' 
    | 'FOLDING_1' | 'FOLDING_2' | 'FOLDING_3' | 'FLYING'
    | 'CRUMPLING' | 'TRASHED'
    | 'DINO_BASE' | 'DINO_NECK' | 'DINO_HEAD' | 'DINO_DONE';

type AnimationMode = 'AIRPLANE' | 'BALL' | 'DINOSAUR';

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

// --- 1. Airplane Prop ---
const AirplaneFoldProp: React.FC<{
    foldState: FoldState;
    children: React.ReactNode;
    duration: number;
    paperStyle: React.CSSProperties;
}> = ({ foldState, children, duration, paperStyle }) => {
    
    // Animation Logic:
    // 1. Start as a vertical sheet (200px wide folded in half).
    // 2. Fold 1: Corners fold in (dog ears).
    // 3. Fold 2: Wings fold DOWN (Mountain fold).
    // 4. Fly: The whole assembly moves.

    const isFold1 = ['FOLDING_1', 'FOLDING_2', 'FOLDING_3', 'FLYING'].includes(foldState);
    const isFold2 = ['FOLDING_2', 'FOLDING_3', 'FLYING'].includes(foldState); // Actually we skip a step in this simplified model, merging center fold + corners usually
    const isFold3 = ['FOLDING_3', 'FLYING'].includes(foldState);
    const isFlying = foldState === 'FLYING';

    const wingFoldAngle = isFold3 ? -75 : 0; // -75 degrees folds wings down to create the dart shape

    // Flight Path: Starts at center, moves up and away
    const flightTransform = isFlying 
        ? 'translate3d(150vw, -40vh, -1500px) rotateX(-15deg) rotateY(30deg) rotateZ(10deg)' 
        : 'translate3d(0,0,0) rotateX(0) rotateY(0) rotateZ(0)';

    return (
        <div 
            className="relative w-full h-full preserve-3d transition-transform ease-in-out origin-center"
            style={{ 
                transform: flightTransform, 
                transitionDuration: isFlying ? '4000ms' : `${duration}ms`,
                transformStyle: 'preserve-3d',
                transitionTimingFunction: isFlying ? 'cubic-bezier(0.25, 0.1, 0.25, 1)' : 'ease-in-out'
            }}
        >
            <div className="absolute left-1/2 top-0 bottom-0 w-0 preserve-3d">
                
                {/* LEFT WING ASSEMBLY */}
                <div 
                    className="absolute top-0 right-0 w-[200px] h-[500px] preserve-3d transition-transform ease-in-out origin-right" 
                    style={{ 
                        transform: `rotateY(0deg)`, // The base stays flat until wing fold? No, let's treat the center axis as 0
                    }}
                >
                     {/* The Main Left Wing Panel */}
                     <div 
                        className="absolute inset-0 preserve-3d origin-right transition-transform ease-in-out" 
                        style={{ 
                            // Actually, standard paper plane:
                            // 1. Fold in half (Valley) -> We are already in half (vertical book)
                            // 2. Fold corners down.
                            // 3. Fold wings down.
                            // To match the screenshot, we want the body to be vertical (fuselage) and wings out.
                            // So: Left Panel rotates Y to 90deg (vertical). Right Panel to -90deg.
                            // Then Wings fold DOWN from that vertical spine.
                            transform: `rotateY(${isFold2 ? 90 : 0}deg)`,
                            transitionDuration: `${duration}ms`
                        }}
                     >
                         {/* Wing Flap that folds DOWN */}
                         <div 
                            className="absolute inset-0 preserve-3d origin-left transition-transform ease-in-out"
                            style={{
                                transform: `rotateY(${wingFoldAngle}deg)`,
                                transitionDuration: `${duration}ms`
                            }}
                         >
                            {/* Paper Content */}
                            <div className="absolute inset-0 overflow-hidden backface-hidden" 
                                style={{
                                    ...paperStyle, 
                                    // Polygon clips the paper into the wing shape
                                    clipPath: 'polygon(0% 0%, 100% 40%, 100% 100%, 0% 100%)',
                                    borderRight: '1px solid rgba(0,0,0,0.05)'
                                }}>
                                <div className="absolute top-0 right-0 w-[400px] h-[500px]">{children}</div>
                                <div className={`absolute inset-0 bg-gradient-to-l from-black/20 to-transparent transition-opacity duration-1000 ${isFold3 ? 'opacity-100' : 'opacity-0'}`}></div>
                            </div>
                            <div className="absolute inset-0 bg-neutral-200 backface-hidden" style={{transform: 'rotateY(180deg)', clipPath: 'polygon(0% 0%, 100% 40%, 100% 100%, 0% 100%)'}}></div>

                            {/* The "Corner Fold" (Dog Ear) - Visual only overlay */}
                            <div 
                                className="absolute top-0 right-0 w-[200px] h-[200px] origin-bottom-left transition-transform ease-in-out preserve-3d" 
                                style={{ 
                                    top: '-68px', // Visual adjustment for the diagonal 
                                    right: 0,
                                    transformOrigin: '0% 100%', 
                                    transform: isFold1 ? `rotateZ(45deg) rotateX(-179deg)` : `rotateZ(45deg) rotateX(0deg)`, 
                                    transitionDuration: `${duration}ms`,
                                    opacity: isFold1 ? 1 : 0
                                }}
                            >  
                                <div className="w-full h-full overflow-hidden backface-hidden" style={{ ...paperStyle, transform: 'scaleY(-1)', filter: 'brightness(0.95)' }}>
                                     <div className="w-full h-full bg-neutral-100"></div>
                                </div>
                                <div className="absolute inset-0 bg-white backface-hidden" style={{ transform: 'rotateX(180deg)' }}></div>
                             </div>
                         </div>
                     </div>
                </div>

                {/* RIGHT WING ASSEMBLY */}
                <div 
                    className="absolute top-0 left-0 w-[200px] h-[500px] preserve-3d transition-transform ease-in-out origin-left" 
                >
                     <div 
                        className="absolute inset-0 preserve-3d origin-left transition-transform ease-in-out" 
                        style={{ 
                            transform: `rotateY(${isFold2 ? -90 : 0}deg)`,
                            transitionDuration: `${duration}ms`
                        }}
                     >
                         {/* Wing Flap */}
                         <div 
                            className="absolute inset-0 preserve-3d origin-right transition-transform ease-in-out"
                            style={{
                                transform: `rotateY(${-wingFoldAngle}deg)`,
                                transitionDuration: `${duration}ms`
                            }}
                         >
                             <div className="absolute inset-0 overflow-hidden backface-hidden" 
                                style={{
                                    ...paperStyle, 
                                    clipPath: 'polygon(0% 0%, 100% 40%, 100% 100%, 0% 100%)',
                                    borderLeft: '1px solid rgba(0,0,0,0.05)'
                                }}>
                                <div className="absolute top-0 left-0 w-[400px] h-[500px]">{children}</div>
                                <div className={`absolute inset-0 bg-gradient-to-r from-black/20 to-transparent transition-opacity duration-1000 ${isFold3 ? 'opacity-100' : 'opacity-0'}`}></div>
                            </div>
                            <div className="absolute inset-0 bg-neutral-200 backface-hidden" style={{transform: 'rotateY(180deg)', clipPath: 'polygon(0% 0%, 100% 40%, 100% 100%, 0% 100%)'}}></div>

                             {/* Corner Fold */}
                             <div 
                                className="absolute top-0 left-0 w-[200px] h-[200px] origin-bottom-right transition-transform ease-in-out preserve-3d" 
                                style={{ 
                                    top: '-68px', 
                                    left: 0,
                                    transformOrigin: '100% 100%', 
                                    transform: isFold1 ? `rotateZ(-45deg) rotateX(-179deg)` : `rotateZ(-45deg) rotateX(0deg)`, 
                                    transitionDuration: `${duration}ms`,
                                    opacity: isFold1 ? 1 : 0
                                }}
                            >  
                                <div className="w-full h-full overflow-hidden backface-hidden" style={{ ...paperStyle, transform: 'scaleY(-1)', filter: 'brightness(0.95)' }}>
                                     <div className="w-full h-full bg-neutral-100"></div>
                                </div>
                                <div className="absolute inset-0 bg-white backface-hidden" style={{ transform: 'rotateX(180deg)' }}></div>
                             </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

// --- 2. Crumpled Ball Prop ---
const CrumpledBallProp: React.FC<{
    foldState: FoldState;
    children: React.ReactNode;
    duration: number;
    paperStyle: React.CSSProperties;
}> = ({ foldState, children, duration, paperStyle }) => {
    
    const isCrumpling = foldState === 'CRUMPLING' || foldState === 'TRASHED';
    const isTrashed = foldState === 'TRASHED';

    return (
        <div 
            className="relative w-[400px] h-[500px] transition-all ease-in-out origin-center"
            style={{ 
                transform: isTrashed 
                    ? 'translate(800px, 400px) rotate(720deg) scale(0.1)' 
                    : isCrumpling 
                        ? 'scale(0.4) rotate(15deg)' 
                        : 'scale(1)',
                transitionDuration: isTrashed ? '1000ms' : `${duration}ms`,
                // Adding a complex clip-path when crumpling to simulate jagged edges of a ball
                clipPath: isCrumpling 
                    ? 'polygon(10% 0%, 30% 5%, 50% 0%, 70% 8%, 90% 2%, 100% 20%, 95% 40%, 100% 60%, 92% 80%, 100% 100%, 80% 95%, 60% 100%, 40% 92%, 20% 100%, 5% 85%, 0% 60%, 8% 40%, 0% 20%)'
                    : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                boxShadow: isCrumpling ? 'inset 0 0 50px rgba(0,0,0,0.3)' : 'none',
                borderRadius: isCrumpling ? '40%' : '0%'
            }}
        >
            <div className="w-full h-full overflow-hidden relative" style={paperStyle}>
                 {/* Content Container - Warps when crumpled */}
                 <div className="absolute inset-0 transition-transform duration-1000"
                    style={{ 
                        transform: isCrumpling ? 'scale(1.5) rotate(10deg)' : 'scale(1)',
                        filter: isCrumpling ? 'contrast(1.2) brightness(0.9)' : 'none'
                    }}
                 >
                     {children}
                 </div>
                 
                 {/* Wrinkle Overlay */}
                 <div 
                    className="absolute inset-0 pointer-events-none transition-opacity duration-1000 bg-blend-multiply mix-blend-multiply"
                    style={{
                        opacity: isCrumpling ? 0.6 : 0,
                        background: 'radial-gradient(circle at 30% 30%, transparent 0%, rgba(0,0,0,0.2) 20%, transparent 40%), radial-gradient(circle at 70% 70%, transparent 0%, rgba(0,0,0,0.3) 20%, transparent 40%)',
                        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.2)'
                    }}
                 ></div>
            </div>
        </div>
    );
};

// --- 3. Dinosaur Prop (Origami Style) - REVERTED TO ROBUST SIBLING VERSION ---
const DinosaurFoldProp: React.FC<{
    foldState: FoldState;
    paperStyle: React.CSSProperties;
    children: React.ReactNode;
    duration: number;
}> = ({ foldState, paperStyle, duration, children }) => {
    
    // States: CLOSED_VERTICAL -> DINO_BASE -> DINO_NECK -> DINO_HEAD -> DINO_DONE
    const isBase = ['DINO_BASE', 'DINO_NECK', 'DINO_HEAD', 'DINO_DONE'].includes(foldState);
    const isNeck = ['DINO_NECK', 'DINO_HEAD', 'DINO_DONE'].includes(foldState);
    const isHead = ['DINO_HEAD', 'DINO_DONE'].includes(foldState);
    const isDone = foldState === 'DINO_DONE';

    return (
        <div className="relative w-full h-full preserve-3d flex items-center justify-center">
            {/* The entire dino scales down and moves when done */}
            <div 
                className="relative transition-transform ease-in-out preserve-3d"
                style={{
                    transform: isDone ? 'translateY(100px) scale(0.6)' : 'translateY(0) scale(1)',
                    transitionDuration: `${duration}ms`
                }}
            >
                {/* Main Body (Triangle) */}
                <div 
                    className="absolute w-[400px] h-[300px] origin-bottom transition-all ease-in-out preserve-3d"
                    style={{
                        bottom: '-150px',
                        left: '-200px',
                        transform: isBase ? 'rotate(-10deg)' : 'rotate(0deg)', // Slight tilt
                        clipPath: 'polygon(0% 100%, 100% 100%, 80% 0%)', // Triangle body
                        ...paperStyle,
                        transitionDuration: `${duration}ms`
                    }}
                >
                     {/* Map content to body */}
                     <div className="absolute inset-0 opacity-50 overflow-hidden" style={{ transform: 'scale(0.5)' }}>{children}</div>
                </div>

                {/* Neck - Independent Sibling for stability */}
                <div 
                    className="absolute w-[100px] h-[250px] origin-bottom-left transition-transform ease-in-out preserve-3d"
                    style={{
                        bottom: '140px',
                        left: '110px', // Attached to top-right of body
                        transform: isNeck ? 'rotate(-20deg)' : 'rotate(130deg)', // Rotates UP from body
                        transformOrigin: '0% 100%',
                        clipPath: 'polygon(0% 100%, 100% 0%, 0% 0%)', // Neck shape
                        ...paperStyle,
                        zIndex: -1,
                        transitionDuration: `${duration}ms`
                    }}
                >
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>

                {/* Head - Independent Sibling */}
                <div 
                    className="absolute w-[80px] h-[60px] transition-transform ease-in-out preserve-3d"
                    style={{
                        top: '-80px', 
                        left: '110px',
                        transform: isHead ? 'translate(-5px, -140px) rotate(-10deg)' : 'translate(0, 0) rotate(90deg) scale(0)',
                        transformOrigin: '0% 100%',
                         clipPath: 'polygon(0% 0%, 100% 20%, 80% 100%, 0% 80%)',
                        ...paperStyle,
                        transitionDuration: `${duration}ms`,
                        zIndex: 10
                    }}
                >
                     {/* Eye */}
                     <div className="absolute top-2 left-4 w-3 h-3 bg-black rounded-full"></div>
                </div>

                {/* Tail */}
                <div 
                    className="absolute w-[150px] h-[80px] origin-right transition-transform ease-in-out"
                    style={{
                        bottom: '-140px',
                        left: '-320px',
                        transform: isBase ? 'rotate(10deg)' : 'rotate(90deg) scale(0)',
                        clipPath: 'polygon(0% 0%, 100% 20%, 100% 100%)',
                        ...paperStyle,
                        transitionDuration: `${duration}ms`
                    }}
                ></div>

                {/* Legs (Appear at end) */}
                <div className="absolute bottom-[-200px] left-[-100px] flex gap-20 transition-opacity ease-in-out" style={{ opacity: isDone ? 1 : 0, transitionDuration: '500ms' }}>
                    <div className="w-[40px] h-[60px]" style={{ ...paperStyle, clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}></div>
                    <div className="w-[40px] h-[60px]" style={{ ...paperStyle, clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}></div>
                </div>

            </div>
        </div>
    );
};


const FlyingAirplaneNewspaper: React.FC = () => {
  // --- State Management ---
  const [controlPanelHeight, setControlPanelHeight] = useState(350);
  const [sceneScale, setSceneScale] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [animationMode, setAnimationMode] = useState<AnimationMode>('AIRPLANE');

  const sceneWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Configuration State
  const [config, setConfig] = useState<SceneConfig>({
      foldDuration: 1000, 
      turnDuration: 1000,
      volume: 0.3,
      isMuted: false,
      paperColor: '#f4f1ea',
      lighting: 1.0,
      fontStyle: 'classic',
      publicationTitle: 'THE DAILY FOLD'
  });

  // Unified Pages State
  const [pages, setPages] = useState<PageElement[][]>([
    // Page 0 (Cover)
    [
        { id: 'h1', type: 'headline', x: 24, y: 120, w: 352, h: 70, content: 'BEYOND THE GRID', zIndex: 1 },
        { id: 'i1', type: 'image', x: 24, y: 200, w: 352, h: 180, content: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800', zIndex: 1 },
        { id: 't1', type: 'text', x: 24, y: 390, w: 352, h: 80, content: "Revolutionizing digital storefronts. The 'Daily Code' format replaces infinite scrolls with tactile, editorial storytelling perfect for premium product showcases.", zIndex: 1 }
    ],
    // Other pages...
    [
        { id: 'i2', type: 'image', x: 24, y: 60, w: 352, h: 220, content: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=800', zIndex: 1 },
        { id: 't2', type: 'text', x: 24, y: 290, w: 352, h: 180, content: "Emotional Commerce: Transform the mundane 'Checkout' click into a memorable event. Fold your receipt into a plane and launch it to fulfillment.", zIndex: 1 }
    ],
    [
        { id: 'i3', type: 'image', x: 24, y: 60, w: 352, h: 180, content: 'https://images.unsplash.com/photo-1512428559087-560fa0db7986?auto=format&fit=crop&q=80&w=800', zIndex: 1 },
        { id: 't3', type: 'text', x: 24, y: 250, w: 352, h: 220, content: "Mobile Real Estate: Interactive folds allow dense information to live in compact spaces. Reveal specs, reviews, and stories with a gesture.", zIndex: 1 }
    ],
    [
        { id: 'i4', type: 'image', x: 24, y: 60, w: 352, h: 180, content: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800', zIndex: 1 },
        { id: 't4', type: 'text', x: 24, y: 250, w: 352, h: 220, content: "Can an element be both visible and hidden? Schrödinger's Div explains all.", zIndex: 1 }
    ],
    [
        { id: 'i5', type: 'image', x: 24, y: 60, w: 352, h: 180, content: 'https://images.unsplash.com/photo-1502472584811-0a2f2ca84465?auto=format&fit=crop&q=80&w=800', zIndex: 1 },
        { id: 't5', type: 'text', x: 24, y: 250, w: 352, h: 220, content: "Exploring the hidden corners of the digital world.", zIndex: 1 }
    ],
    [
        { id: 'end', type: 'text', x: 50, y: 200, w: 300, h: 100, content: "Safe Landing", zIndex: 1 }
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

  const totalSheets = 3; 
  
  // --- Auto-Scaling Logic ---
  useEffect(() => {
    if (!sceneWrapperRef.current) return;

    const calculateScale = () => {
        if (!sceneWrapperRef.current) return;
        const { width, height } = sceneWrapperRef.current.getBoundingClientRect();
        const contentHeight = 510; 
        const contentWidth = 950; 
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
  const playSound = (type: 'turn' | 'rustle' | 'thud' | 'fold' | 'crunch') => {
    if (typeof window === 'undefined') return;
    if (config.isMuted || config.volume <= 0) return;

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.value = config.volume;
    masterGain.connect(ctx.destination);
    
    const bufferSize = ctx.sampleRate * (type === 'crunch' ? 1.5 : (type === 'rustle' || type === 'fold' ? 1.0 : 0.5));
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
    } else if (type === 'crunch') {
        filter.type = 'highpass';
        filter.frequency.value = 400;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
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

  const handleAction = () => {
    if (flippedIndex > 0) {
        playSound('turn');
        setFlippedIndex(0);
        // Wait for turn to cover to finish
        setTimeout(() => {
            startSequence();
        }, config.turnDuration + 100);
    } else {
        startSequence();
    }
  };

  const startSequence = () => {
      // Step 0: Close Book
      setFoldState('CLOSED_VERTICAL');
      playSound('rustle');

      if (animationMode === 'AIRPLANE') {
        setTimeout(() => { setFoldState('FOLDING_1'); playSound('fold'); }, 500);
        setTimeout(() => { setFoldState('FOLDING_2'); playSound('fold'); }, 500 + config.foldDuration);
        setTimeout(() => { setFoldState('FOLDING_3'); playSound('fold'); }, 500 + config.foldDuration * 2);
        setTimeout(() => { setFoldState('FLYING'); playSound('turn'); }, 500 + config.foldDuration * 3);
      } 
      else if (animationMode === 'BALL') {
        setTimeout(() => { setFoldState('CRUMPLING'); playSound('crunch'); }, 500);
        setTimeout(() => { setFoldState('TRASHED'); playSound('thud'); }, 500 + config.foldDuration * 1.5);
      }
      else if (animationMode === 'DINOSAUR') {
        setTimeout(() => { setFoldState('DINO_BASE'); playSound('fold'); }, 500);
        setTimeout(() => { setFoldState('DINO_NECK'); playSound('fold'); }, 500 + config.foldDuration);
        setTimeout(() => { setFoldState('DINO_HEAD'); playSound('fold'); }, 500 + config.foldDuration * 2);
        setTimeout(() => { setFoldState('DINO_DONE'); playSound('fold'); }, 500 + config.foldDuration * 3);
      }
  };

  const handleReset = () => {
      if (foldState !== 'READING') {
          playSound('rustle');
          setFoldState('READING');
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
               
               const imgData = pageCanvas.toDataURL('image/jpeg', 0.85);
               
               setPages(prev => {
                   const newPages = [...prev];
                   if (newPages[i]) {
                       newPages[i] = [{
                           id: `pdf-${i}`,
                           type: 'image',
                           x: 0,
                           y: 0,
                           w: 400, 
                           h: 500, 
                           content: imgData,
                           zIndex: 1
                       }];
                   }
                   return newPages;
               });
          }
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
      if (foldState !== 'READING') handleReset();

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

  const faceStyle: React.CSSProperties = {
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
  };

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
      
      {/* 3D Scene Container */}
      <div ref={sceneWrapperRef} className="flex-1 flex items-center justify-center overflow-hidden relative min-h-0">
        
        {/* Navigation Arrows */}
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

        {/* Scaled Wrapper for 3D Content */}
        <div 
            className="transition-transform duration-300 origin-center flex items-center justify-center"
            style={{ 
                transform: `scale(${sceneScale})`,
                pointerEvents: isEditMode ? 'auto' : 'none' 
            }}
        >
            
            {/* The Stage */}
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
                    {/* Left Base */}
                    <div 
                        className={`absolute top-0 bottom-0 right-[50%] w-[400px] bg-[#e5e5e5] rounded-l-md shadow-2xl flex items-center justify-center border-r border-neutral-300 transition-opacity duration-500 ${flippedIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
                        style={{ transform: 'translateZ(-50px)' }}
                    >
                        <div className="text-neutral-300 font-serif rotate-[-5deg]">End of Paper</div>
                    </div>

                    {/* Right Base */}
                    <div 
                        className="absolute top-0 bottom-0 left-[50%] w-[400px] rounded-r-md shadow-xl p-6 flex flex-col border-l border-neutral-300"
                        style={{ transform: 'translateZ(-50px)', ...getPaperStyle() }}
                    >
                        <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-300 pb-2 mb-4">Back Cover</div>
                        <div className="flex-1 border-2 border-dashed border-neutral-300 flex items-center justify-center">
                            <span className="text-neutral-400 italic" style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}>Subscription Card</span>
                        </div>
                    </div>

                    {/* Sheets... (Same as before) */}
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
                        <div className="absolute inset-0 shadow-[inset_10px_0_20px_rgba(0,0,0,0.1)] flex flex-col" style={{ ...faceStyle, transform: 'translateZ(1px)', ...getPaperStyle() }}>
                            {renderPageContent(4, <div className="flex justify-between text-[10px] text-neutral-500 border-b border-black mb-4 pb-1 mx-6 mt-6" style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}><span>TRAVEL</span><span>PAGE 5</span></div>)}
                        </div>
                        <div className="absolute inset-0 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.1)] p-6 flex flex-col rounded-l-md" style={{ ...faceStyle, transform: 'rotateY(180deg) translateZ(1px)', ...getPaperStyle() }}>
                             {renderPageContent(5, <div className="absolute inset-0 flex flex-col items-center justify-center border-4 double border-neutral-800 m-4 pointer-events-none opacity-50"></div>)}
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
                        <div className="absolute inset-0 shadow-[inset_10px_0_20px_rgba(0,0,0,0.1)] flex flex-col" style={{ ...faceStyle, transform: 'translateZ(1px)', ...getPaperStyle() }}>
                             {renderPageContent(2, <div className="flex justify-between text-[10px] text-neutral-500 border-b border-black mb-4 pb-1 mx-6 mt-6" style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}><span>LIFESTYLE</span><span>PAGE 3</span></div>)}
                        </div>
                        <div className="absolute inset-0 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.1)] flex flex-col rounded-l-md" style={{ ...faceStyle, transform: 'rotateY(180deg) translateZ(1px)', ...getPaperStyle() }}>
                            {renderPageContent(3, <div className="flex justify-between text-[10px] text-neutral-500 border-b border-black mb-4 pb-1 mx-6 mt-6" style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}><span>SCIENCE</span><span>PAGE 4</span></div>)}
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
                        <div className="absolute inset-0" style={{ ...faceStyle, transform: 'translateZ(1px)', ...getPaperStyle() }}>
                            {renderPageContent(0, <div className="text-center border-b-2 border-black pb-4 mb-0 pt-6 px-6 pointer-events-none"><h1 className="text-4xl font-black tracking-tight text-black mb-1" style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}>{config.publicationTitle}</h1><div className="flex justify-between text-[9px] font-sans font-bold text-neutral-600 border-t border-black pt-1 mt-1"><span>VOL. CCLIV</span><span>CSS EDITION</span><span>$1.50</span></div></div>)}
                        </div>
                        <div className="absolute inset-0 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.05)] flex flex-col rounded-l-md" style={{ ...faceStyle, transform: 'rotateY(180deg) translateZ(1px)', ...getPaperStyle() }}>
                            {renderPageContent(1, <div className="flex justify-between text-[10px] text-neutral-500 border-b border-black mb-4 pb-1 mx-6 mt-6" style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}><span>OPINION</span><span>PAGE 2</span></div>)}
                        </div>
                    </div>
                </div>

                {/* Mode 2: Animated Props */}
                {foldState !== 'READING' && (
                    <>
                        {animationMode === 'AIRPLANE' && (
                            <AirplaneFoldProp 
                                foldState={foldState} 
                                duration={config.foldDuration}
                                paperStyle={getPaperStyle()}
                            >
                                {/* Static Page 0 Content */}
                                <div className="w-full h-full relative">
                                    <div className="absolute inset-0 -z-10" style={{backgroundColor: config.paperColor}}></div>
                                    <div className="text-center border-b-2 border-black pb-4 mb-0 pt-6 px-6 pointer-events-none">
                                        <h1 className="text-4xl font-black tracking-tight text-black mb-1" style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}>{config.publicationTitle}</h1>
                                    </div>
                                    {pages[0].map(el => (
                                        <div key={el.id} className="absolute overflow-hidden" style={{left: el.x, top: el.y, width: el.w, height: el.h, zIndex: el.zIndex}}>
                                            {el.type === 'image' ? (<img src={el.content} className="w-full h-full object-cover" />) : (<div className={`w-full h-full ${el.type === 'headline' ? 'font-bold text-3xl leading-none' : 'text-[9px] text-justify leading-tight'}`} style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}>{el.content}</div>)}
                                        </div>
                                    ))}
                                </div>
                            </AirplaneFoldProp>
                        )}

                        {animationMode === 'BALL' && (
                            <CrumpledBallProp
                                foldState={foldState}
                                duration={config.foldDuration}
                                paperStyle={getPaperStyle()}
                            >
                                <div className="w-full h-full relative">
                                    <div className="absolute inset-0 -z-10" style={{backgroundColor: config.paperColor}}></div>
                                    <div className="text-center border-b-2 border-black pb-4 mb-0 pt-6 px-6 pointer-events-none">
                                        <h1 className="text-4xl font-black tracking-tight text-black mb-1" style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}>{config.publicationTitle}</h1>
                                    </div>
                                    {pages[0].map(el => (
                                        <div key={el.id} className="absolute overflow-hidden" style={{left: el.x, top: el.y, width: el.w, height: el.h, zIndex: el.zIndex}}>
                                            {el.type === 'image' ? (<img src={el.content} className="w-full h-full object-cover" />) : (<div className={`w-full h-full ${el.type === 'headline' ? 'font-bold text-3xl leading-none' : 'text-[9px] text-justify leading-tight'}`} style={{ fontFamily: FONT_STYLES[config.fontStyle].fontFamily }}>{el.content}</div>)}
                                        </div>
                                    ))}
                                </div>
                            </CrumpledBallProp>
                        )}

                        {animationMode === 'DINOSAUR' && (
                             <DinosaurFoldProp 
                                foldState={foldState}
                                duration={config.foldDuration}
                                paperStyle={getPaperStyle()}
                             >
                                <div className="w-full h-full relative">
                                    <div className="absolute inset-0 -z-10" style={{backgroundColor: config.paperColor}}></div>
                                    {/* Simplified content mapping for dino */}
                                    <div className="p-4">
                                        <h1 className="text-6xl font-black text-black opacity-30">{config.publicationTitle.substring(0, 2)}</h1>
                                    </div>
                                    {pages[0].filter(e => e.type === 'image').slice(0,1).map(el => (
                                        <div key={el.id} className="absolute top-10 left-10 w-20 h-20 opacity-40">
                                            <img src={el.content} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                             </DinosaurFoldProp>
                        )}
                    </>
                )}

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

      {/* Control Panel */}
      <div 
        style={{ height: controlPanelHeight }} 
        className="bg-neutral-900 z-30 overflow-y-auto shrink-0"
      >
         <div className="p-4 md:p-6 max-w-4xl mx-auto flex flex-col gap-6">
            
            {/* Top Row */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
                <div className="flex-1 w-full space-y-4">
                    {/* Header & Modes */}
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs md:text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Aviator's Desk
                        </h3>
                        
                        <div className="flex items-center gap-2">
                             <button
                                onClick={() => setIsEditMode(!isEditMode)}
                                className={`flex items-center gap-2 text-[10px] md:text-xs px-3 py-1.5 rounded-full border transition-all ${isEditMode ? 'bg-blue-600 border-blue-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'}`}
                            >
                                {isEditMode ? <Check size={12} /> : <Pencil size={12} />}
                                {isEditMode ? 'Done' : 'Edit'}
                            </button>
                             <div className="relative">
                                <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" ref={fileInputRef} />
                                <button onClick={() => fileInputRef.current?.click()} disabled={isPdfLoading} className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] md:text-xs px-3 py-1.5 rounded-full border border-neutral-700 transition-all">
                                    {isPdfLoading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                    PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Animation Mode Selector */}
                    <div className="flex gap-2 p-1 bg-neutral-800 rounded-lg w-fit">
                        <button 
                            onClick={() => setAnimationMode('AIRPLANE')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] md:text-xs font-medium transition-all ${animationMode === 'AIRPLANE' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
                        >
                            <Plane size={14} /> Paper Plane
                        </button>
                        <button 
                            onClick={() => setAnimationMode('BALL')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] md:text-xs font-medium transition-all ${animationMode === 'BALL' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
                        >
                            <CircleDashed size={14} /> Crumpled Ball
                        </button>
                        <button 
                            onClick={() => setAnimationMode('DINOSAUR')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] md:text-xs font-medium transition-all ${animationMode === 'DINOSAUR' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
                        >
                            <Footprints size={14} /> Origami Dino
                        </button>
                    </div>
                    
                    {/* Content Editor */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3">
                        <div className="space-y-1 col-span-2 md:col-span-2">
                            <label className="text-[10px] text-neutral-500 font-mono">PUBLICATION TITLE</label>
                            <input 
                                type="text" 
                                value={config.publicationTitle}
                                onChange={(e) => setConfig({...config, publicationTitle: e.target.value})}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                         <div className="space-y-1 col-span-2 md:col-span-2">
                            <label className="text-[10px] text-neutral-500 font-mono">TYPOGRAPHY</label>
                            <div className="flex gap-1">
                                {['classic', 'modern', 'typewriter'].map((f) => (
                                    <button key={f} onClick={() => setConfig({...config, fontStyle: f as FontStyle})} className={`flex-1 px-1 py-1 rounded text-[10px] capitalize border ${config.fontStyle === f ? 'bg-neutral-700 border-neutral-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400'}`}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="col-span-2 md:col-span-6 space-y-4 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar border-t border-neutral-800 pt-4">
                            {pages.map((pageElements, pIndex) => (
                                <div key={pIndex} className="space-y-2">
                                    <div className="flex items-center justify-between sticky top-0 bg-neutral-900/90 backdrop-blur-sm py-1 z-10 border-b border-neutral-800">
                                        <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase">{pIndex === 0 ? 'COVER PAGE' : `PAGE ${pIndex + 1}`}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => addPageElement(pIndex, 'text')} className="text-[9px] flex items-center gap-1 text-neutral-400 hover:text-white bg-neutral-800 px-2 py-0.5 rounded"><Plus size={8} /> Text</button>
                                            <button onClick={() => addPageElement(pIndex, 'image')} className="text-[9px] flex items-center gap-1 text-neutral-400 hover:text-white bg-neutral-800 px-2 py-0.5 rounded"><ImageIcon size={8} /> Image</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {pageElements.map((el) => (
                                            <div key={el.id} className="group relative flex flex-col gap-1 p-2 border border-neutral-800 rounded bg-neutral-900/50">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-1"><label className="text-[9px] text-neutral-500 font-mono uppercase truncate">{el.type}</label>{el.link && <LinkIcon size={8} className="text-blue-500" />}</div>
                                                    <button onClick={() => deletePageElement(pIndex, el.id)} className="text-neutral-700 hover:text-red-500 transition-colors"><Trash2 size={10} /></button>
                                                </div>
                                                {el.type === 'image' ? (
                                                    <input type="text" value={el.content.startsWith('data:') ? 'PDF Asset' : el.content} onChange={(e) => updatePageElement(pIndex, el.id, { content: e.target.value })} disabled={el.content.startsWith('data:')} placeholder="Image URL" className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-[10px] text-neutral-300 focus:outline-none focus:border-green-500 placeholder:text-neutral-600" />
                                                ) : (
                                                    <textarea value={el.content} onChange={(e) => updatePageElement(pIndex, el.id, { content: e.target.value })} placeholder="Content..." className="w-full h-8 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-[10px] text-neutral-300 focus:outline-none focus:border-green-500 resize-none leading-tight placeholder:text-neutral-600" />
                                                )}
                                                <div className="relative mt-1">
                                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none"><LinkIcon size={8} /></div>
                                                    <input type="text" value={el.link || ''} onChange={(e) => updatePageElement(pIndex, el.id, { link: e.target.value })} placeholder="Add Link URL..." className="w-full bg-neutral-800 border border-neutral-700 rounded pl-5 pr-2 py-1 text-[9px] text-blue-300 focus:outline-none focus:border-blue-500 placeholder:text-neutral-700" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Action Button */}
                <button
                    onClick={foldState === 'READING' ? handleAction : handleReset}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-serif text-sm border transition-all shadow-lg active:scale-95 whitespace-nowrap h-fit ${
                        foldState !== 'READING'
                        ? 'bg-neutral-800/50 text-neutral-600 border-neutral-800 cursor-pointer hover:bg-neutral-800'
                        : 'bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white border-blue-600 hover:border-blue-500 hover:shadow-xl'
                    }`}
                >
                    {foldState === 'READING' ? (
                        <>
                            <Send size={18} />
                            {animationMode === 'AIRPLANE' ? 'Fold & Fly' : animationMode === 'BALL' ? 'Crumple & Toss' : 'Origami Fold'}
                        </>
                    ) : (
                        <>
                            <ArrowDownToLine size={18} />
                            Reset Scene
                        </>
                    )}
                </button>
            </div>

            {/* Production Controls Panel (Simplified) */}
            <div className="border-t border-neutral-800 pt-4">
                 <div className="flex items-center gap-2 mb-4">
                    <Settings size={14} className="text-neutral-500" />
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Production Settings</h4>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-5 gap-6 bg-black/20 p-4 rounded-lg border border-neutral-800/50">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-neutral-400 font-mono uppercase"><span className="flex items-center gap-1"><Clock size={10} /> Speed</span><span>{config.foldDuration}ms</span></div>
                        <input type="range" min="500" max="3000" step="100" value={config.foldDuration} onChange={(e) => setConfig({...config, foldDuration: Number(e.target.value)})} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    {/* ... other settings same as before ... */}
                    <div className="space-y-2">
                         <div className="flex justify-between text-[10px] text-neutral-400 font-mono uppercase"><span className="flex items-center gap-1"><Palette size={10} /> Color</span><span className="w-3 h-3 rounded-full border border-neutral-600" style={{background: config.paperColor}}></span></div>
                         <div className="flex gap-2">
                            {['#f4f1ea', '#ffffff', '#e2e8f0', '#fef3c7', '#1e293b'].map((color) => (<button key={color} onClick={() => setConfig({...config, paperColor: color})} className={`w-6 h-6 rounded-full border-2 ${config.paperColor === color ? 'border-green-500' : 'border-neutral-600'}`} style={{backgroundColor: color}} />))}
                         </div>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FlyingAirplaneNewspaper;