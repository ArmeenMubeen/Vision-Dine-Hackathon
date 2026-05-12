"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Settings, Plus, Search, Filter, Box, QrCode, Pencil, X, Download, Image as ImageIcon } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export default function RestaurantDashboard() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.id as string;

  const [restaurant, setRestaurant] = useState<any>(null);
  const [dishes, setDishes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQrDish, setSelectedQrDish] = useState<any>(null);

  const downloadQR = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    let downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `${selectedQrDish?.dish_name || 'dish'}-qr.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  useEffect(() => {
    async function fetchData() {
      if (!restaurantId) return;
      setIsLoading(true);
      try {
        // Fetch Restaurant details
        const { data: restData, error: restError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .single();
        
        if (restError) throw restError;
        setRestaurant(restData);

        // Fetch Dishes
        const { data: dishesData, error: dishesError } = await supabase
          .from('dishes')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false });
        
        if (dishesError && dishesError.code !== '42P01') { 
          // Ignore 42P01 if the table doesn't exist yet so it doesn't crash the whole page
          throw dishesError;
        }
        
        setDishes(dishesData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [restaurantId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex flex-col items-center justify-center">
        <p className="text-gray-500 font-medium mb-4">Restaurant not found.</p>
        <button onClick={() => router.push('/directory')} className="text-[#0a1128] font-bold hover:underline">Return to Directory</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] p-4 md:p-8 font-sans text-[#0a1128]">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Top Nav */}
        <button 
          onClick={() => router.push('/directory')}
          className="flex items-center text-sm font-medium text-[#64748b] hover:text-[#0a1128] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Restaurants
        </button>

        {/* Hero Banner */}
        <div className="bg-[#0a1128] text-white rounded-[24px] p-8 md:p-10 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between shadow-lg relative overflow-hidden">
          
          <div className="flex items-center z-10">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.name} className="w-20 h-20 rounded-full border-4 border-[#1a2342] object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#1a2342] border-4 border-[#2a3455] flex items-center justify-center text-2xl font-bold uppercase">
                {restaurant.name.charAt(0)}
              </div>
            )}
            
            <div className="ml-6">
              <h1 className="text-3xl font-bold mb-2 tracking-tight">{restaurant.name}</h1>
              <div className="flex items-center text-[#8792a2] text-sm font-medium">
                <span>{restaurant.location || 'Location Not Set'}</span>
                <span className="mx-3 text-[#3a4465]">•</span>
                <span>{dishes.length} Items</span>
                <span className="mx-3 text-[#3a4465]">•</span>
                <span className="flex items-center text-[#b8960c]">
                  <Box className="w-4 h-4 mr-1.5" />
                  WebAR Enabled
                </span>
              </div>
            </div>
          </div>

          <button className="mt-6 md:mt-0 flex items-center px-4 py-2.5 bg-white/10 hover:bg-white/20 transition-colors rounded-xl text-sm font-bold z-10 backdrop-blur-md border border-white/10">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>

          {/* Decorative background shape */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        </div>

        {/* Menu Items Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Card Header */}
          <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#0a1128]">Menu Items</h2>
              <p className="text-[#64748b] text-sm mt-1">Manage dish details and AR models</p>
            </div>
            <button 
              onClick={() => router.push(`/restaurants/${restaurantId}/dishes/new`)}
              className="flex items-center px-5 py-2.5 bg-[#0a1128] text-white text-sm font-bold rounded-xl hover:bg-[#1a2342] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Dish
            </button>
          </div>

          {/* Search & Filters */}
          <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 bg-gray-50/50">
            <div className="relative flex-grow max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-[#8792a2]" />
              </div>
              <input 
                type="text" 
                placeholder="Search food items..." 
                className="block w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#0a1128] focus:ring-1 focus:ring-[#0a1128] outline-none text-sm bg-white"
              />
            </div>
            <button className="flex items-center justify-center px-5 py-3 bg-white border border-gray-200 text-[#0a1128] text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 mr-2 text-[#8792a2]" />
              Filters
            </button>
          </div>

          {/* Dishes Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-8 py-4 text-left text-[11px] font-bold text-[#8792a2] tracking-widest uppercase">Dish Name</th>
                  <th scope="col" className="px-8 py-4 text-left text-[11px] font-bold text-[#8792a2] tracking-widest uppercase">Price</th>
                  <th scope="col" className="px-8 py-4 text-left text-[11px] font-bold text-[#8792a2] tracking-widest uppercase">AR Status</th>
                  <th scope="col" className="px-8 py-4 text-left text-[11px] font-bold text-[#8792a2] tracking-widest uppercase">QR</th>
                  <th scope="col" className="px-8 py-4 text-right text-[11px] font-bold text-[#8792a2] tracking-widest uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {dishes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center">
                      <p className="text-gray-500 font-medium text-sm">No dishes found. Click "+ Add Dish" to get started.</p>
                    </td>
                  </tr>
                ) : (
                  dishes.map((dish) => (
                    <tr key={dish.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          {dish.image_url ? (
                            <img src={dish.image_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-[#8792a2]">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-[15px] font-bold text-[#0a1128]">{dish.dish_name}</div>
                            <div className="text-xs text-[#8792a2] mt-0.5">{dish.item_id || 'No ID'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-sm font-bold text-[#0a1128]">PKR {dish.price}</div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${dish.glb_url ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-gray-100 text-[#8792a2]'}`}>
                          <Box className="w-4 h-4" />
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <button 
                          onClick={() => setSelectedQrDish(dish)}
                          className="text-[#8792a2] hover:text-[#0a1128] transition-colors p-1.5 rounded-lg hover:bg-gray-100"
                        >
                          <QrCode className="w-5 h-5" />
                        </button>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-right">
                        <button className="text-[#8792a2] hover:text-[#0a1128] transition-colors p-1.5 rounded-lg hover:bg-gray-100 inline-flex">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* QR Modal */}
      {selectedQrDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedQrDish(null)}></div>
          <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setSelectedQrDish(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold text-[#0a1128] mb-1 text-center truncate w-full">{selectedQrDish.dish_name}</h3>
            <p className="text-sm text-[#64748b] mb-6 text-center">Scan to view AR experience</p>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8">
              <QRCodeCanvas 
                id="qr-canvas"
                value={`${window.location.origin}/dish/${selectedQrDish.id}/ar`}
                size={200}
                level={"H"}
                includeMargin={true}
                fgColor="#0a1128"
              />
            </div>
            
            <button 
              onClick={downloadQR}
              className="w-full flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-[#d4af37] to-[#b8960c] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:opacity-90 transition-all"
            >
              <Download className="w-5 h-5 mr-2" />
              Download QR
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
