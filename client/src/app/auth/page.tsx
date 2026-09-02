'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ShieldCheck, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = "543385888390-9gjodv3m7ah41mbtb37p0v7nnbs4iiin.apps.googleusercontent.com";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [view, setView] = useState<'login' | 'signup' | 'forgot_password' | 'verify_otp' | 'reset_password'>('login');
  const [pendingAction, setPendingAction] = useState<'login' | 'signup' | 'reset_password'>('login');
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) router.push('/');
    const urlError = searchParams.get('error');
    if (urlError) setError(urlError);
  }, [router, searchParams]);

  const requestOtp = async (type: 'login' | 'signup' | 'reset_password') => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/otp/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setPendingAction(type);
      setView('verify_otp');
      setMessage(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password) return setError('All fields required');
    requestOtp('signup');
  };

  const handleLoginRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError('Email and password required');
    requestOtp('login');
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email first');
    requestOtp('reset_password');
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/otp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code: otp, 
          type: pendingAction,
          username: pendingAction === 'signup' ? username : undefined,
          password: pendingAction === 'signup' ? password : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');

      if (pendingAction === 'reset_password') {
        setResetToken(data.resetToken);
        setView('reset_password');
        setMessage('OTP Verified. Please enter your new password.');
        setOtp('');
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/otp/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword: password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      
      setView('login');
      setMessage('Password reset successful! You can now login.');
      setPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="w-full max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-liquid-base/80 backdrop-blur-2xl p-8 rounded-[2rem] border border-foreground/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        >
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-liquid-accent to-liquid-secondary rounded-full flex items-center justify-center p-[2px] mb-6 shadow-[0_0_30px_rgba(0,210,255,0.3)]">
              <div className="w-full h-full bg-liquid-base rounded-full flex items-center justify-center">
                <ShieldCheck size={36} className="text-liquid-accent" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-2">Liquid Auth</h1>
            <p className="text-foreground/60 text-sm">Secure Real-time Authentication</p>
          </div>

          <AnimatePresence mode="wait">
            {/* ALERTS */}
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-sm">
                <AlertCircle size={18} className="shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
            {message && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-sm">
                <CheckCircle2 size={18} className="shrink-0" />
                <p>{message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORM VIEWS */}
          {view === 'login' && (
            <form onSubmit={handleLoginRequest} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider ml-1 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-background/50 border border-foreground/10 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:border-liquid-accent/50 outline-none transition-colors text-foreground placeholder:text-foreground/30" placeholder="you@liquidchat.online" />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-liquid-accent to-liquid-secondary text-liquid-dark font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                {isLoading ? 'Sending OTP...' : 'Login with OTP'} <ArrowRight size={18} />
              </button>
              <div className="flex items-center justify-between mt-4 text-sm text-foreground/60">
                <button type="button" onClick={() => setView('forgot_password')} className="hover:text-liquid-accent transition-colors">Forgot password?</button>
                <button type="button" onClick={() => setView('signup')} className="hover:text-liquid-accent transition-colors font-semibold">Create account</button>
              </div>
            </form>
          )}

          {view === 'signup' && (
            <form onSubmit={handleSignupRequest} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider ml-1 mb-1.5 block">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                  <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-background/50 border border-foreground/10 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:border-liquid-accent/50 outline-none transition-colors text-foreground" placeholder="johndoe" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider ml-1 mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-background/50 border border-foreground/10 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:border-liquid-accent/50 outline-none transition-colors text-foreground" placeholder="john@liquidchat.online" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider ml-1 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-background/50 border border-foreground/10 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:border-liquid-accent/50 outline-none transition-colors text-foreground" placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-liquid-accent to-liquid-secondary text-liquid-dark font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-2">
                {isLoading ? 'Sending...' : 'Create Account'} <ArrowRight size={18} />
              </button>
              <div className="text-center mt-4">
                <button type="button" onClick={() => setView('login')} className="text-sm text-foreground/60 hover:text-liquid-accent transition-colors">Already have an account? Sign In</button>
              </div>
            </form>
          )}

          {view === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider ml-1 mb-1.5 block">Account Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-background/50 border border-foreground/10 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:border-liquid-accent/50 outline-none transition-colors" placeholder="email@liquidchat.online" />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                {isLoading ? 'Sending...' : 'Send Reset Code'} <KeyRound size={18} />
              </button>
              <div className="text-center mt-4">
                <button type="button" onClick={() => setView('login')} className="text-sm text-foreground/60 hover:text-liquid-accent transition-colors">Back to Login</button>
              </div>
            </form>
          )}

          {view === 'verify_otp' && (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider ml-1 mb-1.5 block text-center">Enter 6-Digit OTP</label>
                <input type="text" required value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} className="w-full bg-background/50 border border-foreground/10 rounded-xl py-4 px-4 text-2xl font-bold tracking-[0.5em] text-center focus:border-liquid-accent/50 outline-none transition-colors text-foreground" placeholder="••••••" />
              </div>
              <button type="submit" disabled={isLoading || otp.length !== 6} className="w-full bg-gradient-to-r from-liquid-accent to-liquid-secondary text-liquid-dark font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? 'Verifying...' : 'Verify OTP'} <CheckCircle2 size={18} />
              </button>
              <div className="text-center mt-4 text-sm text-foreground/60">
                Didn't receive it? <button type="button" onClick={() => requestOtp(pendingAction)} className="text-liquid-accent hover:underline">Resend</button>
              </div>
              <div className="text-center mt-2">
                <button type="button" onClick={() => setView('login')} className="text-xs text-foreground/40 hover:text-foreground">Cancel</button>
              </div>
            </form>
          )}

          {view === 'reset_password' && (
            <form onSubmit={resetPassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider ml-1 mb-1.5 block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-background/50 border border-foreground/10 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:border-liquid-accent/50 outline-none transition-colors" placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" disabled={isLoading || !password} className="w-full bg-gradient-to-r from-emerald-400 to-emerald-500 text-liquid-dark font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                {isLoading ? 'Saving...' : 'Update Password'} <CheckCircle2 size={18} />
              </button>
            </form>
          )}

          {/* Google OAuth (Only show on main views) */}
          {(view === 'login' || view === 'signup') && (
            <>
              <div className="flex items-center gap-4 my-6 opacity-60">
                <div className="h-px bg-foreground/20 flex-1" />
                <span className="text-xs font-medium uppercase tracking-wider">Or</span>
                <div className="h-px bg-foreground/20 flex-1" />
              </div>
              <a 
                href="https://accounts.google.com/o/oauth2/v2/auth?client_id=543385888390-9gjodv3m7ah41mbtb37p0v7nnbs4iiin.apps.googleusercontent.com&redirect_uri=https://apk-flame.vercel.app/auth/callback&response_type=token&scope=email%20profile"
                className="w-full bg-white text-black py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Continue with Google
              </a>
            </>
          )}

        </motion.div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-liquid-dark flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-liquid-accent/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-liquid-secondary/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />
      
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
