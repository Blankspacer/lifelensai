import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  UserProfile,
  SubscriptionRequest,
  PackagePlanId,
  PaymentMethod,
} from '../types';

export const ADMIN_EMAIL = 'sneloy@gmail.com';
export const MONTHLY_PACKAGE_PRICE_BDT = 1200; // BDT 1200 taka / month
export const MFS_PAYMENT_NUMBER = '01836317128'; // Nagad/bKash/Upay Personal Number
export const TRIAL_DAYS = 7; // 7 Days Free Trial
export const TRIAL_DURATION_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

const LOCAL_USERS_KEY = 'lifelens_registered_users_cache';
const LOCAL_REQUESTS_KEY = 'lifelens_subscription_requests_cache';

// Helper to save user in local cache for offline/instant admin directory access
function cacheUserLocally(user: UserProfile) {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    let list: UserProfile[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((u) => u.uid === user.uid || u.email.toLowerCase() === user.email.toLowerCase());
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...user };
    } else {
      list.push(user);
    }
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage cache user error:', e);
  }
}

// Helper to save request locally
function cacheRequestLocally(req: SubscriptionRequest) {
  try {
    const raw = localStorage.getItem(LOCAL_REQUESTS_KEY);
    let list: SubscriptionRequest[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((r) => r.requestId === req.requestId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...req };
    } else {
      list.unshift(req);
    }
    localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage cache request error:', e);
  }
}

/**
 * Creates or gets existing user profile in Firestore + local cache
 */
export async function syncUserProfile(
  uid: string,
  email: string,
  displayName?: string,
  username?: string,
  phone?: string
): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', uid);
  const now = new Date().toISOString();
  const isAdminUser = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  try {
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      // If user is admin email, ensure role is admin
      if (isAdminUser && data.role !== 'admin') {
        await updateDoc(userDocRef, { role: 'admin', updatedAt: now });
        const updated = { ...data, role: 'admin' as const };
        cacheUserLocally(updated);
        return updated;
      }
      if (phone && !data.phone) {
        await updateDoc(userDocRef, { phone, updatedAt: now });
        data.phone = phone;
      }
      cacheUserLocally(data);
      return data;
    } else {
      const newProfile: UserProfile = {
        uid,
        email,
        username: username || email.split('@')[0],
        phone: phone || undefined,
        displayName: displayName || username || email.split('@')[0],
        role: isAdminUser ? 'admin' : 'user',
        isVerified: isAdminUser,
        subscriptionStatus: isAdminUser ? 'active' : 'trial',
        packagePlan: isAdminUser ? 'pro_monthly' : 'pro_monthly',
        subscriptionExpiresAt: isAdminUser
          ? Date.now() + 365 * 24 * 60 * 60 * 1000
          : Date.now() + TRIAL_DURATION_MS,
        trialExpiresAt: isAdminUser ? null : Date.now() + TRIAL_DURATION_MS,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(userDocRef, newProfile);
      cacheUserLocally(newProfile);

      // If admin, also write to /admins collection
      if (isAdminUser) {
        try {
          await setDoc(doc(db, 'admins', uid), {
            email,
            role: 'super_admin',
            updatedAt: now,
          });
        } catch (e) {
          console.warn('Admin record write notice:', e);
        }
      }

      return newProfile;
    }
  } catch (error) {
    // If Firestore is offline or fails, check local cache or fallback
    console.warn('Firestore sync fallback:', error);
    const fallbackProfile: UserProfile = {
      uid,
      email,
      username: username || email.split('@')[0],
      phone: phone || undefined,
      displayName: displayName || username || email.split('@')[0],
      role: isAdminUser ? 'admin' : 'user',
      isVerified: true,
      subscriptionStatus: isAdminUser ? 'active' : 'trial',
      packagePlan: 'pro_monthly',
      subscriptionExpiresAt: isAdminUser
        ? Date.now() + 365 * 24 * 60 * 60 * 1000
        : Date.now() + TRIAL_DURATION_MS,
      trialExpiresAt: isAdminUser ? null : Date.now() + TRIAL_DURATION_MS,
      createdAt: now,
      updatedAt: now,
    };
    cacheUserLocally(fallbackProfile);
    return fallbackProfile;
  }
}

/**
 * Activates 7 Days Free Trial upon OTP/Verification Code completion
 */
