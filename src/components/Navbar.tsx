import React from 'react';
import {
  Camera,
  Sparkles,
  History,
  Crown,
  Globe,
  User,
  LogOut,
  Shield,
  CreditCard,
  Gift,
  Clock,
  Box,
} from 'lucide-react';
import { LanguageCode } from '../types';
import { getDailyScanCount, getDailyLimit } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { MONTHLY_PACKAGE_PRICE_BDT } from '../services/subscriptionService';

interface NavbarProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onOpenHistory: () => void;
  onOpenPricing: () => void;
  onOpenPayment: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenUserDashboard: () => void;
  onOpen3DView: () => void;
  is3DActive: boolean;
  onNewScan: () => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLanguage,
  onLanguageChange,
  onOpenHistory,
  onOpenPricing,
  onOpenPayment,
  onOpenAuth,
  onOpenAdmin,
  onOpenUserDashboard,
  onOpen3DView,
  is3DActive,
  onNewScan,
  historyCount,
}) => {
  const dailyCount = getDailyScanCount();
  const dailyLimit = getDailyLimit();
  const { currentUser, userProfile, isAdmin, isSubscribed, isTrialActive, isTrialExpired, trialDaysRemaining, logout } = useAuth();

  const languages: { code: LanguageCode; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'bn', label: 'বাংলা (Bangla)', flag: '🇧🇩' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={onNewScan}
          className="flex items-center gap-3 group text-left transition-all hover:opacity-95 cursor-pointer"
          title="Return to Camera Scanner"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-sans">
                LifeLens<span className="text-cyan-400">.ai</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
                Android App v1.0
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400 font-medium leading-none">
              Scan It. Understand It. Make Better Decisions.
            </p>
          </div>
        </button>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Super Admin Dashboard Button (Only for Admin) */}
          {isAdmin ? (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
              title="Super Admin Dashboard (sneloy@gmail.com)"
            >
              <Shield className="w-3.5 h-3.5 text-slate-950" />
              <span>Admin Panel</span>
            </button>
          ) : (currentUser || userProfile) ? (
            <button
              onClick={onOpenUserDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
              title="Open User Dashboard"
            >
              <User className="w-3.5 h-3.5" />
              <span>My Dashboard</span>
            </button>
          ) : null}

          {/* Language Selector Dropdown */}
          <div className="relative flex items-center">
            <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
              <Globe className="w-3.5 h-3.5 text-cyan-400 mr-1.5 shrink-0" />
              <select
                value={currentLanguage}
                onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
                aria-label="Select language"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Trial / Subscription Status Badge */}
          {isTrialActive ? (
            <button
              onClick={onOpenUserDashboard}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-950/80 to-amber-900/40 border border-amber-500/60 text-xs text-amber-300 font-bold transition-colors cursor-pointer"
              title="7 Days Free Trial Active"
            >
              <Gift className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>7d Trial: {trialDaysRemaining}d left</span>
            </button>
          ) : isTrialExpired ? (
            <button
              onClick={onOpenPayment}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-xs text-rose-300 font-bold transition-colors cursor-pointer"
              title="7-Day Free Trial Expired - Upgrade to Pro"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Trial Expired</span>
            </button>
          ) : isSubscribed ? (
            <button
              onClick={onOpenUserDashboard}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-300 font-bold transition-colors cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Pro Member</span>
            </button>
          ) : (
            <button
              onClick={onOpenPayment}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs transition-colors cursor-pointer"
              title={`Monthly Package: BDT ${MONTHLY_PACKAGE_PRICE_BDT} taka`}
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-slate-300 font-medium">
                Free: <span className="text-cyan-300 font-semibold">{dailyCount}/{dailyLimit}</span>
              </span>
              <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800">
                7d Trial
              </span>
            </button>
          )}

          {/* User Account / Android App Login Trigger */}
          {currentUser || userProfile ? (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1">
              <button
                onClick={onOpenUserDashboard}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer text-left"
                title="View User Dashboard"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {(userProfile?.username || currentUser?.email || userProfile?.email || 'U')[0].toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-slate-200 hidden md:inline max-w-[110px] truncate">
                  {userProfile?.username || currentUser?.email || userProfile?.email}
                </span>
              </button>
              <button
                onClick={logout}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white border border-cyan-400/30 text-xs font-bold transition-all active:scale-95 shadow-sm shadow-cyan-500/20 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
          )}

          {/* 3D Spatial AI Dissector Button */}
          <button
            onClick={onOpen3DView}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
              is3DActive
                ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-600/50 text-indigo-200'
            }`}
            title="Interactive 3D Spatial AI Dissector for Appliances & Hardware"
          >
            <Box className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">3D Dissector</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-950/90 text-cyan-300 font-mono">3D</span>
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 font-medium transition-colors cursor-pointer"
            title="View Scan History"
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                {historyCount}
              </span>
            )}
          </button>

          {/* New Scan Button */}
          <button
            onClick={onNewScan}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-xs shadow-sm shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">New Scan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
