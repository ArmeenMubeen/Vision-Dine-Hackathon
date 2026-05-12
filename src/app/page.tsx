"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/directory');
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f8f9fc] to-[#eef1f6] p-4 font-sans text-[#1a1f36]">
      
      {/* Main Login Card */}
      <div className="bg-white w-full max-w-[420px] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 border border-gray-100 flex flex-col items-center">
        
        {/* Logo/Avatar */}
        <div className="w-14 h-14 bg-[#0a1128] rounded-[14px] flex items-center justify-center mb-6">
          <span className="text-white font-bold text-lg tracking-wide">SA</span>
        </div>

        {/* Titles */}
        <h1 className="text-2xl font-bold text-[#0a1128] mb-1">Super Admin</h1>
        <p className="text-[#8792a2] text-sm mb-10">managed access</p>

        {/* Form */}
        <form className="w-full space-y-5">
          {/* Email Field */}
          <div className="space-y-2 text-left">
            <label className="block text-sm font-semibold text-[#3c4257]">Email Address</label>
            <input 
              type="email" 
              placeholder="admin@webar.com" 
              className="w-full px-4 py-3 rounded-lg border border-[#e5e7eb] focus:border-[#0a1128] focus:ring-1 focus:ring-[#0a1128] outline-none transition-colors text-sm text-[#3c4257] placeholder:text-[#a1a1aa]"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2 text-left">
            <label className="block text-sm font-semibold text-[#3c4257]">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full px-4 py-3 rounded-lg border border-[#e5e7eb] focus:border-[#0a1128] focus:ring-1 focus:ring-[#0a1128] outline-none transition-colors text-sm text-[#3c4257] placeholder:text-[#a1a1aa] tracking-widest"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button 
              type="button" 
              onClick={handleLogin}
              className="w-full py-3.5 bg-[#0a1128] text-white font-medium rounded-lg hover:bg-[#1a2342] transition-colors shadow-sm"
            >
              Access Control Room
            </button>
          </div>
        </form>

        {/* Sign Up Link */}
        <div className="mt-8 text-sm text-[#3c4257]">
          Need an account? <a href="#" className="font-semibold text-[#0a1128] hover:underline">Sign Up</a>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-100 my-8"></div>

        {/* Footer Note */}
        <div className="text-xs text-[#8792a2]">
          Restricted access. Authorized personnel only.
        </div>
      </div>

    </div>
  );
}
