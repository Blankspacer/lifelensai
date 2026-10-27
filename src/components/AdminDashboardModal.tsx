import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Check,
  AlertTriangle,
  RefreshCw,
  Search,
  UserCheck,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Sparkles,
  Users,
  Copy,
  Clock,
  Mail,
  UserPlus,
  Lock,
} from 'lucide-react';
import { SubscriptionRequest, UserProfile } from '../types';
import {
  getAllSubscriptionRequests,
  getAllRegisteredUsers,
  approveSubscription,
  rejectSubscription,
  adminManualActivate,
  adminExtendTrial,
  ADMIN_EMAIL,
  MFS_PAYMENT_NUMBER,
  MONTHLY_PACKAGE_PRICE_BDT,
  TRIAL_DAYS,
} from '../services/subscriptionService';
import { useAuth } from '../context/AuthContext';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'manual'>('users');
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Manual activate form
  const [manualEmailOrPhone, setManualEmailOrPhone] = useState('');
  const [manualPlan, setManualPlan] = useState<'pro_monthly' | 'family_monthly'>('pro_monthly');
  const [manualMonths, setManualMonths] = useState<number>(1);
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);
  const [manualErrorMsg, setManualErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqData, userData] = await Promise.all([
        getAllSubscriptionRequests().catch(() => []),
        getAllRegisteredUsers().catch(() => []),
      ]);
      setRequests(reqData || []);
      setUsers(userData || []);
    } catch (err) {
      console.warn('Admin fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleApprove = async (req: SubscriptionRequest) => {
    setActionLoadingId(req.requestId);
    const adminEmail = currentUser?.email || userProfile?.email || ADMIN_EMAIL;
    try {
      await approveSubscription(req.requestId, req.userId, req.packagePlan, adminEmail);
      await loadData();
    } catch (err: any) {
      alert(`Approval error: ${err.message || 'Failed to approve'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (req: SubscriptionRequest) => {
    const reason = prompt('Optional reason for rejecting this payment submission:', 'TrxID not found on 01836317128 MFS account');
    if (reason === null) return;

    setActionLoadingId(req.requestId);
    try {
      await rejectSubscription(req.requestId, req.userId, reason);
      await loadData();
    } catch (err: any) {
      alert(`Rejection error: ${err.message || 'Failed to reject'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickActivatePro = async (user: UserProfile) => {
    setActionLoadingId(user.uid);
    try {
      await adminManualActivate(user.email, 'pro_monthly', 1);
      await loadData();
    } catch (e: any) {
      alert(`Error activating Pro: ${e.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickExtendTrial = async (user: UserProfile) => {
    setActionLoadingId(user.uid);
    try {
      await adminExtendTrial(user.uid, 7);
      await loadData();
    } catch (e: any) {
      alert(`Error extending trial: ${e.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleManualActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmailOrPhone.trim()) return;

    setLoading(true);
    setManualSuccessMsg(null);
    setManualErrorMsg(null);

    try {
      const success = await adminManualActivate(manualEmailOrPhone, manualPlan, manualMonths);
      if (success) {
        setManualSuccessMsg(`Successfully activated ${manualMonths} month(s) of ${manualPlan} for ${manualEmailOrPhone}!`);
        setManualEmailOrPhone('');
        await loadData();
      } else {
        setManualErrorMsg(`No registered account found with "${manualEmailOrPhone}". The user must register first.`);
      }
    } catch (err: any) {
      setManualErrorMsg(err.message || 'Manual activation failed.');
    } finally {
      setLoading(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  const filteredUsers = users.filter((u) => {
    const q = searchUserQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  const getMethodBadge = (m: string) => {
    switch (m) {
      case 'bkash':
        return <span className="px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-800 text-[11px] font-bold">🌸 bKash</span>;
      case 'nagad':
        return <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-bold">🟠 Nagad</span>;
      case 'rocket':
        return <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[11px] font-bold">🟣 Rocket</span>;
      case 'upay':
        return <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[11px] font-bold">🔵 Upay</span>;
      case 'cash':
        return <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold">💵 Cash</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">{m}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600 flex items-center justify-center text-slate-950 shadow-lg font-black">
              <Shield className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Super Admin Dashboard
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700">
                  {ADMIN_EMAIL}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  MFS: {MFS_PAYMENT_NUMBER}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage all registered users' emails &amp; phone numbers, 7-day trials, and MFS payment approvals
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

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-4 sm:px-6 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Registered Users ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'requests'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Payment Queue</span>
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
                  {pendingRequests.length} pending
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('manual')}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'manual'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Direct Cash / Upgrade</span>
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs flex items-center gap-1 cursor-pointer"
            title="Refresh records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: USERS DIRECTORY (Emails & Phone Numbers explicitly visible) */}
        {/* ============================================================== */}
        {activeTab === 'users' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  placeholder="Search user by email, phone number, or name..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div className="text-xs text-slate-400">
                Total Registered: <strong className="text-white">{users.length}</strong> • Showing: <strong className="text-amber-400">{filteredUsers.length}</strong>
              </div>
            </div>

            {/* Users Table */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-inner">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">User &amp; Email</th>
                    <th className="py-3 px-3">Phone / Mobile No.</th>
                    <th className="py-3 px-3">7-Day Free Trial</th>
                    <th className="py-3 px-3">Plan / Status</th>
                    <th className="py-3 px-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        No registered users match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isExpired = u.trialExpiresAt ? u.trialExpiresAt <= Date.now() && u.subscriptionStatus !== 'active' : false;
                      const isTrialOngoing = u.trialExpiresAt ? u.trialExpiresAt > Date.now() && u.subscriptionStatus === 'trial' : false;
                      const daysLeft = isTrialOngoing && u.trialExpiresAt
                        ? Math.max(1, Math.ceil((u.trialExpiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
                        : 0;
                      const isSuperAdmin = u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

                      return (
                        <tr key={u.uid} className="hover:bg-slate-900/50 transition-colors">
                          {/* User & Email */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{u.displayName || u.username || 'User'}</span>
                              {isSuperAdmin && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700 font-black">
                                  SUPER ADMIN
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                              <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="font-mono text-[11px]">{u.email}</span>
                              <button
                                onClick={() => handleCopy(u.email)}
                                className="p-0.5 text-slate-500 hover:text-white"
                                title="Copy Email"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </td>

                          {/* Phone / Mobile Number */}
                          <td className="py-3 px-3">
                            {u.phone ? (
                              <div className="flex items-center gap-1.5 font-mono text-cyan-300 font-bold text-xs bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 w-fit">
                                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                                <span>{u.phone}</span>
                                <button
                                  onClick={() => handleCopy(u.phone!)}
                                  className="text-slate-400 hover:text-white"
                                  title="Copy Phone"
                                >
                                  {copiedText === u.phone ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px] italic">Not provided</span>
                            )}
                          </td>

                          {/* 7-Day Trial Status */}
                          <td className="py-3 px-3">
                            {isSuperAdmin ? (
                              <span className="text-emerald-400 font-bold text-[11px]">Permanent Admin</span>
                            ) : isTrialOngoing ? (
                              <div>
                                <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-bold">
                                  Day {Math.max(1, TRIAL_DAYS - daysLeft + 1)} of 7 ({daysLeft}d left)
                                </span>
                              </div>
                            ) : isExpired ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
                                7d Trial Expired (Signed Off)
                              </span>
                            ) : u.subscriptionStatus === 'active' ? (
                              <span className="text-emerald-400 font-bold text-[11px]">Pro Subscribed</span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">—</span>
                            )}
                          </td>

                          {/* Subscription Status */}
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                u.subscriptionStatus === 'active' || isSuperAdmin
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : u.subscriptionStatus === 'pending'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : isExpired
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                              }`}
                            >
                              {isSuperAdmin ? 'ACTIVE PRO' : u.subscriptionStatus}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            {!isSuperAdmin && (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleQuickActivatePro(u)}
                                  disabled={actionLoadingId === u.uid}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer"
                                  title="Activate 30 Days Pro"
                                >
                                  {actionLoadingId === u.uid ? '...' : '✓ Activate Pro'}
                                </button>
                                <button
                                  onClick={() => handleQuickExtendTrial(u)}
                                  disabled={actionLoadingId === u.uid}
                                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-950 text-slate-300 hover:text-amber-300 border border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                                  title="Add 7 Days Trial"
                                >
                                  +7d
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: PAYMENT QUEUE (bKash, Nagad, Upay sent to 01836317128)  */}
        {/* ============================================================== */}
        {activeTab === 'requests' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>
                  Expected Receiver Account: <strong className="text-cyan-300 font-mono text-sm">{MFS_PAYMENT_NUMBER}</strong> (bKash/Nagad/Upay Personal)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Standard Fee: <strong>৳{MONTHLY_PACKAGE_PRICE_BDT} BDT / month</strong>
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-16">
                <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-300">No payment requests yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  When users send money to 01836317128 and submit their TrxID, they appear here for 1-click monthly activation.
                </p>
              </div>
            ) : (
              requests.map((req) => {
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';
                const isReject = req.status === 'rejected';
                const isProcessing = actionLoadingId === req.requestId;

                return (
                  <div
                    key={req.requestId}
                    className={`p-4 rounded-2xl border transition-all ${
                      isPending
                        ? 'bg-slate-950 border-amber-500/50 shadow-md'
                        : 'bg-slate-950/70 border-slate-800/80 opacity-80'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getMethodBadge(req.paymentMethod)}
                          <span className="text-xs font-bold text-white">
                            ৳{req.amountBDT} BDT — {req.packageName}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                              isPending
                                ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                                : isApproved
                                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                                : 'bg-rose-900/60 text-rose-300 border border-rose-700'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 flex items-center gap-2">
                          <span>User Email: <strong className="text-cyan-300">{req.userEmail}</strong></span>
                          <span>•</span>
                          <span>Sender Mobile: <strong className="text-cyan-300 font-mono">{req.senderPhone}</strong></span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {isPending && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReject(req)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={isProcessing}
                            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                          >
                            {isProcessing ? 'Activating...' : '✓ Approve & Activate (30 Days)'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-xs text-slate-400">
                      <div>
                        <span className="block text-[10px] text-slate-500">Transaction ID (TrxID):</span>
                        <strong className="text-slate-100 font-mono text-sm">{req.trxId}</strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500">Receiver Account:</span>
                        <span className="text-slate-200 font-mono">{MFS_PAYMENT_NUMBER}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500">Submitted At:</span>
                        <span className="text-slate-300">{new Date(req.createdAt).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500">Note:</span>
                        <span className="text-slate-400">{req.adminNotes || (isApproved ? 'Approved by super admin' : 'Awaiting verification')}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: DIRECT CASH / VOUCHER ACTIVATION                         */}
        {/* ============================================================== */}
        {activeTab === 'manual' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl mx-auto w-full space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-indigo-950/40 border border-cyan-800/40 text-xs text-slate-300">
              <strong className="text-cyan-300 font-bold block mb-1">
                Direct Cash &amp; Voucher Package Activation
              </strong>
              If a customer pays cash directly or via custom bank transfer, activate their monthly package immediately by entering their registered email or phone number.
            </div>

            {manualSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{manualSuccessMsg}</span>
              </div>
            )}

            {manualErrorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{manualErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleManualActivate} className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Customer Email or Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={manualEmailOrPhone}
                  onChange={(e) => setManualEmailOrPhone(e.target.value)}
                  placeholder="e.g. user@example.com or 017XXXXXXXX"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Subscription Package
                  </label>
                  <select
                    value={manualPlan}
                    onChange={(e) => setManualPlan(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="pro_monthly">LifeLens Pro (৳{MONTHLY_PACKAGE_PRICE_BDT}/mo)</option>
                    <option value="family_monthly">LifeLens Family (৳1,499/mo)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Duration (Months)
                  </label>
                  <select
                    value={manualMonths}
                    onChange={(e) => setManualMonths(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value={1}>1 Month (30 Days)</option>
                    <option value={3}>3 Months (90 Days)</option>
                    <option value={6}>6 Months (180 Days)</option>
                    <option value={12}>1 Year (365 Days)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-600 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {loading ? 'Activating Package...' : 'Activate Monthly Package Now'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
