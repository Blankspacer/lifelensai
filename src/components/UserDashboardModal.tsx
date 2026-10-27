import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Smartphone,
  Calendar,
  Crown,
  Gift,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Copy,
  History,
  LogOut,
  Sparkles,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SubscriptionRequest } from '../types';
import {
  getAllSubscriptionRequests,
  MFS_PAYMENT_NUMBER,
  MONTHLY_PACKAGE_PRICE_BDT,
  TRIAL_DAYS,
} from '../services/subscriptionService';
import { getScanHistory } from '../services/storageService';

interface UserDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPayment: () => void;
  onOpenScanHistory: () => void;
}

export const UserDashboardModal: React.FC<UserDashboardModalProps> = ({
  isOpen,
  onClose,
  onOpenPayment,
  onOpenScanHistory,
}) => {
  const { userProfile, currentUser, isAdmin, isTrialActive, isTrialExpired, trialDaysRemaining, logout } = useAuth();
  const [userRequests, setUserRequests] = useState<SubscriptionRequest[]>([]);
  const [totalScans, setTotalScans] = useState<number>(0);
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTotalScans(getScanHistory().length);
      getAllSubscriptionRequests().then((all) => {
        const email = currentUser?.email || userProfile?.email;
        const uid = currentUser?.uid || userProfile?.uid;
        const filtered = all.filter(
          (r) =>
            (email && r.userEmail.toLowerCase() === email.toLowerCase()) ||
            (uid && r.userId === uid)
        );
        setUserRequests(filtered);
      });
    }
  }, [isOpen, currentUser, userProfile]);

  if (!isOpen) return null;

  const email = userProfile?.email || currentUser?.email || 'user@example.com';
  const username = userProfile?.username || userProfile?.displayName || email.split('@')[0];
  const phone = userProfile?.phone || 'Not linked';

  const isProActive = Boolean(
    isAdmin ||
      (userProfile?.subscriptionStatus === 'active' &&
        (!userProfile.subscriptionExpiresAt || userProfile.subscriptionExpiresAt > Date.now()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>User Dashboard</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                  Member
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Your account details, 7-day trial status &amp; subscriptions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* 1. Profile Information Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                  {username[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{username}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Account Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-900 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Registered Mobile / Phone
                </span>
                <div className="flex items-center gap-2 font-mono text-slate-200">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold">{phone}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Registered Since
                </span>
                <div className="flex items-center gap-2 text-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {userProfile?.createdAt
                      ? new Date(userProfile.createdAt).toLocaleDateString()
                      : 'Recently'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 7-Day Free Trial / Subscription Status Card */}
          <div
            className={`p-5 rounded-2xl border ${
              isProActive
                ? 'bg-gradient-to-r from-emerald-950/40 to-slate-950 border-emerald-500/50'
                : isTrialActive
                ? 'bg-gradient-to-r from-amber-950/40 via-slate-950 to-amber-950/20 border-amber-500/60'
                : 'bg-gradient-to-r from-rose-950/40 to-slate-950 border-rose-600/60'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                {isProActive ? (
                  <Crown className="w-5 h-5 text-amber-400" />
                ) : isTrialActive ? (
                  <Gift className="w-5 h-5 text-amber-400 animate-bounce" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                )}
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-white">
                    {isProActive
                      ? 'LifeLens Pro Subscription Active'
                      : isTrialActive
                      ? `7-Day Free Trial: ${trialDaysRemaining} Day(s) Left`
                      : '7-Day Free Trial Expired'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {isProActive
                      ? 'Unlimited AI document scans, dispute letters & 3D dissections'
                      : isTrialActive
                      ? 'Enjoy full access to LifeLens AI. After trial, upgrade for BDT 1,200/month.'
                      : 'Your 7 days of free access have ended. Please upgrade to Pro to continue scanning.'}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                  isProActive
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : isTrialActive
                    ? 'bg-amber-950 text-amber-300 border border-amber-700'
                    : 'bg-rose-950 text-rose-300 border border-rose-700'
                }`}
              >
                {isProActive ? 'PRO ACTIVE' : isTrialActive ? 'TRIAL ACTIVE' : 'EXPIRED'}
              </span>
            </div>

            {/* Trial Progression Bar (if in trial) */}
            {isTrialActive && (
              <div className="space-y-1.5 my-3">
                <div className="flex justify-between text-[11px] text-amber-300 font-semibold">
                  <span>Day {Math.max(1, TRIAL_DAYS - trialDaysRemaining + 1)} of {TRIAL_DAYS} Days</span>
                  <span>{trialDaysRemaining} days remaining</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(10, ((TRIAL_DAYS - trialDaysRemaining) / TRIAL_DAYS) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Upgrade / Pay Button */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                <span className="text-slate-400">Monthly Membership: </span>
                <strong className="text-white">BDT {MONTHLY_PACKAGE_PRICE_BDT} taka</strong> / month
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPayment();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay via bKash / Nagad / Upay (01836317128)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3. Payment Verification History */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Your Payment Submissions
            </h4>

            {userRequests.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-center text-xs text-slate-500">
                No payment submissions yet. When you submit a TrxID via bKash, Nagad, or Upay, it will show here.
              </div>
            ) : (
              <div className="space-y-2">
                {userRequests.map((req) => (
                  <div
                    key={req.requestId}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white font-mono">{req.trxId}</strong>
                        <span className="text-[11px] text-slate-400 uppercase">
                          ({req.paymentMethod})
                        </span>
                        <span className="text-cyan-400 font-bold">৳{req.amountBDT}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Sender: {req.senderPhone} • {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        req.status === 'approved'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : req.status === 'pending'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {req.status === 'pending'
                        ? '⏳ Under Review'
                        : req.status === 'approved'
                        ? '✓ Approved & Active'
                        : '✕ Rejected'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Quick Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenScanHistory();
              }}
              className="p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-left transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-xs font-bold text-white">Saved Scan Records</div>
                  <div className="text-[11px] text-slate-400">{totalScans} document(s) stored</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPayment();
              }}
              className="p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-left transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-xs font-bold text-white">Renew / Upgrade</div>
                  <div className="text-[11px] text-slate-400">Send to 01836317128</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
