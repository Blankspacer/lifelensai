import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Check,
  Sparkles,
  Smartphone,
  Banknote,
  Copy,
  Clock,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { PaymentMethod } from '../types';
import { useAuth } from '../context/AuthContext';
import { submitSubscriptionRequest, MFS_PAYMENT_NUMBER, MONTHLY_PACKAGE_PRICE_BDT } from '../services/subscriptionService';

interface MfsPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const MfsPaymentModal: React.FC<MfsPaymentModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
}) => {
  const { currentUser, userProfile } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<'pro_monthly' | 'family_monthly'>('pro_monthly');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('bkash');
  const [senderPhone, setSenderPhone] = useState(userProfile?.phone || '');
  const [trxId, setTrxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const planInfo = {
    pro_monthly: {
      name: 'LifeLens Pro Monthly',
      bdtPrice: MONTHLY_PACKAGE_PRICE_BDT,
      usdPrice: `BDT ${MONTHLY_PACKAGE_PRICE_BDT}`,
      features: [
        'Unlimited AI document & bill scans per day',
        'Identify hidden charges, penalty clauses & fine print',
        'AI Dispute & Inquiry letter generator',
        'Interactive 3D Hardware & Appliance Dissector',
        'Direct calendar deadline sync & multi-language voice TTS',
      ],
    },
    family_monthly: {
      name: 'LifeLens Family Monthly',
      bdtPrice: 1499,
      usdPrice: 'BDT 1,499',
      features: [
        'All Pro features included',
        'Up to 5 accounts under single subscription',
        'Shared household document vault',
        'Allergen profile alerts for family members',
        'Priority admin verification queue',
      ],
    },
  };

  const paymentDetails: Record<
    PaymentMethod,
    { name: string; number: string; type: string; bg: string; border: string; text: string; icon: string; instructions: string[] }
  > = {
    bkash: {
      name: 'bKash',
      number: MFS_PAYMENT_NUMBER,
      type: 'Personal (Send Money)',
      bg: 'bg-pink-950/40',
      border: 'border-pink-500/60',
      text: 'text-pink-300',
      icon: '🌸',
      instructions: [
        'Open your bKash App or dial *247#',
        'Select "Send Money" (Personal)',
        `Enter Receiver Number: ${MFS_PAYMENT_NUMBER}`,
        `Enter Amount: ৳${planInfo[selectedPlan].bdtPrice}`,
        'Enter Reference: "LifeLens"',
        'Enter PIN and confirm transaction',
        'Copy the 10-character TrxID and paste it below',
      ],
    },
    nagad: {
      name: 'Nagad',
      number: MFS_PAYMENT_NUMBER,
      type: 'Personal (Send Money)',
      bg: 'bg-amber-950/40',
      border: 'border-amber-500/60',
      text: 'text-amber-300',
      icon: '🟠',
      instructions: [
        'Open your Nagad App or dial *167#',
        'Select "Send Money" (Personal)',
        `Enter Receiver Number: ${MFS_PAYMENT_NUMBER}`,
        `Enter Amount: ৳${planInfo[selectedPlan].bdtPrice}`,
        'Enter Reference: "LifeLens"',
        'Confirm with your Nagad PIN',
        'Copy your Transaction ID (TrxID) and enter below',
      ],
    },
    upay: {
      name: 'Upay (UCB)',
      number: MFS_PAYMENT_NUMBER,
      type: 'Personal (Send Money)',
      bg: 'bg-blue-950/40',
      border: 'border-blue-500/60',
      text: 'text-blue-300',
      icon: '🔵',
      instructions: [
        'Open Upay App or dial *268#',
        'Select "Send Money" (Personal)',
        `Enter Receiver Number: ${MFS_PAYMENT_NUMBER}`,
        `Enter Amount: ৳${planInfo[selectedPlan].bdtPrice}`,
        'Confirm with your Upay PIN',
        'Copy and enter the Transaction ID below',
      ],
    },
    rocket: {
      name: 'Rocket (DBBL)',
      number: `${MFS_PAYMENT_NUMBER}-4`,
      type: 'Personal (Send Money)',
      bg: 'bg-purple-950/40',
      border: 'border-purple-500/60',
      text: 'text-purple-300',
      icon: '🟣',
      instructions: [
        'Open Rocket App or dial *322#',
        'Select "Send Money"',
        `Enter 12-digit Account: ${MFS_PAYMENT_NUMBER}-4`,
        `Enter Amount: ৳${planInfo[selectedPlan].bdtPrice}`,
        'Complete transfer with your PIN',
        'Note down TrxID and enter below',
      ],
    },
    cash: {
      name: 'Cash Payment',
      number: 'Direct Admin / Authorized Agent',
      type: 'In-Person Cash / Voucher',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-500/60',
      text: 'text-emerald-300',
      icon: '💵',
      instructions: [
        'Pay cash directly to admin sneloy@gmail.com or authorized representative',
        'Mention your registered unique email or phone number',
        'Receive the Cash Receipt Voucher Code',
        'Enter the Receipt Number / Voucher Code below as your TrxID',
      ],
    },
  };

  const currentMethod = paymentDetails[selectedMethod];

  const handleCopyNumber = () => {
    const num = currentMethod.number.replace(/[^0-9]/g, '');
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && !userProfile) {
      onOpenAuth();
      return;
    }

    if (!senderPhone.trim()) {
      setErrorMsg('Please enter your sender mobile number or contact phone.');
      return;
    }
    if (!trxId.trim()) {
      setErrorMsg('Please enter your Transaction ID (TrxID) or Cash Voucher code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const uid = currentUser?.uid || userProfile?.uid || 'user-unknown';
    const email = currentUser?.email || userProfile?.email || 'user@example.com';

    try {
      await submitSubscriptionRequest(
        uid,
        email,
        selectedPlan,
        planInfo[selectedPlan].name,
        planInfo[selectedPlan].bdtPrice,
        selectedMethod,
        senderPhone.trim(),
        trxId.trim()
      );
      setSubmitted(true);
    } catch (err: any) {
      console.error('Subscription request error:', err);
      setErrorMsg(err.message || 'Failed to submit payment verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Monthly Subscription Payment
              </h3>
              <p className="text-xs text-slate-400">
                Send Money to <strong className="text-cyan-300 font-mono">{MFS_PAYMENT_NUMBER}</strong> (bKash / Nagad / Upay Personal)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {submitted ? (
            <div className="text-center py-10 px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-white">
                Payment Submitted for Verification!
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Thank you! Your payment of <strong className="text-cyan-300 font-mono">৳{planInfo[selectedPlan].bdtPrice} BDT</strong> via {currentMethod.name} with TrxID <strong className="text-cyan-300 font-mono">{trxId.toUpperCase()}</strong> has been submitted to super admin <strong className="text-white">sneloy@gmail.com</strong>.
              </p>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 max-w-sm mx-auto flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>The super admin will approve your subscription within 5–15 minutes.</span>
              </div>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Done / Return to App
              </button>
            </div>
          ) : (
            <>
              {/* Not Logged In Alert */}
              {!currentUser && !userProfile && (
                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Please sign in or create an account with your unique email first.</span>
                  </div>
                  <button
                    onClick={onOpenAuth}
                    className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 text-xs cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {/* 1. Plan Selector */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  1. Select Monthly Package
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['pro_monthly', 'family_monthly'] as const).map((planKey) => {
                    const plan = planInfo[planKey];
                    const isSelected = selectedPlan === planKey;
                    return (
                      <button
                        type="button"
                        key={planKey}
                        onClick={() => setSelectedPlan(planKey)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/50 border-cyan-500 ring-1 ring-cyan-500 shadow-md'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{plan.name}</span>
                          {planKey === 'pro_monthly' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300">
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1.5 my-1">
                          <span className="text-xl font-extrabold text-cyan-400">৳{plan.bdtPrice}</span>
                          <span className="text-xs text-slate-400">BDT / month ({plan.usdPrice})</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {planKey === 'pro_monthly' ? 'Unlimited AI scans, 3D dissector & letter generator' : 'Shared household accounts (up to 5 users)'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  2. Choose Payment Method (MFS / Cash)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['bkash', 'nagad', 'upay', 'rocket', 'cash'] as PaymentMethod[]).map((method) => {
                    const info = paymentDetails[method];
                    const isSelected = selectedMethod === method;
                    return (
                      <button
                        type="button"
                        key={method}
                        onClick={() => setSelectedMethod(method)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
                          isSelected
                            ? `${info.bg} ${info.border} ring-1 ${info.text} font-bold shadow-sm`
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xl mb-1">{info.icon}</span>
                        <span className="text-xs">{info.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Payment Instructions Card with explicit 01836317128 number */}
              <div className={`p-4 rounded-2xl border ${currentMethod.bg} ${currentMethod.border} space-y-3`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Send Money to (Personal Account):
                    </span>
                    <div className="text-base font-extrabold text-white flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-cyan-300">{currentMethod.number}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-black/50 text-slate-300 font-semibold border border-slate-700">
                        {currentMethod.type}
                      </span>
                    </div>
                  </div>
                  {selectedMethod !== 'cash' && (
                    <button
                      type="button"
                      onClick={handleCopyNumber}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-xs text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                    >
                      {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                      <span className="font-semibold">{copiedNumber ? 'Copied Number!' : 'Copy 01836317128'}</span>
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                    <span>How to send ৳{planInfo[selectedPlan].bdtPrice} via {currentMethod.name}:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300">
                    {currentMethod.instructions.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* 4. Verification Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Your Sender Mobile Number
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        placeholder="e.g. 018XXXXXXXX or 017XXXXXXXX"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Transaction ID (TrxID) / Voucher Code
                    </label>
                    <input
                      type="text"
                      required
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="e.g. BL98K41X90"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Sent to super admin <strong>01836317128</strong> (sneloy@gmail.com). Package activates for 30 days upon 1-click verification.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {loading ? 'Submitting Request...' : `Submit Payment Verification (৳${planInfo[selectedPlan].bdtPrice} BDT)`}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
