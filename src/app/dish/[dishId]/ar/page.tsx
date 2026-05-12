"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { X, Camera, Box, Volume2 } from 'lucide-react';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'] });

const FALLBACK_MODEL = '/models/fallback.glb';

export default function MobileARPage() {
  const router = useRouter();
  const params = useParams();
  const dishId = params.dishId as string;

  const [dish, setDish] = useState<any>(null);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [modelSrc, setModelSrc] = useState<string | null>(null);
  const [modelError, setModelError] = useState(false);
  const modelViewerRef = React.useRef<any>(null);

  // Debug: Log dishId on mount
  useEffect(() => {
    console.log('[VisionDine AR] dishId from URL:', dishId);
  }, [dishId]);

  useEffect(() => {
    // Dynamic import for model-viewer
    import('@google/model-viewer').catch((err) => {
      console.error('[VisionDine AR] Failed to load model-viewer library:', err);
    });

    async function fetchDishDetails() {
      if (!dishId) {
        console.error('[VisionDine AR] No dishId found in URL params');
        return;
      }

      try {
        console.log('[VisionDine AR] Fetching dish details for:', dishId);

        const { data: dishData, error: dishError } = await supabase
          .from('dishes')
          .select('*, restaurants(name)')
          .eq('id', dishId)
          .single();

        if (dishError) {
          console.error('[VisionDine AR] Supabase query error:', dishError);
          throw dishError;
        }
        
        console.log('[VisionDine AR] Dish data received:', {
          name: dishData.dish_name,
          glb_url: dishData.glb_url,
          usdz_url: dishData.usdz_url,
          image_url: dishData.image_url,
          scale_factor: dishData.scale_factor,
        });

        setDish(dishData);

        // Set model source with validation
        if (dishData.glb_url && dishData.glb_url.startsWith('http')) {
          console.log('[VisionDine AR] Using GLB URL:', dishData.glb_url);
          setModelSrc(dishData.glb_url);
        } else {
          console.warn('[VisionDine AR] No valid GLB URL found, using fallback');
          setModelSrc(FALLBACK_MODEL);
        }

        if (dishData.restaurants && dishData.restaurants.name) {
          setRestaurantName(dishData.restaurants.name);
        }
      } catch (error) {
        console.error('[VisionDine AR] Fatal fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDishDetails();
  }, [dishId]);

  const handleModelError = useCallback((event: any) => {
    console.error('[VisionDine AR] model-viewer error:', event?.detail || event);
    setModelError(true);
    setModelSrc(FALLBACK_MODEL);
  }, []);

  const handleModelLoad = useCallback(() => {
    console.log('[VisionDine AR] ✅ Model loaded successfully');
    setModelError(false);
  }, []);

  const handleLaunchAR = useCallback(() => {
    setHasStarted(true);
    // After state update, try to activate AR on next tick
    setTimeout(() => {
      if (modelViewerRef.current && modelViewerRef.current.activateAR) {
        console.log('[VisionDine AR] Activating AR via user gesture...');
        modelViewerRef.current.activateAR().catch((err: any) => {
          console.warn('[VisionDine AR] activateAR failed (expected on desktop):', err);
        });
      }
    }, 500);
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${dish?.dish_name || 'this dish'} from ${restaurantName}`,
          text: `I'm viewing ${dish?.dish_name} in AR!`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('[VisionDine AR] Share error:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch {
        alert('Sharing is not supported on this browser.');
      }
    }
  };

  const handleCapture = async () => {
    if (!modelViewerRef.current) return;
    
    try {
      const blob = await modelViewerRef.current.toBlob({
        idealAspect: true,
        mimeType: 'image/png'
      });

      if (blob) {
        const img = new window.Image();
        img.src = URL.createObjectURL(blob);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.drawImage(img, 0, 0);

          // Watermark
          const fontSize = Math.floor(canvas.width / 20);
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.textAlign = 'right';
          ctx.fillText('Vision Dine', canvas.width - fontSize, canvas.height - fontSize);

          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `${dish?.dish_name || 'dish'}-capture.png`;
          link.href = dataUrl;
          link.click();
          URL.revokeObjectURL(img.src);
        };
      }
    } catch (err) {
      console.error('[VisionDine AR] Capture failed:', err);
    }
  };

  // --- RENDER STATES ---

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#0a1128] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-white/20 border-t-[#e6c17a] rounded-full animate-spin mb-6"></div>
        <p className="text-white/50 text-sm">Loading AR Experience...</p>
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="h-screen w-screen bg-[#0a1128] flex flex-col items-center justify-center text-white p-8">
        <Box className="w-12 h-12 text-[#e6c17a] mb-4" />
        <p className="text-lg font-bold mb-2">Dish Not Found</p>
        <p className="text-white/50 text-sm text-center mb-6">The dish you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-white/10 rounded-xl text-sm font-bold border border-white/10">
          Go Back
        </button>
      </div>
    );
  }

  // --- LAUNCH OVERLAY (User Gesture Gate) ---
  if (!hasStarted) {
    return (
      <div className="h-screen w-screen bg-[#0a1128] flex flex-col items-center justify-center text-white p-8 font-sans relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#e6c17a]/10 rounded-full blur-[100px]"></div>

        {/* Dish image preview */}
        {dish.image_url && (
          <div className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl mb-8 relative z-10">
            <img src={dish.image_url} alt={dish.dish_name} className="w-full h-full object-cover" />
          </div>
        )}

        {!dish.image_url && (
          <div className="w-20 h-20 bg-white/10 rounded-[28px] flex items-center justify-center mb-8 animate-pulse border border-white/10 relative z-10">
            <Box className="w-10 h-10 text-[#e6c17a]" />
          </div>
        )}

        <h1 className={`text-4xl text-center mb-2 tracking-tight relative z-10 ${playfair.className}`}>
          {restaurantName || 'Vision Dine'}
        </h1>
        <p className={`text-xl text-[#e6c17a] mb-2 relative z-10 ${playfair.className}`}>
          {dish.dish_name}
        </p>
        <p className="text-center text-white/40 mb-12 max-w-[280px] text-sm leading-relaxed relative z-10">
          Experience this dish in life-sized augmented reality. Tap below to launch your camera.
        </p>

        <button 
          onClick={handleLaunchAR}
          className="w-full max-w-xs py-5 bg-gradient-to-r from-[#e6c17a] to-[#b38728] text-[#0a1128] font-bold rounded-2xl shadow-2xl active:scale-95 transition-transform tracking-widest text-xs relative z-10"
        >
          LAUNCH AR EXPERIENCE
        </button>

        <div className="flex items-center gap-2 mt-6 relative z-10">
          <Volume2 className="w-3 h-3 text-white/20" />
          <p className="text-[10px] text-white/20">Best experienced with sound on</p>
        </div>

        <p className="mt-6 text-[10px] text-white/20 uppercase tracking-[0.2em] relative z-10">Powered by VisionScale™</p>
      </div>
    );
  }

  // --- MAIN AR VIEW ---
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white font-sans selection:bg-white/30">

      {/* model-viewer: Full-screen 3D + AR */}
      {/* @ts-ignore */}
      <model-viewer
        ref={modelViewerRef}
        src={modelSrc || undefined}
        ios-src={dish.usdz_url || undefined}
        poster={dish.image_url || undefined}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        touch-action="none"
        shadow-intensity="1"
        exposure="0.8"
        environment-image="neutral"
        loading="eager"
        reveal="auto"
        onError={handleModelError}
        onLoad={handleModelLoad}
        style={{ width: '100%', height: '100%', backgroundColor: '#111' }}
        alt={`A 3D model of ${dish.dish_name}`}
      >
        {/* AR button slot override */}
        <button slot="ar-button" style={{
          position: 'absolute',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50)',
          padding: '12px 24px',
          background: 'linear-gradient(to right, #e6c17a, #b38728)',
          color: '#0a1128',
          fontWeight: 'bold',
          fontSize: '11px',
          letterSpacing: '0.15em',
          border: 'none',
          borderRadius: '16px',
          cursor: 'pointer',
        }}>
          👁️ VIEW IN YOUR SPACE
        </button>
      {/* @ts-ignore */}
      </model-viewer>

      {/* Model Error Banner */}
      {modelError && (
        <div className="absolute top-16 left-4 right-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 text-white text-xs p-3 rounded-xl text-center z-20">
          3D model failed to load. Showing fallback preview.
        </div>
      )}

      {/* Top UI Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none z-10">
        
        {/* Close Button */}
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 pointer-events-auto active:scale-95 transition-transform"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Share to Story Button */}
        <button 
          onClick={handleShare}
          className="flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] border border-white/20 shadow-lg pointer-events-auto active:scale-95 transition-transform"
        >
          <svg className="w-4 h-4 text-white mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
          <span className="text-white text-xs font-bold">Share to Story</span>
        </button>
      </div>

      {/* Center Header Overlay */}
      <div className="absolute top-24 left-0 right-0 text-center pointer-events-none z-10 drop-shadow-2xl">
        <h1 className={`text-4xl md:text-5xl tracking-wide bg-gradient-to-b from-[#e6c17a] to-[#b38728] bg-clip-text text-transparent ${playfair.className}`}>
          {restaurantName || 'Restaurant'}
        </h1>
      </div>

      {/* Bottom UI Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 flex flex-col items-center justify-end pointer-events-none z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
        
        {/* Dish Name */}
        <h2 className={`text-3xl text-white mb-6 drop-shadow-lg text-center ${playfair.className}`}>
          {dish.dish_name}
        </h2>

        <div className="w-full flex items-center justify-between pointer-events-auto">
          {/* Empty spacer */}
          <div className="w-16 h-16"></div>

          {/* Capture Button */}
          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={handleCapture}
              className="w-20 h-20 rounded-full border-[4px] border-white/50 flex items-center justify-center active:scale-90 transition-transform pointer-events-auto"
            >
              <div className="w-16 h-16 rounded-full bg-white shadow-lg"></div>
            </button>
            <span className="text-[10px] tracking-[0.2em] text-white/80 font-semibold uppercase">Capture Frame</span>
          </div>

          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/20 shadow-xl bg-black/40 backdrop-blur-md flex items-center justify-center relative">
             {dish.image_url ? (
               <img src={dish.image_url} alt="thumbnail" className="w-full h-full object-cover" />
             ) : (
               <Camera className="w-6 h-6 text-white/50" />
             )}
             <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl"></div>
          </div>
        </div>
      </div>

    </div>
  );
}
