import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Zap, ShieldCheck, Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const { user, signIn, signInEmail, signUpEmail, loading } = useAuth();
  const navigate = useNavigate();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (user) return <Navigate to="/" />;

  const getErrorMessage = (err: any) => {
    const code = err.code || (err.message?.includes('code=') ? err.message.split('code=')[1].split(']')[0] : '');
    switch (code) {
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'unavailable':
        return 'Network error. Firestore is currently unreachable. Please check your internet connection.';
      default:
        if (err.message?.includes('network-request-failed')) 
          return 'Network request failed. Please check your connection.';
        return err.message || 'Authentication failed';
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await signIn();
      navigate('/');
    } catch (err: any) {
      setError(getErrorMessage(err));
      console.error("Login failed:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (isSignUp) {
        await signUpEmail(email, password, name);
      } else {
        await signInEmail(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left side: branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 items-center justify-center p-24 overflow-hidden relative">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full" style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, #059669 1px, transparent 0)',
            backgroundSize: '48px 48px' 
          }}></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-10 shadow-2xl shadow-emerald-900/50 rotate-3">
             <Zap className="text-white" size={28} fill="currentColor" />
          </div>
          <span className="text-emerald-400 font-display font-bold text-xs block mb-4 tracking-[0.3em] uppercase">Intelligence Engine</span>
          <h1 className="text-6xl font-display font-bold text-white leading-tight mb-8 tracking-tighter">
            Precision Recruitment <br /> <span className="text-emerald-500">Accelerated.</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm">
            Leverage advanced AI to analyze candidates and match talent to roles with unparalleled accuracy.
          </p>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute -bottom-24 -right-24 h-[500px] w-[500px] rounded-full bg-white/10 blur-[120px]"></div>
        <div className="absolute top-20 left-20 h-32 w-32 rounded-full bg-blue-400/20 blur-3xl"></div>
      </div>

      {/* Right side: Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm flex flex-col">
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mb-6 rotate-3 shadow-sm">
               <Zap className="text-emerald-600" size={28} fill="currentColor" />
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-2 tracking-tight">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="text-slate-500 text-center text-sm font-medium leading-relaxed">
              {isSignUp 
                ? 'Join our talent management platform and start automating your recruitment.' 
                : 'Sign in to manage your talent repository and automate technical screening.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0, mb: 0 }}
                  animate={{ opacity: 1, height: 'auto', mb: 16 }}
                  exit={{ opacity: 0, height: 0, mb: 0 }}
                  className="space-y-1.5"
                >
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 px-1">Full Name</label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 px-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Password</label>
                {!isSignUp && (
                  <button type="button" className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 hover:text-emerald-700">Forgot?</button>
                )}
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 text-white py-3.5 px-6 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all active:scale-[0.98] shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-50 px-4 text-slate-400 font-bold uppercase tracking-widest text-[9px]">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 py-3 px-6 rounded-xl hover:bg-slate-50 transition-all duration-200 active:scale-[0.98] shadow-sm font-bold text-slate-700 text-sm mb-8"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" referrerPolicy="no-referrer" />
            <span>Google</span>
          </button>

          <p className="text-center text-sm text-slate-500 font-medium">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-emerald-600 font-bold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold mt-12">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Secure Enterprise Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
