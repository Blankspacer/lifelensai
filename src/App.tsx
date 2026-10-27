import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CameraCapture } from './components/CameraCapture';
import { AnalysisView } from './components/AnalysisView';
import { ScanHistoryModal } from './components/ScanHistoryModal';
import { PricingModal } from './components/PricingModal';
import { AndroidAuthScreen } from './components/AndroidAuthScreen';
import { MfsPaymentModal } from './components/MfsPaymentModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { ThreeDSceneView } from './components/ThreeDSceneView';
import {
  ScanAnalysis,
  LanguageCode,
  ChatMessage,
  ScanRecord,
} from './types';
import { analyzeScanAPI } from './services/apiService';
import {
  getScanHistory,
  saveScanRecord,
  deleteScanRecord,
  clearAllHistory,
  updateScanRecord,
  getDailyScanCount,
  getDailyLimit,
} from './services/storageService';
import { useAuth } from './context/AuthContext';
import { MONTHLY_PACKAGE_PRICE_BDT } from './services/subscriptionService';
import { AlertCircle, RefreshCw, Sparkles, Shield, Camera, Crown, Gift, Box } from 'lucide-react';

export default function App() {
  const { userProfile, isAdmin, isSubscribed, isTrialActive, trialDaysRemaining } = useAuth();

  const [currentView, setCurrentView] = useState<'capture' | 'analysis' | '3d'>('capture');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ScanAnalysis | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);
  const [isAndroidAuthOpen, setIsAndroidAuthOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // Load history on mount
  useEffect(() => {
    setScanHistory(getScanHistory());
  }, []);

  // Handle Analyzing a new scan
  const handleAnalyze = async (imageDataUrl: string, userNotes?: string) => {
    // Check quota for free users (active trial or subscriber gets unlimited)
    if (!isSubscribed) {
      const dailyCount = getDailyScanCount();
      const dailyLimit = getDailyLimit();
      if (dailyCount >= dailyLimit) {
        setIsPricingOpen(true);
        setError(
          `You have used your ${dailyLimit} free scans for today. Activate your 10-Day Free Trial (or pay BDT ${MONTHLY_PACKAGE_PRICE_BDT}/mo via bKash, Nagad, Rocket, Upay or Cash) for unlimited scans!`
        );
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setSelectedImage(imageDataUrl);
    setChatHistory([]);

    try {
      setLoadingStep('Transcribing text and examining visual layout...');
      const timer1 = setTimeout(() => {
        setLoadingStep('Identifying fine print, hidden fees, and critical conditions...');
      }, 1400);

      const timer2 = setTimeout(() => {
        setLoadingStep('Translating technical jargon into simple, actionable steps...');
      }, 2800);

      const result = await analyzeScanAPI(imageDataUrl, currentLanguage, userNotes);
      clearTimeout(timer1);
      clearTimeout(timer2);

      setAnalysis(result);
      setCurrentView('analysis');

      // Create new record
      const recordId = `scan-${Date.now()}`;
      const newRecord: ScanRecord = {
        id: recordId,
        timestamp: Date.now(),
        thumbnail: imageDataUrl,
        targetLanguage: currentLanguage,
        analysis: result,
        userNotes,
        chatHistory: [],
      };

      setActiveRecordId(recordId);
      saveScanRecord(newRecord);
      setScanHistory(getScanHistory());
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to analyze this document. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Re-analyze when switching language
  const handleReAnalyzeWithLanguage = async (newLang: LanguageCode) => {
    if (!selectedImage) return;
    setIsReanalyzing(true);
    try {
      const result = await analyzeScanAPI(selectedImage, newLang);
      setAnalysis(result);

      if (activeRecordId) {
        const history = getScanHistory();
        const existing = history.find((r) => r.id === activeRecordId);
        if (existing) {
          const updated: ScanRecord = {
            ...existing,
            targetLanguage: newLang,
            analysis: result,
          };
          updateScanRecord(updated);
          setScanHistory(getScanHistory());
        }
      }
    } catch (err: any) {
      console.warn('Re-analysis error:', err);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleUpdateChatHistory = (newChatHistory: ChatMessage[]) => {
    setChatHistory(newChatHistory);
    if (activeRecordId) {
      const history = getScanHistory();
      const existing = history.find((r) => r.id === activeRecordId);
      if (existing) {
        const updated: ScanRecord = {
          ...existing,
          chatHistory: newChatHistory,
        };
        updateScanRecord(updated);
        setScanHistory(getScanHistory());
      }
    }
  };

  const handleSelectRecord = (record: ScanRecord) => {
    setSelectedImage(record.thumbnail);
    setAnalysis(record.analysis);
    setCurrentLanguage(record.targetLanguage || 'en');
    setChatHistory(record.chatHistory || []);
    setActiveRecordId(record.id);
    setCurrentView('analysis');
    setError(null);
  };

  const handleDeleteRecord = (id: string) => {
    deleteScanRecord(id);
    setScanHistory(getScanHistory());
    if (activeRecordId === id) {
      handleNewScan();
    }
  };

  const handleClearAllHistory = () => {
    if (confirm('Are you sure you want to delete all saved scan history?')) {
      clearAllHistory();
      setScanHistory([]);
      handleNewScan();
      setIsHistoryOpen(false);
    }
  };

  const handleNewScan = () => {
    setCurrentView('capture');
    setSelectedImage(null);
    setAnalysis(null);
    setChatHistory([]);
    setActiveRecordId(null);
    setError(null);
  };

  const handleAskAboutPart = (partName: string, diagnostic: string) => {
    const syntheticAnalysis: ScanAnalysis = {
      category: 'instruction',
      categoryLabel: 'Hardware & Appliance Dissection',
      documentTitle: `3D Spatial AI Inspection: ${partName}`,
      oneSentenceSummary: `Interactive 3D structural analysis and telemetry for ${partName}.`,
      whatItMeans: `You are examining the ${partName} in the LifeLens 3D Spatial Dissector. ${diagnostic}`,
      keyDetails: [
        { label: 'Component Name', value: partName, badge: 'Hardware' },
        { label: 'Telemetry & Status', value: diagnostic, badge: 'Sensors' },
        { label: 'Inspection Mode', value: '3D Spatial Dissector (60 FPS PBR)', badge: 'Diagnostics' },
      ],
      concernsAndFlags: [
        {
          title: 'Mechanical & Thermal Wear Check',
          explanation: 'Check for limescale calcification, contact pitting, thermal fatigue, or pressure leakage on this component.',
          advice: 'Inspect O-rings and electrical connections regularly.',
          severity: 'medium',
        },
      ],
      nextSteps: [
        {
          stepNumber: 1,
          action: `Verify physical condition and sealing of ${partName}`,
          importance: 'critical',
        },
        {
          stepNumber: 2,
          action: 'Follow appliance manufacturer cleaning and descaling protocols',
          importance: 'recommended',
        },
        {
          stepNumber: 3,
          action: 'Ask follow-up troubleshooting questions below in the AI chat',
          importance: 'optional',
        },
      ],
      extractedText: `[3D DISSECTOR TELEMETRY]\nComponent: ${partName}\nDiagnostic: ${diagnostic}`,
      verificationNotice: 'Generated from LifeLens AI 3D spatial engineering models. Verify with your hardware manual or certified technician before performing high-voltage or pressurized repairs.',
      suggestedFollowUps: [
        `How do I replace or repair the ${partName}?`,
        'What symptoms indicate this part is failing?',
        'Can I clean or descale this myself at home?',
      ],
    };

    const svgPlaceholder = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23090d16"/><circle cx="200" cy="200" r="100" stroke="%2338bdf8" stroke-width="6" fill="%230f172a"/><text x="200" y="195" fill="%2338bdf8" font-size="18" font-weight="bold" text-anchor="middle" font-family="sans-serif">3D Part Diagnostic</text><text x="200" y="225" fill="%2394a3b8" font-size="13" text-anchor="middle" font-family="sans-serif">${encodeURIComponent(partName)}</text></svg>`;

    setSelectedImage(svgPlaceholder);
    setAnalysis(syntheticAnalysis);
    setChatHistory([
      {
        id: `chat-${Date.now()}`,
        role: 'assistant',
        content: `I've imported the 3D telemetry for **${partName}** into LifeLens AI:\n\n*${diagnostic}*\n\nAsk me how to disassemble, clean, descale, replace, or troubleshoot this specific component!`,
        timestamp: Date.now(),
      },
    ]);
    setCurrentView('analysis');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        currentLanguage={currentLanguage}
        onLanguageChange={(lang) => {
          setCurrentLanguage(lang);
          if (currentView === 'analysis' && selectedImage) {
            handleReAnalyzeWithLanguage(lang);
          }
        }}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenPayment={() => setIsPaymentModalOpen(true)}
        onOpenAuth={() => setIsAndroidAuthOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpen3DView={() => setCurrentView('3d')}
        is3DActive={currentView === '3d'}
        onNewScan={handleNewScan}
        historyCount={scanHistory.length}
      />

      {/* Trial Active Banner on top if user has active trial */}
      {isTrialActive && (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/40 py-2 px-4 text-center text-xs">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-amber-200">
            <Gift className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>10 Days Free Trial Active!</strong> Enjoy unlimited scans for {trialDaysRemaining} more day(s). After trial, continue for BDT {MONTHLY_PACKAGE_PRICE_BDT} taka/month.
            </span>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="ml-2 text-xs font-bold text-amber-400 hover:text-white underline cursor-pointer"
            >
              Manage Package →
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Error Notification Banner */}
        {error && (
          <div className="max-w-4xl mx-auto px-4 mt-4 w-full">
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="font-semibold block mb-0.5">Notification:</strong>
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-xs text-rose-400 hover:text-white underline font-medium cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/25">
                <RefreshCw className="w-9 h-9 text-white animate-spin" />
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">
                LifeLens AI is Analyzing
              </h3>
              <p className="text-xs sm:text-sm text-cyan-300 font-medium mb-4 h-10 flex items-center justify-center">
                {loadingStep || 'Inspecting document details...'}
              </p>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 w-2/3 animate-[pulse_1.5s_ease-in-out_infinite]" />
              </div>
              <p className="text-[11px] text-slate-400 mt-4">
                Powered by multimodal Gemini vision reasoning
              </p>
            </div>
          </div>
        )}

        {/* Dynamic View rendering */}
        {currentView === '3d' ? (
          <ThreeDSceneView
            onBackToScanner={() => setCurrentView('capture')}
            onAskAboutPart={handleAskAboutPart}
          />
        ) : currentView === 'capture' || !analysis || !selectedImage ? (
          <CameraCapture
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            selectedLanguage={currentLanguage}
            onOpen3D={() => setCurrentView('3d')}
          />
        ) : (
          <AnalysisView
            imageDataUrl={selectedImage}
            analysis={analysis}
            currentLanguage={currentLanguage}
            onLanguageChange={setCurrentLanguage}
            onReAnalyzeWithLanguage={handleReAnalyzeWithLanguage}
            onNewScan={handleNewScan}
            chatHistory={chatHistory}
            onUpdateChatHistory={handleUpdateChatHistory}
            isReanalyzing={isReanalyzing}
            onOpen3DDissector={() => setCurrentView('3d')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">LifeLens AI</span>
            <span>—</span>
            <span>Android App • 10 Days Free Trial • BDT {MONTHLY_PACKAGE_PRICE_BDT} taka/month</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setIsAndroidAuthOpen(true)} className="hover:text-cyan-400 text-cyan-300 font-medium cursor-pointer">
              Android Login / Sign Up
            </button>
            <button onClick={() => setIsPricingOpen(true)} className="hover:text-slate-200 cursor-pointer">
              Pricing Plans
            </button>
            <button onClick={() => setIsPaymentModalOpen(true)} className="hover:text-cyan-400 text-slate-300 cursor-pointer">
              Pay with MFS (৳{MONTHLY_PACKAGE_PRICE_BDT})
            </button>
            <button onClick={() => setIsHistoryOpen(true)} className="hover:text-slate-200 cursor-pointer">
              Saved Scans
            </button>
            {isAdmin && (
              <button onClick={() => setIsAdminModalOpen(true)} className="text-amber-400 font-semibold hover:underline cursor-pointer">
                Admin Panel
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ScanHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={scanHistory}
        onSelectRecord={handleSelectRecord}
        onDeleteRecord={handleDeleteRecord}
        onClearAll={handleClearAllHistory}
      />

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        onOpenPayment={() => {
          setIsPricingOpen(false);
          setIsPaymentModalOpen(true);
        }}
        onOpenAuth={() => {
          setIsPricingOpen(false);
          setIsAndroidAuthOpen(true);
        }}
      />

      {/* Android Login, Registration & OTP Verification Modal */}
      <AndroidAuthScreen
        isOpen={isAndroidAuthOpen}
        onClose={() => setIsAndroidAuthOpen(false)}
      />

      {/* MFS Payment Checkout Modal */}
      <MfsPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onOpenAuth={() => {
          setIsPaymentModalOpen(false);
          setIsAndroidAuthOpen(true);
        }}
      />

      {/* Admin Verification & Activation Panel */}
      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </div>
  );
}
