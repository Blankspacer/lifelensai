import React from 'react';
import { X, Check, Crown, Users, Gift, ShieldCheck, Sparkles, CreditCard, Clock } from 'lucide-react';
import { getDailyScanCount, getDailyLimit } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { MONTHLY_PACKAGE_PRICE_BDT } from '../services/subscriptionService';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPayment: () => void;
  onOpenAuth: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onOpenPayment,
  onOpenAuth,
}) => {
  const dailyCount = getDailyScanCount();
  const dailyLimit = getDailyLimit();
  const { userProfile, isSubscribed, isTrialActive, trialDaysRemaining } = useAuth();

  if (!isOpen) return null;

  const currentPlan = userProfile?.packagePlan || 'free';
  const isPro = currentPlan === 'pro_monthly' && isSubscribed;
  const isFamily = currentPlan === 'family_monthly' && isSubscribed;
  const isPending = userProfile?.subscriptionStatus === 'pending';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-semibold mb-1">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>10 Days Free Trial Included with Every Registration</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              LifeLens AI Membership
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              10 Days Free Trial, then BDT {MONTHLY_PACKAGE_PRICE_BDT} taka / month via bKash, Nagad, Rocket, Upay or Cash
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status bar */}
        <div className="bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                isTrialActive
                  ? 'bg-amber-400 animate-pulse'
                  : isSubscribed
                  ? 'bg-emerald-400 animate-pulse'
                  : isPending
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-cyan-400'
              }`}
            />
            {isTrialActive ? (
              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Active 10-Day Free Trial: {trialDaysRemaining} day(s) remaining</span>
              </span>
            ) : isPending ? (
              <span className="text-amber-300 font-semibold">
                ⏳ Payment verification in progress by Admin
              </span>
            ) : isSubscribed ? (
              <span className="text-emerald-300 font-semibold">
                👑 Active {currentPlan === 'pro_monthly' ? 'LifeLens Pro' : 'LifeLens Family'} Subscriber
                {userProfile?.subscriptionExpiresAt && (
                  <span className="text-slate-400 font-normal ml-1">
                    (Renews: {new Date(userProfile.subscriptionExpiresAt).toLocaleDateString()})
                  </span>
                )}
              </span>
            ) : (
              <span>
                Free Plan: <strong className="text-cyan-300">{dailyCount} of {dailyLimit} scans used today</strong>
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            MFS Accepted: <strong className="text-slate-200">bKash • Nagad • Rocket • Upay • Cash</strong>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Free 10-Day Trial Tier */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
            isTrialActive
              ? 'bg-gradient-to-b from-amber-950/40 to-slate-950 border-amber-500/80 shadow-md ring-1 ring-amber-500'
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  New User Free Trial
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  10 DAYS
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-white">৳0</span>
                <span className="text-xs text-slate-400">/ 10 days</span>
              </div>
              <p className="text-xs text-slate-300 mb-4">
                Register with mobile number or email, enter OTP verification code, and unlock 10 days of full Pro features instantly.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>10 days free trial</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited document scans</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Hidden fee &amp; fine print spotter</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>English &amp; Bengali (বাংলা) responses</span>
                </li>
              </ul>
            </div>
            {isTrialActive ? (
              <div className="mt-6 w-full py-2.5 rounded-xl bg-amber-500/20 text-amber-300 text-center text-xs font-bold border border-amber-500/40">
                Active ({trialDaysRemaining} days remaining)
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="mt-6 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
              >
                Start 10 Days Free Trial
              </button>
            )}
          </div>

          {/* Premium / Pro Tier (BDT 1,200 taka/month) */}
          <div className={`relative p-5 rounded-2xl border-2 flex flex-col justify-between ${
            isPro
              ? 'bg-gradient-to-b from-cyan-950/60 to-slate-950 border-emerald-500 shadow-xl'
              : 'bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-950 border-indigo-500/80 shadow-lg shadow-indigo-500/10'
          }`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
              {isPro ? 'Active Plan' : 'Monthly Package'}
            </div>
            <div>
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
                LifeLens Monthly Package
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-3xl font-extrabold text-white">৳{MONTHLY_PACKAGE_PRICE_BDT}</span>
                <span className="text-xs text-slate-400">BDT / month</span>
              </div>
              <p className="text-xs text-slate-300 mb-4">
                Continue full app features after your 10-day trial via bKash, Nagad, Rocket, Upay or Cash.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span><strong>Unlimited scans</strong> every day</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Multi-page contract &amp; bill stitching</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>AI Dispute &amp; Inquiry Letter Drafter</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Calendar Reminder Sync (.ics)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Priority Neural TTS voice guide</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenPayment();
              }}
              className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isPro ? 'Renew Monthly Package' : `Pay ৳${MONTHLY_PACKAGE_PRICE_BDT} with MFS / Cash`}</span>
            </button>
          </div>

          {/* Family / Household Tier */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
            isFamily
              ? 'bg-gradient-to-b from-purple-950/60 to-slate-950 border-emerald-500'
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
                <Users className="w-3.5 h-3.5" />
                <span>Family Plan Monthly</span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-3xl font-extrabold text-white">৳1,800</span>
                <span className="text-xs text-slate-400">BDT / month</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Shared household folder so partners &amp; family members never miss an unexpected fee or bill deadline.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Up to 5 family accounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Shared household document vault</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Allergen alerts for all family dietary profiles</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Joint bill deadline notifications</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenPayment();
              }}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isFamily ? 'Renew Family Plan' : 'Pay via MFS/Cash'}</span>
            </button>
          </div>
        </div>

        {/* Privacy Promise Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Zero-Ad Policy: Your private documents are never monetized or sold to third parties.</span>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenPayment();
            }}
            className="text-cyan-400 hover:text-cyan-300 underline font-medium"
          >
            How bKash/Nagad/Rocket/Cash payment works →
          </button>
        </div>
      </div>
    </div>
  );
};
