import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { UserProfile, DbStatusResponse } from '../types/auth';
import {
  X,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Database,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);

  // Fetch DB status when opened
  useEffect(() => {
    if (isOpen) {
      authService.getDatabaseStatus().then(setDbStatus).catch(() => {});
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Direct Sign In (No OTP required)
  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanMobile = mobileNumber.trim();
    const cleanEmail = email.trim();

    if (!cleanMobile || cleanMobile.length < 8) {
      setError('Please enter a valid mobile number (at least 8-10 digits).');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address (e.g. driver@smartcity.gov).');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await authService.login(cleanMobile, cleanEmail);
      if (res.user) {
        setSuccessMsg('Authentication successful! Profile and location data synchronized.');
        setTimeout(() => {
          onLoginSuccess(res.user!);
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Quick auto-fill sample credentials for convenience
  const handleFillDemoCredentials = () => {
    setMobileNumber('+91 98450 12345');
    setEmail('traffic.officer@smartcity.gov');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white border border-sky-100 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#FAF7F2] px-6 py-4 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-400 via-pink-400 to-rose-400 text-white shadow-md shadow-pink-200/60">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                User Authentication & Session
              </h2>
              <p className="text-[11px] text-slate-500">
                Direct Sign-In • Mobile Number & Email ID
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Database backend banner */}
        <div className="bg-sky-50/60 px-6 py-2.5 border-b border-sky-100 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-slate-600">
            <Database className="w-3.5 h-3.5 text-sky-600" />
            <span>Storage Target:</span>
            <code className="text-sky-800 font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-sky-200">
              mongodb://localhost:27017/smart_city_safety
            </code>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              dbStatus?.isMongoConnected
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-sky-50 text-sky-700 border border-sky-200'
            }`}
          >
            {dbStatus?.isMongoConnected ? '● MongoDB Live' : '● Storage Active'}
          </span>
        </div>

        {/* Body Content */}
        <div className="p-6 flex flex-col gap-4">
          {/* Quick Demo Pre-fill Pill */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-amber-200/60 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Need quick credentials?</span>
            </div>
            <button
              type="button"
              onClick={handleFillDemoCredentials}
              className="text-[11px] font-bold text-sky-700 hover:text-sky-900 underline cursor-pointer"
            >
              Fill Sample Mobile & Email
            </button>
          </div>

          {/* Feedback Toasts */}
          {error && (
            <div className="p-3 rounded-xl bg-pink-50 border border-pink-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Direct Login Form */}
          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-600" />
                Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="e.g. +91 98450 12345 or 9845012345"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-[#FFFDF9] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 font-mono transition"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Primary identifier for personal route history and risk logs.
              </span>
            </div>

            {/* Email ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-pink-600" />
                Email ID
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="e.g. driver@smartcity.gov or user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#FFFDF9] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 font-sans transition"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Connected to backend MongoDB for session history sync.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="mt-2 w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-sky-500 via-pink-400 to-rose-400 hover:from-sky-600 hover:to-rose-500 shadow-md shadow-pink-200/60 hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer hover:-translate-y-0.5 animate-shimmer"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing In & Connecting...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Sign In / Connect Session</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Modal Footer Note */}
        <div className="bg-[#FAF7F2] px-6 py-3 border-t border-amber-200/60 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Backend persistence enabled</span>
          <span className="font-mono text-slate-600 font-semibold">Database: smart_city_safety</span>
        </div>
      </div>
    </div>
  );
};
