"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, Image as LucideImage, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function AddNewRestaurantPage() {
  const router = useRouter();

  const [restaurantName, setRestaurantName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [location, setLocation] = useState('');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName) {
      alert("Restaurant Name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      let logoUrl = null;
      let bannerUrl = null;

      // 1. Upload Logo
      if (logoFile) {
        const ext = (logoFile.name.split('.').pop() || 'png').replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `logo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        console.log('[Supabase Upload] Logo path:', fileName, 'Bucket: logos');
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('logos')
          .upload(fileName, logoFile, { upsert: true });
        
        if (uploadError) {
          console.error('[Supabase Upload] Logo error:', uploadError);
          throw uploadError;
        }
        
        const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(fileName);
        logoUrl = publicUrlData.publicUrl;
        console.log('[Supabase Upload] Logo URL:', logoUrl);
      }

      // 2. Upload Banner
      if (bannerFile) {
        const ext = (bannerFile.name.split('.').pop() || 'png').replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `banner-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        console.log('[Supabase Upload] Banner path:', fileName, 'Bucket: banners');

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('banners')
          .upload(fileName, bannerFile, { upsert: true });
        
        if (uploadError) {
          console.error('[Supabase Upload] Banner error:', uploadError);
          throw uploadError;
        }
        
        const { data: publicUrlData } = supabase.storage.from('banners').getPublicUrl(fileName);
        bannerUrl = publicUrlData.publicUrl;
        console.log('[Supabase Upload] Banner URL:', bannerUrl);
      }

      // 3. Insert into Database
      const slug = generateSlug(restaurantName);
      const { error: dbError } = await supabase
        .from('restaurants')
        .insert([{
          name: restaurantName,
          slug: slug,
          owner_email: ownerEmail,
          contact_number: contactNumber,
          location: location,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          status: 'Active'
        }]);

      if (dbError) throw dbError;

      alert("Restaurant successfully created!");
      router.push('/directory');

    } catch (error: any) {
      console.error("Error creating restaurant:", error);
      alert(`Failed to create restaurant: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] p-8 md:p-12 font-sans text-[#0a1128] pb-24 flex flex-col items-center">
      <div className="w-full max-w-[800px]">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Add New Restaurant</h1>
          <p className="text-[#64748b]">Configure basic details to initialize a new tenant workspace.</p>
        </div>

        <form onSubmit={handleCreateAccount} className="space-y-8">
          
          {/* Card 1: Restaurant Name */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Restaurant Name</h2>
            <p className="text-[#64748b] text-sm mb-6">Enter the official name of the restaurant as it should appear in the menu.</p>
            <input 
              type="text" 
              required
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="e.g. The Coastal Catch" 
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#0a1128] outline-none transition-colors text-sm placeholder-gray-400"
            />
          </div>

          {/* Card 2: Visual Identity */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-8">Visual Identity</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Brand Logo Upload */}
              <div>
                <h3 className="text-sm font-bold mb-4">Brand Logo</h3>
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-200 border-dashed rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden relative">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-12 h-12 bg-[#f0f4f8] rounded-full flex items-center justify-center mb-4">
                        <UploadCloud className="w-6 h-6 text-[#64748b]" />
                      </div>
                      <p className="text-[15px] font-bold text-[#0a1128] mb-1">Upload Logo</p>
                      <p className="text-[13px] text-[#8792a2]">1:1 Ratio, Max 1MB</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
              </div>

              {/* Background Banner Upload */}
              <div>
                <h3 className="text-sm font-bold mb-4">Background Banner</h3>
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-200 border-dashed rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden relative">
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-12 h-12 bg-[#f0f4f8] rounded-full flex items-center justify-center mb-4">
                        <LucideImage className="w-6 h-6 text-[#64748b]" />
                      </div>
                      <p className="text-[15px] font-bold text-[#0a1128] mb-1">Upload Banner</p>
                      <p className="text-[13px] text-[#8792a2]">Landscape, Max 2MB</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                </label>
              </div>
            </div>
          </div>

          {/* Card 3: Contact & Location */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">Contact & Location</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold mb-2">Owner Email</label>
                <input 
                  type="email" 
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="owner@example.com" 
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#0a1128] outline-none transition-colors text-sm placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Contact Number</label>
                <input 
                  type="text" 
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000" 
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#0a1128] outline-none transition-colors text-sm placeholder-gray-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Location</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-[#8792a2]" />
                </div>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Search for a location" 
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#0a1128] outline-none transition-colors text-sm placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-6 mt-12">
            <button 
              type="button" 
              onClick={() => router.push('/directory')}
              className="text-[15px] font-bold text-[#0a1128] hover:text-[#64748b] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !restaurantName}
              className="px-6 py-3 bg-[#0a1128] text-white text-[15px] font-bold rounded-xl shadow-sm hover:bg-[#1a2342] transition-colors disabled:opacity-50 disabled:bg-[#8792a2]"
            >
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
