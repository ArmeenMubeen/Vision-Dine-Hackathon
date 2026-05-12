"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { X, Camera, Box, Volume2 } from 'lucide-react';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'] });

export default function MobileARPage() {
  const router = useRouter();
  const params = useParams();
  const dishId = params.dishId as string;

  const [dish, setDish] = useState<any>(null);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasModel, setHasModel] = useState(false);
  const modelViewerRef = React.useRef<any>(null);

  useEffect(() => {
    console.log('[VisionDine AR] dishId:', dishId);
    import('@google/model-viewer').catch(console.error);

    async function fetchDishDetails() {
      if (!dishId) return;
      try {
        const { data: dishData, error: dishError } = await supabase
          .from('dishes')
          .select('*, restaurants(name)')
          .eq('id', dishId)
          .single();

        if (dishError) throw dishError;

        console.log('[VisionDine AR] Data:', {
          name: dishData.dish_name,
          glb: dishData.glb_url,
          usdz: dishData.usdz_url,
          image: dishData.image_url,
        });

        setDish(dishData);
        // Only flag as having a model if we have a real URL
        const glbValid = dishData.glb_url && dishData.glb_url.startsWith('http');
        const usdzValid = dishData.usdz_url && dishData.usdz_url.startsWith('http');
        setHasModel(glbValid || usdzValid);

        if (dishData.restaurants?.name) {
          setRestaurantName(dishData.restaurants.name);
        }
      } catch (error) {
        console.error('[VisionDine AR] Fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDishDetails();
  }, [dishId]);

  const handleLaunchAR = useCallback(() => {
    setHasStarted(true);
    // After render, try to activate native AR via user gesture
    setTimeout(() => {
      const mv = modelViewerRef.current;
      if (mv && mv.activateAR) {
        mv.activateAR().catch(() => {
          console.log('[VisionDine AR] activateAR not available (expected on desktop)');
        });
      }
    }, 600);
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${dish?.dish_name} from ${restaurantName}`,
          text: `Check out ${dish?.dish_name} in AR!`,
          url: window.location.href,
        });
      } catch (e) { console.error(e); }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied!');
      } catch { alert('Sharing not supported'); }
    }
  };

  const handleCapture = async () => {
    const mv = modelViewerRef.current;
    if (!mv) return;
    try {
      const blob = await mv.toBlob({ idealAspect: true, mimeType: 'image/png' });
      if (!blob) return;
      const img = new window.Image();
      img.src = URL.createObjectURL(blob);
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const fs = Math.floor(c.width / 20);
        ctx.font = `bold ${fs}px sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.textAlign = 'right';
        ctx.fillText('Vision Dine', c.width - fs, c.height - fs);
        const link = document.createElement('a');
        link.download = `${dish?.dish_name || 'dish'}-ar.png`;
        link.href = c.toDataURL('image/png');
        link.click();
        URL.revokeObjectURL(img.src);
      };
    } catch (err) { console.error('Capture failed:', err); }
  };

  // --- LOADING ---
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#0a1128] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-[#e6c17a] rounded-full animate-spin mb-6"></div>
        <p className="text-white/50 text-sm">Loading AR Experience...</p>
      </div>
    );
  }

  // --- NOT FOUND ---
  if (!dish) {
    return (
      <div className="h-screen w-screen bg-[#0a1128] flex flex-col items-center justify-center text-white p-8">
        <Box className="w-12 h-12 text-[#e6c17a] mb-4" />
        <p className="text-lg font-bold mb-2">Dish Not Found</p>
        <button onClick={() => router.back()} className="mt-4 px-6 py-3 bg-white/10 rounded-xl text-sm font-bold border border-white/10">Go Back</button>
      </div>
    );
  }

  // --- LAUNCH OVERLAY (User Gesture Gate for Camera) ---
  if (!hasStarted) {
    return (
      <div className="h-screen w-screen bg-[#0a1128] flex flex-col items-center justify-center text-white p-8 font-sans relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#e6c17a]/10 rounded-full blur-[100px]"></div>

        {dish.image_url ? (
          <div className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl mb-8 z-10">
            <img src={dish.image_url} alt={dish.dish_name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-20 h-20 bg-white/10 rounded-[28px] flex items-center justify-center mb-8 animate-pulse border border-white/10 z-10">
            <Box className="w-10 h-10 text-[#e6c17a]" />
          </div>
        )}

        <h1 className={`text-4xl text-center mb-2 tracking-tight z-10 ${playfair.className}`}>
          {restaurantName || 'Vision Dine'}
        </h1>
        <p className={`text-xl text-[#e6c17a] mb-2 z-10 ${playfair.className}`}>{dish.dish_name}</p>
        <p className="text-center text-white/40 mb-10 max-w-[280px] text-sm leading-relaxed z-10">
          {hasModel
            ? 'Experience this dish in life-sized 3D. Tap below to launch.'
            : 'View this dish in a beautiful 3D showcase. Tap below to continue.'}
        </p>

        <button
          onClick={handleLaunchAR}
          className="w-full max-w-xs py-5 bg-gradient-to-r from-[#e6c17a] to-[#b38728] text-[#0a1128] font-bold rounded-2xl shadow-2xl active:scale-95 transition-transform tracking-widest text-xs z-10"
        >
          {hasModel ? 'LAUNCH AR EXPERIENCE' : 'VIEW 3D SHOWCASE'}
        </button>

        <p className="mt-8 text-[10px] text-white/20 uppercase tracking-[0.2em] z-10">Powered by VisionScale™</p>
      </div>
    );
  }

  // --- NO 3D MODEL: Show a premium image-only experience ---
  if (!hasModel) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-[#0a1128] text-white font-sans">
        {/* Close */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 z-20 active:scale-95 transition-transform"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="absolute top-6 right-6 flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] border border-white/20 shadow-lg z-20 active:scale-95 transition-transform"
        >
          <svg className="w-4 h-4 text-white mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
          <span className="text-white text-xs font-bold">Share</span>
        </button>

        {/* Restaurant Name */}
        <div className="absolute top-24 left-0 right-0 text-center z-10">
          <h1 className={`text-4xl tracking-wide bg-gradient-to-b from-[#e6c17a] to-[#b38728] bg-clip-text text-transparent ${playfair.className}`}>
            {restaurantName}
          </h1>
        </div>

        {/* Centered Dish Image with glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-72 h-72 bg-[#e6c17a]/15 rounded-full blur-[80px]"></div>
          {dish.image_url ? (
            <img
              src={dish.image_url}
              alt={dish.dish_name}
              className="w-64 h-64 object-cover rounded-[32px] border-2 border-white/10 shadow-2xl z-10 animate-[float_3s_ease-in-out_infinite]"
            />
          ) : (
            <div className="w-64 h-64 bg-white/5 rounded-[32px] border-2 border-white/10 flex items-center justify-center z-10">
              <Camera className="w-16 h-16 text-white/20" />
            </div>
          )}
        </div>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 flex flex-col items-center z-10 bg-gradient-to-t from-[#0a1128] via-[#0a1128]/80 to-transparent">
          <h2 className={`text-3xl text-white mb-2 ${playfair.className}`}>{dish.dish_name}</h2>
          <p className="text-white/40 text-sm mb-6">PKR {dish.price}</p>
          <p className="text-[10px] text-white/30 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            Upload a .GLB model to enable full AR experience
          </p>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
          }
        `}</style>
      </div>
    );
  }

  // --- FULL 3D AR EXPERIENCE (GLB model exists) ---
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white font-sans">

      {/* model-viewer: NO poster so the 3D model renders immediately */}
      {/* @ts-ignore */}
      <model-viewer
        ref={modelViewerRef}
        src={dish.glb_url}
        ios-src={dish.usdz_url || undefined}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        touch-action="none"
        shadow-intensity="1.2"
        shadow-softness="0.8"
        exposure="0.9"
        loading="eager"
        reveal="auto"
        camera-orbit="0deg 75deg 105%"
        min-camera-orbit="auto auto 50%"
        max-camera-orbit="auto auto 200%"
        interaction-prompt="auto"
        interaction-prompt-threshold="3000"
        style={{ width: '100%', height: '100%', backgroundColor: 'transparent', '--poster-color': 'transparent' } as any}
        alt={`3D model of ${dish.dish_name}`}
      >
        {/* Custom AR button inside model-viewer */}
        <button slot="ar-button" style={{
          position: 'absolute',
          bottom: '130px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '14px 28px',
          background: 'linear-gradient(to right, #e6c17a, #b38728)',
          color: '#0a1128',
          fontWeight: 'bold',
          fontSize: '11px',
          letterSpacing: '0.15em',
          border: 'none',
          borderRadius: '16px',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(230,193,122,0.3)',
        }}>
          👁️ PLACE IN YOUR SPACE
        </button>

        {/* Loading indicator inside model-viewer */}
        <div slot="progress-bar" style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          width: '100%',
          height: '4px',
          background: 'linear-gradient(to right, #e6c17a, #b38728)',
        }}></div>
      {/* @ts-ignore */}
      </model-viewer>

      {/* Top UI Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none z-10">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 pointer-events-auto active:scale-95 transition-transform"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={handleShare}
          className="flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] border border-white/20 shadow-lg pointer-events-auto active:scale-95 transition-transform"
        >
          <svg className="w-4 h-4 text-white mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
          <span className="text-white text-xs font-bold">Share</span>
        </button>
      </div>

      {/* Restaurant Name */}
      <div className="absolute top-24 left-0 right-0 text-center pointer-events-none z-10 drop-shadow-2xl">
        <h1 className={`text-4xl md:text-5xl tracking-wide bg-gradient-to-b from-[#e6c17a] to-[#b38728] bg-clip-text text-transparent ${playfair.className}`}>
          {restaurantName || 'Restaurant'}
        </h1>
      </div>

      {/* Bottom UI */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 flex flex-col items-center justify-end pointer-events-none z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
        <h2 className={`text-3xl text-white mb-6 drop-shadow-lg text-center ${playfair.className}`}>
          {dish.dish_name}
        </h2>

        <div className="w-full flex items-center justify-between pointer-events-auto">
          <div className="w-16 h-16"></div>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleCapture}
              className="w-20 h-20 rounded-full border-[4px] border-white/50 flex items-center justify-center active:scale-90 transition-transform"
            >
              <div className="w-16 h-16 rounded-full bg-white shadow-lg"></div>
            </button>
            <span className="text-[10px] tracking-[0.2em] text-white/80 font-semibold uppercase">Capture Frame</span>
          </div>

          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/20 shadow-xl bg-black/40 backdrop-blur-md flex items-center justify-center relative">
            {dish.image_url ? (
              <img src={dish.image_url} alt="thumb" className="w-full h-full object-cover" />
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
