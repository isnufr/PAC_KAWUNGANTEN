"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/');
      } else {
        setError(data.error || 'Login gagal!');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-red-600 via-red-700 to-red-900 px-4">
        {/* Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 md:w-96 md:h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 md:w-96 md:h-96 bg-red-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

        <div className="bg-white/95 backdrop-blur-xl p-6 md:p-10 rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.3)] border border-red-200 w-full max-w-md transform transition-all relative z-10">
            <div className="text-center mb-6 md:mb-8">
                <div className="mx-auto h-20 w-20 md:h-24 md:w-24 bg-gradient-to-br from-white to-red-50 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 mb-4 md:mb-5 transform hover:scale-105 transition duration-300 border-4 border-white p-2">
                    <img src="/logo.png" className="w-full h-full object-contain" alt="PAC Logo" />
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-red-800 tracking-tight">LOGIN APLIKASI</h2>
                <p className="text-red-400 text-[10px] md:text-xs font-bold tracking-widest mt-1.5 uppercase">PDIP PAC KAWUNGANTEN</p>
            </div>
            
            {error && (
                <div className="mb-4 p-3.5 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 text-center font-bold tracking-wide">
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 md:space-y-5">
                <div>
                    <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Username</label>
                    <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <span className="material-icons text-red-300 text-sm">person</span>
                        </div>
                        <input type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full py-3 pr-3 pl-10 md:py-3.5 md:pr-3.5 md:pl-10 border border-red-100 rounded-xl focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition bg-white text-red-700 font-medium text-sm" 
                            placeholder="Masukkan username" />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Password</label>
                    <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <span className="material-icons text-red-300 text-sm">lock</span>
                        </div>
                        <input type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full py-3 pr-3 pl-10 md:py-3.5 md:pr-3.5 md:pl-10 border border-red-100 rounded-xl focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition bg-white text-red-700 font-medium text-sm" 
                            placeholder="Masukkan kata sandi" />
                    </div>
                </div>
                <button type="submit" disabled={isLoading}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-3.5 md:p-4 rounded-xl font-bold shadow-xl shadow-red-200 transition-all flex justify-center items-center mt-4 text-sm active:scale-95 disabled:opacity-70">
                    {isLoading ? 'Memproses...' : 'Masuk ke Sistem'}
                </button>
            </form>
        </div>
    </div>
  );
}
