import React, { useState, useEffect } from 'react';
import {
  Lock, Eye, EyeOff, User, ArrowRight,
  AlertTriangle, CheckCircle2, Building2,
  Shield, X, HelpCircle, Sparkles, Hotel
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authService, LoginResult } from '../services/authService';
import { pmsService } from '../services/pmsService';
import { SystemSetting } from '../types/pms';

interface LoginViewProps {
  onLoginSuccess: (redirectRoute?: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [settings, setSettings] = useState<SystemSetting>(() => {
    try {
      return pmsService.getSettings() || ({} as SystemSetting);
    } catch {
      return {} as SystemSetting;
    }
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockoutTimer, setLockoutTimer] = useState<number | null>(null);
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Subscribe to PMS settings dynamically so updating property name or logo in Settings immediately updates here
  useEffect(() => {
    try {
      return pmsService.subscribe((db) => {
        if (db && db.settings) {
          setSettings({ ...db.settings });
        }
      });
    } catch {
      return () => {};
    }
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockoutTimer) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutTimer - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutTimer(null);
        setErrorMessage(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter your staff ID or email and your confidential password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result: LoginResult = await authService.login(identifier, password, rememberMe);
      setLoading(false);

      if (result.success) {
        setSuccessAnimation(true);
        setTimeout(() => {
          onLoginSuccess(result.redirectRoute || 'dashboard');
        }, 500);
      } else {
        setErrorMessage(result.message || 'Invalid credentials. Please verify your staff ID and password.');
        if (result.lockedUntil) {
          setLockoutTimer(result.lockedUntil);
        }
      }
    } catch (err: any) {
      setLoading(false);
      console.error('Login caught error:', err);
      setErrorMessage(err?.message ? `Authentication error: ${err.message}` : 'A network or authentication error occurred. Please try again.');
    }
  };

  const remainingSeconds = lockoutTimer ? Math.max(0, Math.ceil((lockoutTimer - Date.now()) / 1000)) : 0;
  const propertyName = settings?.resortName || 'Hotel & Resort Property';
  const propertyInitial = (propertyName && propertyName.length > 0) ? propertyName.charAt(0).toUpperCase() : 'H';

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#080D1A] text-slate-100 flex flex-col justify-between font-sans relative overflow-x-hidden overflow-y-auto">
      
      {/* Dynamic Animated Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep ambient radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-gradient-to-tr from-amber-600/10 via-blue-600/10 to-indigo-900/15 rounded-full blur-[140px] pointer-events-none" />

        {/* Floating Orb 1: Golden Amber */}
        <motion.div
          animate={{
            x: [0, 60, -40, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.15, 0.95, 1],
            opacity: [0.18, 0.32, 0.2, 0.18]
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-amber-500/25 to-yellow-600/10 blur-[90px]"
        />

        {/* Floating Orb 2: Royal Sapphire */}
        <motion.div
          animate={{
            x: [0, -70, 50, 0],
            y: [0, 60, -40, 0],
            scale: [1, 1.2, 0.9, 1],
            opacity: [0.22, 0.38, 0.24, 0.22]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] rounded-full bg-gradient-to-tr from-blue-700/25 via-indigo-600/20 to-cyan-500/10 blur-[110px]"
        />

        {/* Floating Orb 3: Center Ambient Shimmer */}
        <motion.div
          animate={{
            scale: [0.9, 1.1, 0.95, 0.9],
            opacity: [0.15, 0.28, 0.15]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-amber-400/10 blur-[100px]"
        />

        {/* Subtle Luxury Geometric Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Top Header Bar: Primary Owner Product Brand + Dynamic Licensed Property */}
      <header
        className="relative z-20 w-full border-b border-slate-800/80 bg-[#0B1120]/90 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4"
      >
        {/* Left: Primary Software Brand (Owner's Product: LESync PMS by LE Innova Automations) */}
        <div className="flex items-center space-x-3.5">
          <div className="relative group">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-[#0A101D] flex items-center justify-center font-mono font-black text-amber-400 text-sm tracking-tighter">
                LE
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base text-white tracking-tight font-mono">
                LESync <span className="text-amber-400">PMS</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-400" />
                Enterprise Platform
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              LE Innova Automations
            </p>
          </div>
        </div>

        {/* Right: Dynamic Licensed Property (Changes whenever software is sold / rebranded) */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-right">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={propertyName}
                className="w-7 h-7 object-contain rounded bg-white/10 p-0.5 border border-slate-700/60 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                {propertyInitial}
              </div>
            )}
            <div className="text-left hidden sm:block max-w-[200px] truncate">
              <div className="text-xs font-bold text-white truncate leading-tight">
                {propertyName}
              </div>
              <div className="text-[10px] text-slate-400 truncate leading-none mt-0.5">
                {settings?.address?.split(',')[0] || 'Licensed Property'}
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Staff Portal</span>
          </div>
        </div>
      </header>

      {/* Main Centered Login Section with Fluid Entrance Animation */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-8">
        <div
          className="w-full max-w-md transition-all duration-300"
        >
          {/* Main Card Container with Subtle Gradient Ring */}
          <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-slate-700/60 via-slate-800/40 to-slate-900/80 shadow-2xl shadow-black/80">
            <div className="bg-[#0D1527]/95 backdrop-blur-2xl rounded-3xl p-7 sm:p-9 relative overflow-hidden">
              
              {/* Card Top Glow Accent */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

              {/* Dynamic Property Identity Banner */}
              <div className="text-center mb-6 space-y-2.5">
                {/* Property Logo or Luxury Crest */}
                <div className="relative inline-flex items-center justify-center mb-1">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-3 rounded-full bg-gradient-to-r from-amber-500/20 via-blue-500/20 to-amber-500/20 blur-md"
                  />
                  
                  {settings?.logoUrl ? (
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="relative w-16 h-16 rounded-2xl bg-white/10 p-1.5 border border-slate-700/80 flex items-center justify-center overflow-hidden shadow-xl"
                    >
                      <img
                        src={settings.logoUrl}
                        alt={propertyName}
                        className="max-h-full max-w-full object-contain"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 p-0.5 shadow-xl shadow-amber-900/40"
                    >
                      <div className="w-full h-full rounded-[14px] bg-[#0A101F] flex flex-col items-center justify-center">
                        <Building2 className="w-7 h-7 text-amber-400" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-amber-300/90 mt-0.5 font-mono">
                          {propertyInitial}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Primary Software Title & Connected Property */}
                <div>
                  <div className="flex items-center justify-center space-x-1.5">
                    <span className="text-xs uppercase tracking-widest text-amber-400 font-mono font-bold">
                      LESync PMS
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      LE Innova Automations
                    </span>
                  </div>
                  
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                    Staff Authentication
                  </h1>

                  {/* Dynamic Property Name */}
                  <p className="text-xs text-slate-300 font-semibold max-w-xs mx-auto mt-1 leading-relaxed truncate" title={propertyName}>
                    {propertyName}
                  </p>
                </div>

                <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2" />
                  Front Office • F&amp;B • Accounts • Management
                </div>
              </div>

              {/* Dynamic Error / Lockout Banner */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="mb-5 bg-red-950/70 border border-red-800/80 p-3.5 rounded-2xl text-red-200 text-xs flex items-start space-x-2.5 overflow-hidden"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-red-300">Authentication Failed</div>
                      <div className="text-[11px] text-red-300/90 mt-0.5 leading-relaxed">{errorMessage}</div>
                      {lockoutTimer && remainingSeconds > 0 && (
                        <div className="font-mono text-amber-400 font-bold mt-1.5 text-[11px] bg-red-900/40 px-2 py-1 rounded-lg inline-block border border-red-800/50">
                          Workstation temporarily locked: {remainingSeconds}s remaining
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Success State Authorization Animation */}
                {successAnimation && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-5 bg-emerald-950/80 border border-emerald-600/80 p-4 rounded-2xl text-emerald-200 text-xs flex items-center space-x-3 shadow-lg shadow-emerald-950/60"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
                    </div>
                    <div>
                      <div className="font-bold text-emerald-300 text-xs">Credentials Verified</div>
                      <div className="text-[11px] text-emerald-400/90 mt-0.5">Initializing {propertyName} workstation...</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Staff ID or Corporate Email
                  </label>
                  <div className="relative group">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                    <input
                      type="text"
                      value={identifier}
                      autoComplete="username"
                      disabled={loading || !!lockoutTimer || successAnimation}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="Enter staff ID or corporate email"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Confidential Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer"
                    >
                      Need help?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      autoComplete="current-password"
                      disabled={loading || !!lockoutTimer || successAnimation}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your confidential password"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all disabled:opacity-50 font-mono tracking-tight"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer p-0.5"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-500" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-400 hover:text-slate-300 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-amber-500"
                    />
                    <span>Remember this workstation</span>
                  </label>
                </div>

                {/* Animated Submit Button */}
                <motion.button
                  whileHover={{ scale: loading || !!lockoutTimer || successAnimation ? 1 : 1.01 }}
                  whileTap={{ scale: loading || !!lockoutTimer || successAnimation ? 1 : 0.99 }}
                  type="submit"
                  disabled={loading || !!lockoutTimer || successAnimation}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:via-amber-500 hover:to-amber-600 active:from-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-lg shadow-amber-900/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 border border-amber-400/30"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2 text-slate-950 font-bold">
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In to Operations</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Institutional Compliance Notice */}
              <div className="mt-7 pt-5 border-t border-slate-800/80 text-center space-y-1.5">
                <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium text-slate-300">Restricted Access • Authorized Staff Only</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Encrypted Session (TLS 1.3) • All operational transactions are logged &amp; audited.
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer Bar: Platform Owner & Licensed Property */}
      <footer
        className="relative z-20 w-full border-t border-slate-800/80 bg-[#0B1120]/90 backdrop-blur-md px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2"
      >
        <div>
          <span>LESync PMS &amp; ERP Platform • &copy; {new Date().getFullYear()} LE Innova Automations. All rights reserved.</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-400">
          <span className="text-amber-400 font-medium">Licensed to: {propertyName}</span>
          <span>•</span>
          <span>Support: {settings?.phone || settings?.email || 'support@lesyncpms.com'}</span>
        </div>
      </footer>

      {/* Help / Password Recovery Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0F172A] border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2 font-bold text-sm text-amber-400">
                  <HelpCircle className="w-4.5 h-4.5 text-amber-400" />
                  <span>Staff Credential Support</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p>
                  To reset your operational password or unlock your account for <span className="text-white font-semibold">{propertyName}</span>, please contact your local IT Operations Department or System Administrator:
                </p>
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] space-y-1.5">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    {propertyName} IT Operations:
                  </div>
                  <div className="text-slate-400">PBX / Phone: <span className="font-mono text-amber-400 font-semibold">{settings?.phone || 'Extension 4004 / Reception'}</span></div>
                  <div className="text-slate-400">Official Email: <span className="font-mono text-slate-200">{settings?.email || 'it@property.com'}</span></div>
                  {settings?.address && (
                    <div className="text-slate-400">Location: <span className="text-slate-300">{settings.address}</span></div>
                  )}
                  <div className="text-slate-500 pt-1 border-t border-slate-800">
                    Platform Vendor: LE Innova Automations (LESync PMS)
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Staff credentials are strictly confidential. Never share or display credentials on open screens.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-amber-950/40"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

