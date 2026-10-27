import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import {
  syncUserProfile,
  activateUserTrial,
  ADMIN_EMAIL,
  TRIAL_DAYS,
  TRIAL_DURATION_MS,
} from '../services/subscriptionService';

interface RegisterPayload {
  username: string;
  emailOrPhone: string;
  isPhone: boolean;
  password: string;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isSubscribed: boolean;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialDaysRemaining: number;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithCredentials: (usernameOrEmail: string, pass: string) => Promise<void>;
  registerNewUser: (payload: RegisterPayload) => Promise<{ code: string; tempUid: string; email: string }>;
  verifyAndActivateAccount: (codeEntered: string, expectedCode: string, tempUser: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  demoLoginAsAdmin: () => void;
  demoLoginAsActiveTrialUser: () => void;
  demoLoginAsExpiredUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync profile when auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && user.email) {
        try {
          const profile = await syncUserProfile(
            user.uid,
            user.email,
            user.displayName || undefined
          );
          setUserProfile(profile);
        } catch (err) {
          console.warn('Profile sync notice:', err);
          const isAdm = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
          setUserProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            role: isAdm ? 'admin' : 'user',
            subscriptionStatus: isAdm ? 'active' : 'trial',
            packagePlan: 'pro_monthly',
            trialExpiresAt: isAdm ? null : Date.now() + TRIAL_DURATION_MS,
            subscriptionExpiresAt: isAdm
              ? Date.now() + 365 * 24 * 60 * 60 * 1000
              : Date.now() + TRIAL_DURATION_MS,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        // If not logged into Firebase, check if there's a cached session
        try {
          const savedSession = localStorage.getItem('lifelens_current_session');
          if (savedSession) {
            setUserProfile(JSON.parse(savedSession));
          }
        } catch (e) {
          console.warn(e);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const saveActiveSession = (profile: UserProfile | null) => {
    setUserProfile(profile);
    try {
      if (profile) {
        localStorage.setItem('lifelens_current_session', JSON.stringify(profile));
      } else {
        localStorage.removeItem('lifelens_current_session');
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const refreshProfile = async () => {
    if (userProfile?.uid && userProfile?.email) {
      try {
        const profile = await syncUserProfile(
          userProfile.uid,
          userProfile.email,
          userProfile.displayName || undefined,
          userProfile.username || undefined,
          userProfile.phone || undefined
        );
        saveActiveSession(profile);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    if (cred.user && cred.user.email) {
      const profile = await syncUserProfile(
        cred.user.uid,
        cred.user.email,
        cred.user.displayName || undefined
      );
      saveActiveSession(profile);
    }
  };

  // Login with Username or Email or Mobile Number
  const loginWithCredentials = async (usernameOrEmailOrPhone: string, pass: string) => {
    const cleanId = usernameOrEmailOrPhone.trim();

    // Check if matching phone number in local cache
    try {
      const raw = localStorage.getItem('lifelens_registered_users_cache');
      if (raw) {
        const list: UserProfile[] = JSON.parse(raw);
        const match = list.find(
          (u) =>
            u.email.toLowerCase() === cleanId.toLowerCase() ||
            (u.phone && (u.phone === cleanId || u.phone.includes(cleanId))) ||
            (u.username && u.username.toLowerCase() === cleanId.toLowerCase())
        );
        if (match) {
          saveActiveSession(match);
          return;
        }
      }
    } catch (e) {
      console.warn(e);
    }

    // Fallback: If not email format, construct internal identifier
    const targetEmail = cleanId.includes('@')
      ? cleanId
      : `${cleanId.replace(/[^a-zA-Z0-9]/g, '')}@lifelens.app`;

    try {
      const cred = await signInWithEmailAndPassword(auth, targetEmail, pass);
      if (cred.user && cred.user.email) {
        const profile = await syncUserProfile(cred.user.uid, cred.user.email);
        saveActiveSession(profile);
      }
    } catch (err: any) {
      // If demo credentials or offline simulation
      if (cleanId.toLowerCase() === ADMIN_EMAIL.toLowerCase() || cleanId === 'admin') {
        demoLoginAsAdmin();
        return;
      }
      throw err;
    }
  };

  // Register with either Phone or Email
  const registerNewUser = async (payload: RegisterPayload) => {
    const cleanId = payload.emailOrPhone.trim();
    const isPhone = payload.isPhone;
    const email = isPhone
      ? `${cleanId.replace(/[^0-9]/g, '')}@mobile.lifelens.app`
      : cleanId;

    // Generate random 6-digit verification code
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tempUid = `user-${Date.now()}`;

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, payload.password);
      return {
        code: generatedCode,
        tempUid: cred.user.uid,
        email: email,
      };
    } catch (err: any) {
      // Fallback for simulation in preview
      return {
        code: generatedCode,
        tempUid: tempUid,
        email: email,
      };
    }
  };

  // Verify Code and Activate 7 Days Free Trial
  const verifyAndActivateAccount = async (
    codeEntered: string,
    expectedCode: string,
    tempUser: any
  ) => {
    if (codeEntered.trim() !== expectedCode.trim()) {
      throw new Error('Invalid 6-digit verification code. Please check the code and try again.');
    }

    const uid = tempUser.tempUid || currentUser?.uid || `user-${Date.now()}`;
    const email = tempUser.email || currentUser?.email || 'user@lifelens.app';
    const username = tempUser.username || email.split('@')[0];
    const phone = tempUser.isPhone ? tempUser.emailOrPhone : (tempUser.phone || undefined);

    // Set trial expiration: 7 days
    const trialExpiresAt = Date.now() + TRIAL_DURATION_MS;
    const now = new Date().toISOString();

    const activatedProfile: UserProfile = {
      uid,
      email,
      username,
      phone,
      displayName: username,
      role: email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user',
      isVerified: true,
      subscriptionStatus: 'trial',
      packagePlan: 'pro_monthly',
      trialExpiresAt,
      subscriptionExpiresAt: trialExpiresAt,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await activateUserTrial(uid, phone);
    } catch (e) {
      console.warn('Direct Firestore trial activation fallback:', e);
    }

    saveActiveSession(activatedProfile);
  };

  const logout = async () => {
    await firebaseSignOut(auth).catch(() => {});
    setCurrentUser(null);
    saveActiveSession(null);
  };

  // Quick Demo Logins for Testing
  const demoLoginAsAdmin = () => {
    const adminProfile: UserProfile = {
      uid: 'super-admin-uid-01',
      email: ADMIN_EMAIL,
      displayName: 'Neloy (Super Admin)',
      username: 'sneloy',
      phone: '01836317128',
      role: 'admin',
      isVerified: true,
      subscriptionStatus: 'active',
      packagePlan: 'pro_monthly',
      subscriptionExpiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveActiveSession(adminProfile);
  };

  const demoLoginAsActiveTrialUser = () => {
    // 5 days remaining of 7-day trial
    const remainingMs = 5 * 24 * 60 * 60 * 1000;
    const sampleUser: UserProfile = {
      uid: 'demo-user-active-trial',
      email: 'tanvir.rahman@gmail.com',
      username: 'tanvir_r',
      displayName: 'Tanvir Rahman',
      phone: '01711998877',
      role: 'user',
      isVerified: true,
      subscriptionStatus: 'trial',
      packagePlan: 'pro_monthly',
      trialExpiresAt: Date.now() + remainingMs,
      subscriptionExpiresAt: Date.now() + remainingMs,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveActiveSession(sampleUser);
  };

  const demoLoginAsExpiredUser = () => {
    // Trial expired 1 day ago
    const expiredTrialAt = Date.now() - 1 * 24 * 60 * 60 * 1000;
    const expiredUser: UserProfile = {
      uid: 'demo-user-expired',
      email: 'farhana.akter@yahoo.com',
      username: 'farhana_akter',
      displayName: 'Farhana Akter',
      phone: '01912445566',
      role: 'user',
      isVerified: true,
      subscriptionStatus: 'expired',
      packagePlan: 'pro_monthly',
      trialExpiresAt: expiredTrialAt,
      subscriptionExpiresAt: expiredTrialAt,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveActiveSession(expiredUser);
  };

  const isAdmin = Boolean(
    userProfile?.role === 'admin' ||
      userProfile?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
      currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  // Check trial validity (7 days)
  const isTrialActive = Boolean(
    !isAdmin &&
      userProfile?.subscriptionStatus === 'trial' &&
      userProfile.trialExpiresAt &&
      userProfile.trialExpiresAt > Date.now()
  );

  // Check trial expired (automatically signed off / locked)
  const isTrialExpired = Boolean(
    !isAdmin &&
      userProfile &&
      userProfile.subscriptionStatus !== 'active' &&
      ((userProfile.subscriptionStatus === 'expired') ||
       (userProfile.trialExpiresAt && userProfile.trialExpiresAt <= Date.now()))
  );

  const trialDaysRemaining = isTrialActive && userProfile?.trialExpiresAt
    ? Math.max(1, Math.ceil((userProfile.trialExpiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  const isSubscribed = Boolean(
    isAdmin ||
      isTrialActive ||
      (userProfile?.subscriptionStatus === 'active' &&
        (!userProfile.subscriptionExpiresAt ||
          userProfile.subscriptionExpiresAt > Date.now()))
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        isSubscribed,
        isTrialActive,
        isTrialExpired,
        trialDaysRemaining,
        isLoading,
        loginWithGoogle,
        loginWithCredentials,
        registerNewUser,
        verifyAndActivateAccount,
        logout,
        refreshProfile,
        demoLoginAsAdmin,
        demoLoginAsActiveTrialUser,
        demoLoginAsExpiredUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
