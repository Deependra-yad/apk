"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await axios.post(endpoint, { username, password });
      
      setAuth(res.data.user, res.data.token);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="w-full min-h-[100dvh] flex items-center justify-center p-4 bg-liquid-dark overflow-y-auto relative selection:bg-liquid-accent/30">
      {/* Ambient background */}
      <div className="absolute w-[600px] h-[600px] bg-liquid-accent/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute top-10 right-10 w-[400px] h-[400px] bg-liquid-secondary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-md p-6 sm:p-8 bg-liquid-base/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 my-4"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 mx-auto bg-gradient-to-tr from-liquid-accent to-liquid-secondary rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,210,255,0.4)] mb-6 gooey-container relative"
          >
             <div className="absolute inset-1 bg-liquid-base rounded-full"></div>
             <div className="relative z-10 w-8 h-8 bg-liquid-accent rounded-full animate-bounce" style={{ animationDuration: '2s' }}></div>
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Liquid Chat</h1>
          <p className="text-gray-400 mt-2">{isLogin ? 'Welcome back, sign in to continue' : 'Create an account to get started'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
              {error}
            </motion.div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <div className="h-12 bg-black/40 rounded-xl border border-white/5 focus-within:border-liquid-accent/50 transition-colors flex items-center px-4">
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-white placeholder-gray-600 text-base sm:text-sm"
                placeholder="liquid_user"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="h-12 bg-black/40 rounded-xl border border-white/5 focus-within:border-liquid-accent/50 transition-colors flex items-center px-4">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-white placeholder-gray-600 text-base sm:text-sm"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-liquid-accent to-liquid-secondary rounded-xl text-white font-semibold shadow-[0_0_20px_rgba(0,210,255,0.3)] hover:shadow-[0_0_30px_rgba(0,210,255,0.5)] transition-all"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-liquid-accent hover:text-liquid-secondary transition-colors font-medium outline-none"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

