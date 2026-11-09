import React, { useState } from 'react';
import { X, Lock, Mail, User, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const { user, profile, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password, displayName.trim());
      }
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      const msg = err.message || 'Authentication failed. Please check your credentials.';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Invalid email or password.');
      } else if (msg.includes('email-already-in-use')) {
        setError('An account with this email already exists.');
      } else if (msg.includes('weak-password')) {
        setError('Password should be at least 6 characters.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err?.message || 'Google sign-in could not be completed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
    >
      <div
        className="relative w-full max-w-md bg-white text-[#111111] border border-[#E5E5E5] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4.5 bg-[#0A0A0A] text-white border-b border-[#0A0A0A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
              <User size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold tracking-wider uppercase text-white leading-none">
                {user ? 'Customer Account' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1">
                SM Studios 3D Printing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {user ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#F5F5F5] border border-[#E5E5E5] rounded-2xl space-y-2">
                <div className="text-xs text-[#666666]">Signed in as:</div>
                <div className="text-sm font-bold text-black">{user.displayName || 'Customer'}</div>
                <div className="text-xs text-[#555555] font-mono">{user.email}</div>
                <div className="pt-2">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black text-white">
                    Role: {profile?.role || 'Customer'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-bold uppercase tracking-wider text-xs border border-black text-black hover:bg-black hover:text-white transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs border border-[#D1D5DB] hover:bg-[#F5F5F5] text-[#111111] transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xs active:scale-98 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-[#E5E5E5]" />
                <span className="bg-white px-2.5 text-[10px] uppercase font-bold text-[#888888] tracking-widest absolute">
                  or with email
                </span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle size={14} className="shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#222222] uppercase mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm text-[#111111] placeholder:text-[#888888] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-[#222222] uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm text-[#111111] placeholder:text-[#888888] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#222222] uppercase mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm text-[#111111] placeholder:text-[#888888] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl font-bold uppercase tracking-wider text-xs bg-black text-white hover:bg-[#1A1A1A] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                >
                  {isLoading ? (
                    <Loader2 size={14} className="animate-spin text-white" />
                  ) : mode === 'login' ? (
                    'Sign In'
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode(mode === 'login' ? 'signup' : 'login');
                  }}
                  className="text-xs text-[#666666] hover:text-black underline cursor-pointer"
                >
                  {mode === 'login'
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </button>
              </div>

              <div className="text-[11px] text-center text-[#888888] pt-1">
                Optional: Guest checkout and order tracking remain fully supported without an account.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
