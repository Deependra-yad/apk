"use client";

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = "543385888390-9gjodv3m7ah41mbtb37p0v7nnbs4iiin.apps.googleusercontent.com";

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const searchParams = useSearchParams();
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) setError(urlError);
  }, [searchParams]);
  
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await axios.post('/api/auth/google', {
        credential: credentialResponse.credential
      });
      setAuth(res.data.user, res.data.token);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google login failed');
    }
  };

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
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="w-full min-h-[100dvh] flex items-center justify-center p-4 bg-liquid-dark overflow-y-auto relative selection:bg-liquid-accent/30">
        {/* Ambient background */}
        <div className="absolute w-[600px] h-[600px] bg-liquid-accent/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute top-10 right-10 w-[400px] h-[400px] bg-liquid-secondary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-md p-6 sm:p-8 bg-liquid-base/60 backdrop-blur-2xl rounded-3xl border border-foreground/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 my-4"
        >
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 bg-gradient-to-tr from-liquid-accent to-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg rotate-12"
            >
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center -rotate-12">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              </div>
            </motion.div>
            <h1 className="text-3xl font-black text-foreground mb-2">Liquid Chat</h1>
            <p className="text-foreground/60 text-sm">
              {isLogin ? 'Sign in to sync your messages' : 'Create an account to start chatting'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider ml-1 mb-1.5 block">Username</label>
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-background/40 border border-foreground/10 rounded-xl px-4 py-3.5 text-foreground outline-none focus:border-liquid-accent/50 focus:ring-1 focus:ring-liquid-accent/50 transition-all placeholder-gray-600"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider ml-1 mb-1.5 block">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background/40 border border-foreground/10 rounded-xl px-4 py-3.5 text-foreground outline-none focus:border-liquid-accent/50 focus:ring-1 focus:ring-liquid-accent/50 transition-all placeholder-gray-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-gradient-to-r from-liquid-accent to-blue-500 text-foreground font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(0,210,255,0.3)] hover:shadow-[0_0_25px_rgba(0,210,255,0.5)] transition-all mt-4"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </motion.button>
          </form>

          <div className="mt-6 flex items-center justify-center">
            <div className="h-px bg-foreground/10 w-full" />
            <span className="text-xs text-foreground/60 px-4 whitespace-nowrap">OR CONTINUE WITH</span>
            <div className="h-px bg-foreground/10 w-full" />
          </div>

          <div className="mt-6 flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              useOneTap
              theme="filled_black"
              shape="pill"
              text={isLogin ? "signin_with" : "signup_with"}
              ux_mode="redirect"
              login_uri="https://apk-flame.vercel.app/api/auth/google-redirect"
            />
          </div>

          <div className="mt-8 text-center">
            <p className="text-foreground/60 text-sm">
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
    </GoogleOAuthProvider>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-liquid-accent border-t-transparent rounded-full animate-spin"></div></div>}>
      <AuthForm />
    </Suspense>
  );
}
