import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Mic, 
  Database, 
  Building,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { checkSupabaseConnection, SUPABASE_PROJECT_ID } from '../lib/supabase';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup';
  onReturnHome: () => void;
  onOpenAIAdvisor?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'signin',
  onReturnHome,
  onOpenAIAdvisor,
}) => {
  const { user, signIn, signUp, signInAsGuest, signOut } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [checkingBackend, setCheckingBackend] = useState(false);
  const [backendTestStatus, setBackendTestStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!email || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    if (mode === 'signup' && !fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setLoading(true);

    if (mode === 'signin') {
      const { error, success } = await signIn(email.trim(), password);
      setLoading(false);
      if (success) {
        setSuccessNotice('Signed in successfully! Your Supabase profile is now active.');
      } else {
        setErrorMessage(error?.message || 'Invalid email or password. Please check your credentials or try 1-click VIP access.');
      }
    } else {
      const { error, success, confirmationRequired } = await signUp(email.trim(), password, fullName.trim());
      setLoading(false);
      if (success) {
        if (confirmationRequired) {
          setSuccessNotice('Account created! Please check your email to confirm, or continue with 1-click VIP access right away.');
        } else {
          setSuccessNotice('VIP Account created and signed in successfully!');
        }
      } else {
        setErrorMessage(error?.message || 'Unable to create account. Please check your details and try again.');
      }
    }
  };

  const handleGuestLogin = () => {
    signInAsGuest('VIP Client');
    setSuccessNotice('Welcome! Instant VIP access activated.');
  };

  const handleTestBackend = async () => {
    setCheckingBackend(true);
    setBackendTestStatus(null);
    const res = await checkSupabaseConnection();
    setCheckingBackend(false);
    if (res.connected) {
      setBackendTestStatus(`Connection verified: ${res.message}`);
    } else {
      setBackendTestStatus(`Connection note: ${res.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#001730] text-white flex flex-col justify-between selection:bg-[#C5A059] selection:text-[#001730] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#002347] rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar / Navigation */}
      <header className="relative z-10 border-b border-[#C5A059]/20 bg-[#002347]/80 backdrop-blur-md py-4 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onReturnHome}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-[#E6C687] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Return to Nagpur Residences</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={onReturnHome}>
            <div className="w-8 h-8 rounded-lg bg-[#001730] border border-[#C5A059]/70 flex items-center justify-center text-[#E6C687] font-cinzel font-bold text-sm">
              AS
            </div>
            <div className="hidden sm:block">
              <span className="font-cinzel text-base font-bold tracking-widest text-white">
                AS <span className="text-[#C5A059]">REALTY</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden md:inline">Supabase:</span>
              <span>Connected</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Authentication Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-gradient-to-b from-[#002347] to-[#001730] border border-[#C5A059]/40 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
          {/* Top Gold Ribbon */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#C5A059] via-[#E6C687] to-[#C5A059]" />

          <div className="p-6 sm:p-8">
            {/* If user is already authenticated */}
            {user ? (
              <div className="text-center py-4 space-y-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#C5A059] to-[#E6C687] text-[#001730] flex items-center justify-center shadow-lg font-bold text-2xl">
                  {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                </div>

                <div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Signed In via Supabase</span>
                  </div>
                  <h2 className="text-2xl font-serif-luxury font-bold text-white">
                    {user.fullName || 'Valued VIP Client'}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 font-mono">{user.email}</p>
                </div>

                <div className="p-4 rounded-xl bg-[#001730] border border-white/10 text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Account ID:</span>
                    <span className="font-mono text-slate-400 truncate max-w-[170px]">{user.id}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Supabase Backend:</span>
                    <span className="text-emerald-400 font-semibold">{SUPABASE_PROJECT_ID}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>AI Voice Sessions:</span>
                    <span className="text-[#E6C687] font-semibold">Active & Synced</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {onOpenAIAdvisor && (
                    <button
                      onClick={() => {
                        onReturnHome();
                        setTimeout(() => onOpenAIAdvisor(), 150);
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#E6C687] text-[#001730] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer shadow-lg shadow-[#C5A059]/20"
                    >
                      <Mic className="w-4 h-4 text-[#001730]" />
                      <span>Start AI Voice Advisor in Hinglish</span>
                    </button>
                  )}

                  <button
                    onClick={onReturnHome}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#001730] hover:bg-white/10 border border-[#C5A059]/40 text-xs font-semibold text-white transition-all cursor-pointer"
                  >
                    Browse Nagpur Residences
                  </button>

                  <button
                    onClick={() => signOut()}
                    className="w-full py-2 px-4 rounded-xl text-red-300 hover:text-red-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header Title */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#E6C687] text-[11px] font-bold tracking-widest uppercase mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>VIP Client Portal</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-white">
                    {mode === 'signin' ? 'Sign In to AS Realty' : 'Create Your VIP Account'}
                  </h1>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {mode === 'signin'
                      ? 'Access real-time Hinglish AI Voice advisory, saved Nagpur residences, and direct site visits with Amit Shivpeth.'
                      : 'Join AS Realty for personalized property alerts, MahaRERA due diligence dossiers, and voice consultations.'}
                  </p>
                </div>

                {/* Clean 2-Way Tab Switcher */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-[#001730] rounded-xl border border-white/10 mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMessage(null);
                      setSuccessNotice(null);
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      mode === 'signin'
                        ? 'bg-gradient-to-r from-[#C5A059] to-[#E6C687] text-[#001730] font-bold shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMessage(null);
                      setSuccessNotice(null);
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      mode === 'signup'
                        ? 'bg-gradient-to-r from-[#C5A059] to-[#E6C687] text-[#001730] font-bold shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Notification Badges */}
                {errorMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-start gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successNotice && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{successNotice}</span>
                  </div>
                )}

                {/* Main Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C5A059]" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-[#001730] border border-white/15 focus:border-[#E6C687] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#E6C687] transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C5A059]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="client@example.com"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#001730] border border-white/15 focus:border-[#E6C687] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#E6C687] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-medium text-slate-300">
                        Password
                      </label>
                      {mode === 'signin' && (
                        <span className="text-[11px] text-[#E6C687] hover:underline cursor-pointer" onClick={() => setErrorMessage('Please sign in as VIP Guest or contact support to reset your password.')}>
                          Forgot?
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C5A059]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        minLength={6}
                        className="w-full pl-10 pr-10 py-2.5 bg-[#001730] border border-white/15 focus:border-[#E6C687] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#E6C687] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#E6C687] hover:from-[#B8924B] hover:to-[#D9B97A] text-[#001730] font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#C5A059]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Connecting to Supabase...</span>
                      </span>
                    ) : (
                      <>
                        <span>{mode === 'signin' ? 'Sign In to Portal' : 'Create VIP Account'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Clean Divider */}
                <div className="relative my-5 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <span className="relative px-3 bg-[#001b38] text-[11px] text-slate-400 uppercase tracking-wider">
                    or instant access
                  </span>
                </div>

                {/* Frictionless 1-Click VIP Guest Access */}
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#001730] hover:bg-[#002b52] border border-[#C5A059]/40 hover:border-[#E6C687] text-xs font-semibold text-[#E6C687] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                  <span>Continue as VIP Client (Instant 1-Click)</span>
                </button>
              </>
            )}

            {/* Supabase Connection Verification Footer */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Supabase Backend:</span>
                  <span className="font-mono text-emerald-300 font-semibold">{SUPABASE_PROJECT_ID}</span>
                </div>

                <button
                  type="button"
                  onClick={handleTestBackend}
                  disabled={checkingBackend}
                  className="text-[10px] text-[#E6C687] hover:underline flex items-center gap-1 cursor-pointer"
                  title="Check live Supabase backend connection"
                >
                  {checkingBackend ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <span>Test Ping</span>
                  )}
                </button>
              </div>

              {backendTestStatus && (
                <div className="mt-2 p-2 rounded-lg bg-white/5 text-[10px] text-slate-300 font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{backendTestStatus}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Assurance */}
      <footer className="relative z-10 border-t border-[#C5A059]/20 py-4 text-center text-xs text-slate-400">
        <p>AS Realty • Amit Shivpeth • Executive Luxury Real Estate Nagpur</p>
      </footer>
    </div>
  );
};
