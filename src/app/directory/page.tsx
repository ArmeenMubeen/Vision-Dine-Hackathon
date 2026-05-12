"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, MoreVertical, Pencil, Settings2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const mockRestaurants = [
  {
    id: 1,
    name: 'Khansaab',
    slug: 'khansaab-819',
    status: 'Active',
    createdAt: '4/1/2026',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop', // Placeholder restaurant image
  },
  {
    id: 2,
    name: 'Restaurant check 1',
    slug: 'restaurant-check-1-388',
    status: 'Active',
    createdAt: '3/25/2026',
    initial: 'R',
  },
  {
    id: 3,
    name: 'Rawr Lounge',
    slug: 'rawr-lounge-518',
    status: 'Active',
    createdAt: '2/2/2026',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=100&h=100&fit=crop', // Placeholder restaurant image
  }
];

export default function DirectoryPage() {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setRestaurants(data || []);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRestaurants();
  }, []);

  const toggleMenu = (id: number) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] p-8 md:p-12 font-sans text-[#1a1f36]">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0a1128] tracking-tight">Restaurants Directory</h1>
            <p className="text-[#64748b] mt-1 text-sm">Manage all client accounts</p>
          </div>
          
          <button 
            onClick={() => router.push('/restaurants/new')}
            className="flex items-center px-4 py-2.5 bg-[#0a1128] text-white text-sm font-medium rounded-lg hover:bg-[#1a2342] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Onboard New Client
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search by name, slug or ID..." 
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0a1128] focus:border-[#0a1128] sm:text-sm shadow-sm"
          />
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden pb-12">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-[#f8f9fc]">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wider">
                    Restaurant Name
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wider">
                    Slug (URL)
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50 relative">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                      Loading restaurants...
                    </td>
                  </tr>
                ) : restaurants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                      No restaurants found. Get started by onboarding a new client!
                    </td>
                  </tr>
                ) : restaurants.map((restaurant) => (
                  <tr 
                    key={restaurant.id} 
                    onClick={() => router.push(`/restaurants/${restaurant.id}`)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          {restaurant.logo_url ? (
                            <img className="h-10 w-10 rounded-full object-cover shadow-sm border border-gray-100" src={restaurant.logo_url} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold shadow-sm uppercase">
                              {restaurant.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-[#1a1f36]">{restaurant.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{restaurant.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-[#e6f4ea] text-[#137333]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#137333] mr-1.5"></span>
                        {restaurant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(restaurant.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                      <button 
                        onClick={() => toggleMenu(restaurant.id)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuId === restaurant.id && (
                        <div className="absolute right-8 top-10 mt-0 w-48 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] bg-white border border-gray-100 z-10 py-2">
                          <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors">
                            <Pencil className="w-4 h-4 mr-3 text-blue-600" />
                            Edit Restaurant
                          </button>
                          <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors border-b border-gray-50 pb-3 mb-1">
                            <Settings2 className="w-4 h-4 mr-3 text-purple-600" />
                            Menu Settings
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center transition-colors">
                            <Trash2 className="w-4 h-4 mr-3" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
