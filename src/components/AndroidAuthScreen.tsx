import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Lock,
  User,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Gift,
  ArrowLeft,
  X,
  Clock,
  Wifi,
  Battery,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  ADMIN_EMAIL,
  MONTHLY_PACKAGE_PRICE_BDT,
  TRIAL_DAYS,
  MFS_PAYMENT_NUMBER,
} from '../services/subscriptionService';

interface AndroidAuthScreenProps {
  isOpen: boolean;
  onClose?: () => void;
  defaultView?: 'login' | 'register';
  isMandatory?: boolean;
}

export const AndroidAuthScreen: React.FC<AndroidAuthScreenProps> = ({
  isOpen,
  onClose,
  defaultView = 'login',
  isMandatory = false,
}) => {
  const {
    loginWithCredentials,
    registerNewUser,
    verifyAndActivateAccount,
    loginWithGoogle,
    demoLoginAsAdmin,
    demoLoginAsActiveTrialUser,
    demoLoginAsExpiredUser,
  } = useAuth();

  // Screen states: 'login' | 'register' | 'otp' | 'success'
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'otp' | 'success'>(defaultView);

  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form
  const [regUsername, setRegUsername] = useState('');
  const [identifierType, setIdentifierType] = useState<'phone' | 'email'>('phone');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [expectedCode, setExpectedCode] = useState<string>('');
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  const [resendTimer, setResendTimer] = useState<number>(45);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setCurrentScreen(defaultView);
    setErrorMsg(null);
  }, [defaultView, isOpen]);

  // Resend countdown timer
  useEffect(() => {
    let interval: any;
    if (currentScreen === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentScreen, resendTimer]);

  if (!isOpen) return null;

  // --- Handlers ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter both User Name and Password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithCredentials(loginIdentifier, loginPassword);
      if (onClose) onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      let msg = err.message || 'Login failed.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid User Name or Password. Please check your credentials or register a new account.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim()) {
      setErrorMsg('Please enter a User Name.');
      return;
    }
    if (!regIdentifier.trim()) {
      setErrorMsg(identifierType === 'phone' ? 'Please enter your Mobile Number.' : 'Please enter your Email Address.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const isPhone = identifierType === 'phone';
      const cleanContact = isPhone
        ? regIdentifier.replace(/[^0-9+]/g, '')
        : regIdentifier.trim();

      const result = await registerNewUser({
        username: regUsername.trim(),
        emailOrPhone: cleanContact,
        isPhone,
        password: regPassword,
      });

      setExpectedCode(result.code);
      setPendingUserData({
        tempUid: result.tempUid,
        email: result.email,
        username: regUsername.trim(),
        emailOrPhone: cleanContact,
        phone: isPhone ? cleanContact : undefined,
        isPhone,
      });

      setResendTimer(45);
      setCurrentScreen('otp');
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Digits input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.replace(/[^0-9]/g, '').slice(0, 6);
      if (pasted.length === 6) {
        setOtpDigits(pasted.split(''));
        otpInputRefs.current[5]?.focus();
        return;
      }
    }

    const digit = value.slice(-1).replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await verifyAndActivateAccount(fullCode, expectedCode, pendingUserData);
      setCurrentScreen('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    if (resendTimer > 0) return;
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedCode(newCode);
    setResendTimer(45);
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Android Device Mockup Frame */}
      <div className="relative w-full max-w-[420px] bg-slate-950 border-2 border-slate-800 rounded-[38px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[95vh]">
        {/* Android Top Speaker & Camera Notch */}
        <div className="absolute top-2 inset-x-0 flex justify-center z-20 pointer-events-none">
          <div className="w-20 h-4 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-950" />
            <div className="w-8 h-1 rounded-full bg-slate-800" />
          </div>
        </div>

        {/* Android Status Bar */}
        <div className="pt-3 px-6 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 z-10 select-none">
          <span>9:41 AM</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-[10px] font-mono">5G</span>
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Close Button top-right (only if not mandatory) */}
        {!isMandatory && onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 z-30 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
          {/* App Branding & Logo */}
          <div className="text-center pt-2 pb-4">
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 shadow-xl shadow-cyan-500/20 mb-3 mx-auto">
              <Camera className="w-8 h-8 text-white" />
              <div className="absolute -inset-1 rounded-3xl border border-cyan-400/30 animate-pulse pointer-events-none" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              LifeLens<span className="text-cyan-400">.ai</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Scan It. Understand It. Make Better Decisions.
            </p>
          </div>

          {/* Error Message if any */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs leading-relaxed animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {/* ========================================================== */}
          {/* SCREEN 1: LOGIN (User Name + Password)                    */}
          {/* ========================================================== */}
          {currentScreen === 'login' && (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-center mb-5">
                  <h2 className="text-lg font-extrabold text-white">Sign In to Your Account</h2>
                  <p className="text-xs text-slate-400">
                    Enter your User Name and password to continue
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  {/* User Name input */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      User Name / Email / Mobile
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. username or 017XXXXXXXX"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-2xl pl-10 pr-3.5 py-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Password input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => alert('Please contact administrator at sneloy@gmail.com for password reset assistance.')}
                        className="text-[11px] text-cyan-400 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Android Style Primary Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Log In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Google Sign In Option */}
                <div className="mt-4">
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-800" />
                    <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase font-semibold">
                      or
                    </span>
                    <div className="flex-grow border-t border-slate-800" />
                  </div>

                  <button
                    type="button"
                    onClick={loginWithGoogle}
                    className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2.5 transition-colors"
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
                    <span>Sign in with Google</span>
                  </button>
                </div>
              </div>

              {/* Bottom switch to registration */}
              <div className="pt-4 border-t border-slate-900 text-center space-y-3">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 to-indigo-950/40 border border-amber-800/40 flex items-center justify-between text-left">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-amber-200">10 Days Free Trial</div>
                      <div className="text-[10px] text-slate-400">Then BDT {MONTHLY_PACKAGE_PRICE_BDT} taka/month</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentScreen('register');
                      setErrorMsg(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-colors"
                  >
                    Register
                  </button>
                </div>

                {/* Quick Demo Credentials */}
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                  <button
                    type="button"
                    onClick={() => {
                      demoLoginAsAdmin();
                      onClose();
                    }}
                    className="hover:text-amber-400 underline"
                  >
                    Demo Admin
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      demoLoginAsUser();
                      onClose();
                    }}
                    className="hover:text-cyan-400 underline"
                  >
                    Demo Active Trial
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* SCREEN 2: REGISTRATION (Mobile or Email)                   */}
          {/* ========================================================== */}
          {currentScreen === 'register' && (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('login')}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base font-extrabold text-white">New User Registration</h2>
                    <p className="text-[11px] text-cyan-300">
                      🎁 Includes 7 Days Free Trial (Then BDT {MONTHLY_PACKAGE_PRICE_BDT} taka/mo)
                    </p>
                  </div>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  {/* User Name */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      User Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="Choose a username (e.g. john_doe)"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Identifier Type Switch: Mobile Number vs Email */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Register with:
                      </label>
                      <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setIdentifierType('phone')}
                          className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                            identifierType === 'phone'
                              ? 'bg-cyan-600 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          📱 Mobile Number
                        </button>
                        <button
                          type="button"
                          onClick={() => setIdentifierType('email')}
                          className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                            identifierType === 'email'
                              ? 'bg-cyan-600 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          ✉️ Email Address
                        </button>
                      </div>
                    </div>

                    {/* Input based on selection */}
                    {identifierType === 'phone' ? (
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-xs font-bold text-cyan-400 flex items-center gap-1">
                          🇧🇩 +880
                        </span>
                        <input
                          type="tel"
                          required
                          value={regIdentifier}
                          onChange={(e) => setRegIdentifier(e.target.value)}
                          placeholder="17XXXXXXXX"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-2xl pl-20 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-mono"
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <Mail className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={regIdentifier}
                          onChange={(e) => setRegIdentifier(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Password (min 6 characters)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      A 6-digit verification code will be sent to your {identifierType === 'phone' ? 'mobile number' : 'email'} to activate your 7 days free trial.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {loading ? 'Sending Code...' : 'Send Verification Code'}
                  </button>
                </form>
              </div>

              <div className="pt-3 border-t border-slate-900 text-center">
                <span className="text-xs text-slate-400">Already registered? </span>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('login')}
                  className="text-xs text-cyan-400 font-bold hover:underline"
                >
                  Log In
                </button>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* SCREEN 3: OTP VERIFICATION & ACTIVATION                   */}
          {/* ========================================================== */}
          {currentScreen === 'otp' && (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-2 border border-cyan-500/30">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-extrabold text-white">Enter Verification Code</h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    We sent a 6-digit OTP code to{' '}
                    <strong className="text-cyan-300 font-mono">
                      {pendingUserData?.emailOrPhone || 'your contact'}
                    </strong>
                  </p>
                </div>

                {/* Simulated SMS / Email Delivery Banner for Instant Testing */}
                {expectedCode && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 border border-cyan-500/60 shadow-lg text-center space-y-2 mb-4 animate-in slide-in-from-top-2">
                    <div className="text-[11px] font-bold text-cyan-300 flex items-center justify-center gap-1.5">
                      <span>📩 Incoming Verification Code:</span>
                      <span className="text-base font-black font-mono tracking-widest text-white bg-cyan-900/60 px-2.5 py-0.5 rounded-lg border border-cyan-400">
                        {expectedCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtpDigits(expectedCode.split(''))}
                      className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline block mx-auto cursor-pointer"
                    >
                      Tap here to autofill verification code
                    </button>
                  </div>
                )}

                {/* 6 Digits Inputs */}
                <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-4">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono bg-slate-900 border-2 border-slate-800 focus:border-cyan-400 rounded-xl text-white focus:outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>

                {/* Resend Timer */}
                <div className="text-center text-xs text-slate-400 mt-2">
                  {resendTimer > 0 ? (
                    <span className="flex items-center justify-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Resend code in {resendTimer}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-cyan-400 font-bold hover:underline"
                    >
                      Resend Code Now
                    </button>
                  )}
                </div>

                {/* Verify & Activate Button */}
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-600 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all cursor-pointer mt-5"
                >
                  {loading ? 'Activating Trial...' : 'Activate 7 Days Free Trial'}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-900 text-center">
                <button
                  type="button"
                  onClick={() => setCurrentScreen('register')}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  ← Change mobile number or email
                </button>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* SCREEN 4: ACTIVATION SUCCESS (7 Days Free Trial)          */}
          {/* ========================================================== */}
          {currentScreen === 'success' && (
            <div className="text-center py-6 px-2 space-y-4 my-auto">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-500/25 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white">
                  Account Activated! 🎉
                </h2>
                <p className="text-xs text-emerald-300 font-bold">
                  Your 7-Day Free Trial is Now Active
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>All Pro Features Unlocked for 7 Days:</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc list-inside">
                  <li>Unlimited AI document &amp; bill scans</li>
                  <li>Identify hidden fees, fine print &amp; allergen warnings</li>
                  <li>Interactive 3D Spatial Appliance Dissector</li>
                  <li>Grounded document Q&amp;A and dispute letters</li>
                </ul>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  After 7 days, you will automatically be signed off unless upgraded to Pro for <strong className="text-white">BDT {MONTHLY_PACKAGE_PRICE_BDT} taka / month</strong> via Send Money to <strong className="text-cyan-300 font-mono">{MFS_PAYMENT_NUMBER}</strong> (bKash/Nagad/Upay).
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all cursor-pointer"
              >
                Start Scanning Now
              </button>
            </div>
          )}
        </div>

        {/* Android Virtual Navigation Bar */}
        <div className="py-2.5 flex items-center justify-center gap-14 bg-black border-t border-slate-900 text-slate-600 select-none">
          <div className="w-3.5 h-3.5 border-2 border-slate-600 rounded-sm" />
          <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-600" />
          <div className="w-3 h-3 border-t-2 border-l-2 border-slate-600 -rotate-45" />
        </div>
      </div>
    </div>
  );
};
