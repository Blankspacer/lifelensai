export type DocumentCategory = 'bill' | 'label' | 'document' | 'message' | 'instruction' | 'other';

export type LanguageCode = 'en' | 'bn' | 'es' | 'ja';

export interface KeyDetail {
  label: string;
  value: string;
  badge?: string;
  isHighlighted?: boolean;
}

export interface ConcernFlag {
  severity: 'high' | 'medium' | 'low' | 'info';
  title: string;
  explanation: string;
  advice: string;
}

export interface NextStep {
  stepNumber: number;
  action: string;
  deadline?: string | null;
  importance: 'critical' | 'recommended' | 'optional';
  completed?: boolean;
}

export interface ScanAnalysis {
  category: DocumentCategory;
  categoryLabel: string;
  documentTitle: string;
  oneSentenceSummary: string;
  whatItMeans: string;
  keyDetails: KeyDetail[];
  concernsAndFlags: ConcernFlag[];
  nextSteps: NextStep[];
  extractedText: string;
  verificationNotice: string;
  suggestedFollowUps: string[];
  disputeLetterTemplate?: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ScanRecord {
  id: string;
  timestamp: number;
  thumbnail: string;
  targetLanguage: LanguageCode;
  analysis: ScanAnalysis;
  userNotes?: string;
  chatHistory: ChatMessage[];
}

export interface SampleDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  tagline: string;
  badge: string;
  thumbnail: string;
  dataUrl: string;
  userNotes?: string;
}

// --- SAAS SUBSCRIPTION & USER TYPES ---
export type UserRole = 'user' | 'admin';

export type SubscriptionStatus = 'free' | 'trial' | 'pending' | 'active' | 'expired';

export type PackagePlanId = 'free' | 'trial' | 'pro_monthly' | 'family_monthly';

export type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'upay' | 'cash';

export interface UserProfile {
  uid: string;
  email: string;
  username?: string;
  phone?: string;
  displayName?: string;
  role: UserRole;
  isVerified?: boolean;
  verificationCode?: string;
  subscriptionStatus: SubscriptionStatus;
  packagePlan: PackagePlanId;
  trialExpiresAt?: number | null;
  subscriptionExpiresAt?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionRequest {
  id?: string;
  requestId: string;
  userId: string;
  userEmail: string;
  packagePlan: 'pro_monthly' | 'family_monthly';
  packageName: string;
  amountBDT: number;
  paymentMethod: PaymentMethod;
  senderPhone: string;
  trxId: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: number;
  createdAt: string;
}
