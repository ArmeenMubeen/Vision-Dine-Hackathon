"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { X, Camera, Box } from 'lucide-react';
import { Playfair_Display } from 'next/font/google';
import Head from 'next/head';

const playfair = Playfair_Display({ subsets: ['latin'] });

export default function MobileARPage() {
  const router = useRouter();
  const params = useParams();
  const dishId = params.dishId as string;

  const [dish, setDish] = useState<any>(null);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const modelViewerRef = React.useRef<any>(null);

  useEffect(() => {
    // Dynamic import for model-viewer to ensure it only loads on the client
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
        
        setDish(dishData);
        if (dishData.restaurants && dishData.restaurants.name) {
          setRestaurantName(dishData.restaurants.name);
        }
      } catch (error) {
        console.error("Error fetching dish for AR:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDishDetails();
  }, [dishId]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${dish?.dish_name || 'this dish'} from ${restaurantName}`,
          text: `I'm viewing ${dish?.dish_name} in AR!`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      alert("Sharing is not supported on this browser.");
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
        const img = new Image();
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
      console.error("Capture failed:", err);
    }
  };

  if (isLoading) {
    return <div className="h-screen w-screen bg-black flex items-center justify-center text-white">Loading AR Experience...</div>;
  }

  if (!dish) {
    return <div className="h-screen w-screen bg-black flex items-center justify-center text-white">Dish not found</div>;
  }

  if (!hasStarted) {
    return (
      <div className="h-screen w-screen bg-[#0a1128] flex flex-col items-center justify-center text-white p-8 font-sans">
         <div className="w-20 h-20 bg-white/10 rounded-[28px] flex items-center justify-center mb-8 animate-pulse border border-white/10">
            <Box className="w-10 h-10 text-[#e6c17a]" />
         </div>
         <h1 className={`text-4xl text-center mb-4 tracking-tight ${playfair.className}`}>Vision Dine</h1>
         <p className="text-center text-white/50 mb-12 max-w-[260px] text-sm leading-relaxed">Experience the future of dining with immersive 3D menus. Tap below to launch.</p>
         <button 
           onClick={() => setHasStarted(true)}
           className="w-full max-w-xs py-5 bg-gradient-to-r from-[#e6c17a] to-[#b38728] text-[#0a1128] font-bold rounded-2xl shadow-2xl active:scale-95 transition-transform tracking-widest text-xs"
         >
           TAP TO ENTER AR
         </button>
         <p className="mt-8 text-[10px] text-white/30 uppercase tracking-[0.2em]">Powered by VisionScale™</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white font-sans selection:bg-white/30">
      <Head>
        <title>{dish.dish_name} - AR View</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>

      {/* model-viewer background spanning full screen */}
      {/* @ts-ignore */}
      <model-viewer
        ref={modelViewerRef}
        src={dish.glb_url || undefined}
        ios-src={dish.usdz_url || undefined}
        ar
        ar-modes="scene-viewer webxr quick-look"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
        alt={`A 3D model of ${dish.dish_name}`}
      >
      {/* @ts-ignore */}
      </model-viewer>

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
          <span className="text-white text-xs font-bold shadow-sm">Share to Story</span>
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
          {/* Empty spacer for centering the capture button */}
          <div className="w-16 h-16"></div>

          {/* Capture Button Container */}
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