export async function activateUserTrial(uid: string, phone?: string): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', uid);
  const now = new Date().toISOString();
  const trialExpiresAt = Date.now() + TRIAL_DURATION_MS;

  try {
    const updateData: any = {
      isVerified: true,
      subscriptionStatus: 'trial',
      packagePlan: 'pro_monthly',
      trialExpiresAt: trialExpiresAt,
      subscriptionExpiresAt: trialExpiresAt,
      updatedAt: now,
    };
    if (phone) updateData.phone = phone;

    await updateDoc(userDocRef, updateData);

    const snap = await getDoc(userDocRef);
    const updated = snap.data() as UserProfile;
    cacheUserLocally(updated);
    return updated;
  } catch (error) {
    console.warn('activateUserTrial firestore fallback:', error);
    const existing = (function() {
      try {
        const raw = localStorage.getItem(LOCAL_USERS_KEY);
        const list: UserProfile[] = raw ? JSON.parse(raw) : [];
        return list.find((u) => u.uid === uid);
      } catch {
        return null;
      }
    })();

    const updated: UserProfile = {
      uid,
      email: existing?.email || 'user@lifelens.app',
      username: existing?.username || 'user',
      phone: phone || existing?.phone,
      displayName: existing?.displayName || 'User',
      role: 'user',
      isVerified: true,
      subscriptionStatus: 'trial',
      packagePlan: 'pro_monthly',
      trialExpiresAt: trialExpiresAt,
      subscriptionExpiresAt: trialExpiresAt,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    cacheUserLocally(updated);
    return updated;
  }
}

/**
 * Submits a new subscription payment verification request (bKash, Nagad, Upay, Rocket, Cash)
 * All MFS payments are directed to 01836317128 (Personal)
 */
