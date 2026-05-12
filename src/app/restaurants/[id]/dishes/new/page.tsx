"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Image as LucideImage, UploadCloud, Box, Ruler } from 'lucide-react';

export default function AddNewDishPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.id as string;

  const [dishName, setDishName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [availability, setAvailability] = useState('Available');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [glbFile, setGlbFile] = useState<File | null>(null);
  const [usdzFile, setUsdzFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // VisionScale State
  const [scaleFactor, setScaleFactor] = useState(1.0);
  const [baseDimensions, setBaseDimensions] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    // Dynamic import for model-viewer
    import('@google/model-viewer').catch(console.error);
  }, []);

  const handleModelLoad = (e: any) => {
    const viewer = e.target;
    if (viewer && viewer.getDimensions) {
      const dim = viewer.getDimensions();
      setBaseDimensions({ x: dim.x, y: dim.y, z: dim.z });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGlbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setGlbFile(e.target.files[0]);
    }
  };

  const handleUsdzChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUsdzFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File, bucket: string, prefix: string) => {
    const ext = file.name.split('.').pop();
    const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName || !price || !category) {
      alert("Please fill out all required fields (*).");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      let glbUrl = null;
      let usdzUrl = null;

      // 1. Upload Image (if provided, though mockup says REQUIRED)
      if (imageFile) {
        imageUrl = await uploadFile(imageFile, 'dish_images', 'img');
      } else {
        alert("Dish Image is required.");
        setIsSubmitting(false);
        return;
      }

      // 2. Upload GLB
      if (glbFile) {
        glbUrl = await uploadFile(glbFile, 'models', 'glb');
      }

      // 3. Upload USDZ
      if (usdzFile) {
        usdzUrl = await uploadFile(usdzFile, 'models', 'usdz');
      }

      // 4. Insert into Database
      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;

      const { error: dbError } = await supabase
        .from('dishes')
        .insert([{
          restaurant_id: restaurantId,
          dish_name: dishName,
          price: numericPrice,
          dish_category: category,
          dish_description: description,
          availability: availability,
          image_url: imageUrl,
          glb_url: glbUrl,
          usdz_url: usdzUrl,
          scale_factor: scaleFactor,
          base_dimensions_cm: `${(baseDimensions.x * 100).toFixed(1)}x${(baseDimensions.y * 100).toFixed(1)}x${(baseDimensions.z * 100).toFixed(1)}`
        }]);

      if (dbError) throw dbError;

      alert("Dish successfully created!");
      router.push(`/restaurants/${restaurantId}`);

    } catch (error: any) {
      console.error("Error creating dish:", error);
      alert(`Failed to create dish: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] p-4 md:p-8 font-sans text-[#0a1128] pb-32">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Breadcrumbs & Header */}
        <div className="mb-8">
          <div className="text-sm font-medium text-[#64748b] mb-4">
            <span className="hover:underline cursor-pointer" onClick={() => router.push('/directory')}>Dashboard</span>
            <span className="mx-2">/</span>
            <span className="hover:underline cursor-pointer" onClick={() => router.push(`/restaurants/${restaurantId}`)}>Restaurant</span>
            <span className="mx-2">/</span>
            <span>Menu</span>
            <span className="mx-2">/</span>
            <span className="text-[#0a1128] font-bold">Add Dish</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Add New Dish</h1>
          <p className="text-[#64748b]">Create a new item for the menu. Fill in the details below.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Details */}
          <div className="flex-1 space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-6 flex items-center">
                <span className="mr-2">≡</span> Dish Details
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Dish Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    placeholder="e.g., Truffle Mushroom Burger" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#0a1128] outline-none text-sm placeholder-gray-400"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2">Price <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 font-bold text-sm">PKR</span>
                      <input 
                        type="text" 
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00" 
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#0a1128] outline-none text-sm font-mono placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Category <span className="text-red-500">*</span></label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#0a1128] outline-none text-sm bg-white appearance-none"
                    >
                      <option value="" disabled>Select Category</option>
                      <option value="Starters">Starters</option>
                      <option value="Mains">Mains</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Beverages">Beverages</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value.substring(0, 300))}
                    placeholder="Describe the ingredients, allergens, or story behind this dish..." 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#0a1128] outline-none text-sm placeholder-gray-400 min-h-[120px] resize-none"
                  ></textarea>
                  <div className="text-right text-xs text-gray-400 mt-1">{description.length}/300 characters</div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-3">Availability Status</label>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => setAvailability('Available')} className={`flex items-center px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${availability === 'Available' ? 'border-gray-300 shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Available
                    </button>
                    <button type="button" onClick={() => setAvailability('Sold Out')} className={`flex items-center px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${availability === 'Sold Out' ? 'border-gray-300 shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
                      <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>Sold Out
                    </button>
                    <button type="button" onClick={() => setAvailability('Hidden')} className={`flex items-center px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${availability === 'Hidden' ? 'border-gray-300 shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
                      <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>Hidden
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right Column: Media */}
          <div className="w-full lg:w-[400px] flex flex-col gap-8">
            
            {/* Dish Image */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center"><LucideImage className="w-5 h-5 mr-2" /> Dish Image</h2>
                <span className="text-[10px] font-bold bg-[#f0f4f8] text-[#64748b] px-2 py-1 rounded uppercase tracking-wider">Required</span>
              </div>
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-200 border-dashed rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden relative">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <div className="w-12 h-12 bg-[#eff4ff] text-blue-600 rounded-full flex items-center justify-center mb-3">
                      <LucideImage className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-[#0a1128] mb-1">Click to upload</p>
                    <p className="text-xs text-[#8792a2]">SVG, PNG, JPG or GIF (max. 1MB)</p>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>

            {/* 3D AR Model Upload */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center"><Box className="w-5 h-5 mr-2" /> 3D AR Model</h2>
                <span className="text-[10px] font-bold bg-[#f0f4f8] text-[#64748b] px-2 py-1 rounded uppercase tracking-wider">Optional</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* GLB Upload */}
                <label className="flex flex-col items-center justify-center h-32 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors text-center p-2 relative overflow-hidden">
                  <UploadCloud className={`w-6 h-6 mb-2 ${glbFile ? 'text-green-500' : 'text-[#64748b]'}`} />
                  <p className="text-[13px] font-bold text-[#0a1128] leading-tight">
                    {glbFile ? 'GLB Selected' : 'Upload .GLB'}
                  </p>
                  <p className="text-[11px] text-[#8792a2] mt-1">(Android)</p>
                  <input type="file" accept=".glb" className="hidden" onChange={handleGlbChange} />
                </label>

                {/* USDZ Upload */}
                <label className="flex flex-col items-center justify-center h-32 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors text-center p-2 relative overflow-hidden">
                  <UploadCloud className={`w-6 h-6 mb-2 ${usdzFile ? 'text-green-500' : 'text-[#64748b]'}`} />
                  <p className="text-[13px] font-bold text-[#0a1128] leading-tight">
                    {usdzFile ? 'USDZ Selected' : 'Upload .USDZ'}
                  </p>
                  <p className="text-[11px] text-[#8792a2] mt-1">(iOS)</p>
                  <input type="file" accept=".usdz" className="hidden" onChange={handleUsdzChange} />
                </label>
              </div>
            </div>

            {/* VisionScale™ Preview & Scaling */}
            {glbFile && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center"><Ruler className="w-5 h-5 mr-2" /> VisionScale™</h2>
                  <span className="text-[10px] font-bold bg-[#eff4ff] text-blue-600 px-2 py-1 rounded uppercase tracking-wider">Live Scaling</span>
                </div>
                
                <div className="w-full h-64 bg-gray-50 rounded-xl overflow-hidden mb-6 border border-gray-100">
                  {/* @ts-ignore */}
                  <model-viewer
                    src={URL.createObjectURL(glbFile)}
                    ar-modes="webxr scene-viewer quick-look"
                    camera-controls
                    auto-rotate
                    onLoad={handleModelLoad}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-[#0a1128]">Fine-Tune Scale</label>
                    <span className="text-xs font-mono font-bold bg-gray-100 px-2 py-1 rounded">x{scaleFactor.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="5.0" 
                    step="0.01" 
                    value={scaleFactor}
                    onChange={(e) => setScaleFactor(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#0a1128]"
                  />
                  
                  <div className="bg-[#f8f9fc] p-4 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-3">Estimated Real-World Size (CM)</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <p className="text-[10px] text-[#8792a2] uppercase mb-1">Width</p>
                        <p className="text-sm font-bold text-[#0a1128]">{(baseDimensions.x * scaleFactor * 100).toFixed(1)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-[#8792a2] uppercase mb-1">Height</p>
                        <p className="text-sm font-bold text-[#0a1128]">{(baseDimensions.y * scaleFactor * 100).toFixed(1)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-[#8792a2] uppercase mb-1">Depth</p>
                        <p className="text-sm font-bold text-[#0a1128]">{(baseDimensions.z * scaleFactor * 100).toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#8792a2] leading-relaxed italic">
                    * Dimensions are calculated based on the 3D model's bounding box and your scale factor.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Floating Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 px-8 flex justify-end gap-4 z-50">
            <button 
              type="button" 
              className="px-6 py-2.5 bg-white border border-gray-300 text-[#0a1128] text-[15px] font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Save & Add Another
            </button>
            <button 
              type="submit" 
              className="px-6 py-2.5 bg-[#8792a2] text-white text-[15px] font-bold rounded-xl shadow-sm hover:bg-[#64748b] transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Dish'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
