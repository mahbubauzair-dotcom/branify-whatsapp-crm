import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, MessageSquare, Lock, Mail, User as UserIcon, ArrowRight, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { BRANIFY_DEFAULTS } from '../../lib/supabase';

interface AuthScreenProps {
  onOpenPrivacyPolicy?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onOpenPrivacyPolicy }) => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Account created successfully! If email confirmation is enabled, check your inbox, or sign in.');
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error.message);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/20 mb-4 ring-2 ring-amber-500/40 bg-black">
            <img
              src="/branify-logo.jpg"
              alt="Branify Official Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>BRANIFY</span>
            <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
              WhatsApp CRM
            </span>
          </h1>
          <p className="text-xs text-amber-400/90 font-medium tracking-wide mt-1">
            BUILD. BRAND. GROW.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Official Owner Portal for {BRANIFY_DEFAULTS.username}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {isSignUp ? 'Initialize Owner Account' : 'Owner Sign In'}
              </h2>
              <p className="text-xs text-slate-400">
                {isSignUp ? 'Set up the primary administrator for Branify CRM' : 'Access your single-owner CRM workspace'}
              </p>
            </div>
            <div className="p-2 bg-indigo-950/60 rounded-lg text-indigo-400 border border-indigo-800/40">
              <Shield className="w-5 h-5" />
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-950/50 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-950/50 border border-emerald-800/50 rounded-xl text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Owner Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Owner Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@branify.store"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Owner Account' : 'Sign In to Branify'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              {isSignUp
                ? 'Already have an owner account? Sign In'
                : 'Need to initialize first owner account? Sign Up'}
            </button>
          </div>
        </div>

        {/* Security Notice Footer */}
        <div className="mt-8 text-center text-xs text-slate-500 space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Single-Owner Secure Instance</span>
          </div>
          <p>Protected by Supabase Auth & Row Level Security</p>
          
          <div className="pt-2 flex items-center justify-center gap-3 text-[11px] text-slate-500">
            <a
              href="/privacy-policy"
              onClick={(e) => {
                if (onOpenPrivacyPolicy) {
                  e.preventDefault();
                  onOpenPrivacyPolicy();
                }
              }}
              className="text-amber-400/90 hover:text-amber-300 transition-colors font-medium cursor-pointer"
            >
              Privacy Policy
            </a>
            <span>•</span>
            <a
              href={BRANIFY_DEFAULTS.website}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              branify.store
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