export async function submitSubscriptionRequest(
  userId: string,
  userEmail: string,
  packagePlan: 'pro_monthly' | 'family_monthly',
  packageName: string,
  amountBDT: number,
  paymentMethod: PaymentMethod,
  senderPhone: string,
  trxId: string
): Promise<SubscriptionRequest> {
  const requestId = `subreq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const requestData: SubscriptionRequest = {
    requestId,
    userId,
    userEmail,
    packagePlan,
    packageName,
    amountBDT,
    paymentMethod,
    senderPhone,
    trxId: trxId.trim().toUpperCase(),
    status: 'pending',
    createdAt: now,
  };

  cacheRequestLocally(requestData);

  const reqDocRef = doc(db, 'subscription_requests', requestId);
  const userDocRef = doc(db, 'users', userId);

  try {
    await setDoc(reqDocRef, requestData);

    // Update user status to pending
    await updateDoc(userDocRef, {
      subscriptionStatus: 'pending',
      phone: senderPhone,
      updatedAt: now,
    });

    return requestData;
  } catch (error) {
    console.warn('submitSubscriptionRequest fallback to local:', error);
    return requestData;
  }
}

/**
 * Admin: Approves a subscription request and extends user package by 30 days
 */
export async function approveSubscription(
  requestId: string,
  userId: string,
  packagePlan: 'pro_monthly' | 'family_monthly',
  adminEmail: string
): Promise<void> {
  const reqDocRef = doc(db, 'subscription_requests', requestId);
  const userDocRef = doc(db, 'users', userId);
  const now = new Date().toISOString();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  // Update local cache
  try {
    const raw = localStorage.getItem(LOCAL_REQUESTS_KEY);
    if (raw) {
      const list: SubscriptionRequest[] = JSON.parse(raw);
      const req = list.find((r) => r.requestId === requestId);
      if (req) {
        req.status = 'approved';
        req.approvedBy = adminEmail;
        req.approvedAt = Date.now();
        localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(list));
      }
    }
  } catch (e) {
    console.warn(e);
  }

  try {
    // 1. Update request status in Firestore
    await updateDoc(reqDocRef, {
      status: 'approved',
      approvedBy: adminEmail,
      approvedAt: Date.now(),
    });

    // 2. Calculate new expiration
    const userSnap = await getDoc(userDocRef);
    let expiresAt = Date.now() + thirtyDaysMs;

    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      if (
        userData.subscriptionExpiresAt &&
        userData.subscriptionExpiresAt > Date.now()
      ) {
        expiresAt = userData.subscriptionExpiresAt + thirtyDaysMs;
      }
    }

    // 3. Activate user subscription
    await updateDoc(userDocRef, {
      subscriptionStatus: 'active',
      packagePlan: packagePlan,
      subscriptionExpiresAt: expiresAt,
      updatedAt: now,
    });
  } catch (error) {
    console.warn('approveSubscription Firestore error:', error);
  }

  // Also update user in local cache
  try {
    const uRaw = localStorage.getItem(LOCAL_USERS_KEY);
    if (uRaw) {
      const uList: UserProfile[] = JSON.parse(uRaw);
      const user = uList.find((u) => u.uid === userId);
      if (user) {
        user.subscriptionStatus = 'active';
        user.packagePlan = packagePlan;
        user.subscriptionExpiresAt = (user.subscriptionExpiresAt && user.subscriptionExpiresAt > Date.now())
          ? user.subscriptionExpiresAt + thirtyDaysMs
          : Date.now() + thirtyDaysMs;
        user.updatedAt = now;
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(uList));
      }
    }
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Admin: Rejects a subscription payment request
 */
export async function rejectSubscription(
  requestId: string,
  userId: string,
  adminNotes?: string
): Promise<void> {
  const reqDocRef = doc(db, 'subscription_requests', requestId);
  const userDocRef = doc(db, 'users', userId);
  const now = new Date().toISOString();

  // Update local cache
  try {
    const raw = localStorage.getItem(LOCAL_REQUESTS_KEY);
    if (raw) {
      const list: SubscriptionRequest[] = JSON.parse(raw);
      const req = list.find((r) => r.requestId === requestId);
      if (req) {
        req.status = 'rejected';
        req.adminNotes = adminNotes || 'Payment verification failed.';
        localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(list));
      }
    }
  } catch (e) {
    console.warn(e);
  }

  try {
    await updateDoc(reqDocRef, {
      status: 'rejected',
      adminNotes: adminNotes || 'Payment verification failed or invalid TrxID.',
    });

    // Revert user to free / trial
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      if (userData.subscriptionStatus === 'pending') {
        const hasValidTrial =
          userData.trialExpiresAt && userData.trialExpiresAt > Date.now();
        await updateDoc(userDocRef, {
          subscriptionStatus: hasValidTrial ? 'trial' : 'expired',
          updatedAt: now,
        });
      }
    }
  } catch (error) {
    console.warn('rejectSubscription Firestore error:', error);
  }
}

/**
 * Admin: Directly activates or extends package for any user email (ideal for Cash or manual handling)
 */
export async function adminManualActivate(
  userEmailOrPhone: string,
  packagePlan: 'pro_monthly' | 'family_monthly',
  monthsCount: number = 1
): Promise<boolean> {
  const cleanTarget = userEmailOrPhone.trim().toLowerCase();
  const addedDurationMs = monthsCount * 30 * 24 * 60 * 60 * 1000;
  const now = new Date().toISOString();

  // Update in local cache first
  let foundInCache = false;
  try {
    const uRaw = localStorage.getItem(LOCAL_USERS_KEY);
    if (uRaw) {
      const uList: UserProfile[] = JSON.parse(uRaw);
      const user = uList.find(
        (u) =>
          u.email.toLowerCase() === cleanTarget ||
          (u.phone && u.phone.includes(cleanTarget))
      );
      if (user) {
        foundInCache = true;
        user.subscriptionStatus = 'active';
        user.packagePlan = packagePlan;
        user.subscriptionExpiresAt =
          user.subscriptionExpiresAt && user.subscriptionExpiresAt > Date.now()
            ? user.subscriptionExpiresAt + addedDurationMs
            : Date.now() + addedDurationMs;
        user.updatedAt = now;
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(uList));
      }
    }
  } catch (e) {
    console.warn(e);
  }

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', cleanTarget));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const userDoc = snap.docs[0];
      const userData = userDoc.data() as UserProfile;
      let expiresAt = Date.now() + addedDurationMs;

      if (
        userData.subscriptionExpiresAt &&
        userData.subscriptionExpiresAt > Date.now()
      ) {
        expiresAt = userData.subscriptionExpiresAt + addedDurationMs;
      }

      await updateDoc(doc(db, 'users', userDoc.id), {
        subscriptionStatus: 'active',
        packagePlan,
        subscriptionExpiresAt: expiresAt,
        updatedAt: now,
      });

      return true;
    }
    return foundInCache;
  } catch (error) {
    console.warn('adminManualActivate fallback:', error);
    return foundInCache;
  }
}

/**
 * Admin: Extends or grants 7 days free trial
 */
export async function adminExtendTrial(userId: string, days: number = 7): Promise<boolean> {
  const addedMs = days * 24 * 60 * 60 * 1000;
  const now = new Date().toISOString();

  try {
    const uRef = doc(db, 'users', userId);
    const snap = await getDoc(uRef);
    let newExpires = Date.now() + addedMs;
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      if (data.trialExpiresAt && data.trialExpiresAt > Date.now()) {
        newExpires = data.trialExpiresAt + addedMs;
      }
    }
    await updateDoc(uRef, {
      trialExpiresAt: newExpires,
      subscriptionStatus: 'trial',
      updatedAt: now,
    });
  } catch (e) {
    console.warn('adminExtendTrial Firestore:', e);
  }

  // Update local
  try {
    const uRaw = localStorage.getItem(LOCAL_USERS_KEY);
    if (uRaw) {
      const uList: UserProfile[] = JSON.parse(uRaw);
      const user = uList.find((u) => u.uid === userId);
      if (user) {
        user.trialExpiresAt = Date.now() + addedMs;
        user.subscriptionStatus = 'trial';
        user.updatedAt = now;
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(uList));
      }
    }
  } catch (e) {
    console.warn(e);
  }

  return true;
}

/**
 * Fetches all subscription requests for Admin (merging Firestore + LocalStorage)
 */
export async function getAllSubscriptionRequests(): Promise<SubscriptionRequest[]> {
  const map = new Map<string, SubscriptionRequest>();

  // 1. From Local Cache
  try {
    const raw = localStorage.getItem(LOCAL_REQUESTS_KEY);
    if (raw) {
      const list: SubscriptionRequest[] = JSON.parse(raw);
      list.forEach((r) => map.set(r.requestId, r));
    }
  } catch (e) {
    console.warn(e);
  }

  // 2. From Firestore
  try {
    const requestsRef = collection(db, 'subscription_requests');
    const snap = await getDocs(requestsRef);
    snap.forEach((d) => {
      const item = { ...(d.data() as SubscriptionRequest), id: d.id };
      map.set(item.requestId, item);
    });
  } catch (error) {
    console.warn('getAllSubscriptionRequests firestore fallback to cache');
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Fetches all registered users for Admin (merging Firestore + LocalStorage cache)
 * Ensures Admin can view all users' emails and phone numbers!
 */
export async function getAllRegisteredUsers(): Promise<UserProfile[]> {
  const map = new Map<string, UserProfile>();

  // Default seed sample users if none exist yet, ensuring demo visibility
  const seedUsers: UserProfile[] = [
    {
      uid: 'user-sample-01',
      email: 'sneloy@gmail.com',
      username: 'sneloy',
      displayName: 'Neloy (Super Admin)',
      phone: '01836317128',
      role: 'admin',
      isVerified: true,
      subscriptionStatus: 'active',
      packagePlan: 'pro_monthly',
      subscriptionExpiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'user-sample-02',
      email: 'tanvir.rahman@gmail.com',
      username: 'tanvir_r',
      displayName: 'Tanvir Rahman',
      phone: '01711998877',
      role: 'user',
      isVerified: true,
      subscriptionStatus: 'trial',
      packagePlan: 'pro_monthly',
      trialExpiresAt: Date.now() + 4 * 24 * 60 * 60 * 1000,
      subscriptionExpiresAt: Date.now() + 4 * 24 * 60 * 60 * 1000,
      createdAt: '2026-03-24T12:00:00.000Z',
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'user-sample-03',
      email: 'farhana.akter@yahoo.com',
      username: 'farhana_akter',
      displayName: 'Farhana Akter',
      phone: '01912445566',
      role: 'user',
      isVerified: true,
      subscriptionStatus: 'expired',
      packagePlan: 'pro_monthly',
      trialExpiresAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // Expired trial
      subscriptionExpiresAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      createdAt: '2026-03-18T09:30:00.000Z',
      updatedAt: new Date().toISOString(),
    },
  ];

  seedUsers.forEach((u) => map.set(u.uid, u));

  // 1. From local cache
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      const list: UserProfile[] = JSON.parse(raw);
      list.forEach((u) => map.set(u.uid, u));
    }
  } catch (e) {
    console.warn(e);
  }

  // 2. From Firestore
  try {
    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);
    snap.forEach((d) => {
      const u = d.data() as UserProfile;
      map.set(u.uid, u);
    });
  } catch (error) {
    console.warn('getAllRegisteredUsers firestore fallback to cache');
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
