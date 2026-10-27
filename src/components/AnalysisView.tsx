import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckSquare,
  Square,
  Calendar,
  Volume2,
  Copy,
  Check,
  ArrowLeft,
  FileText,
  Mail,
  ShieldAlert,
  MessageSquare,
  ChevronRight,
  Maximize2,
  Loader2,
  Download,
  FileDown,
  Printer,
  Share2,
  Box,
} from 'lucide-react';
import { ScanAnalysis, LanguageCode, ChatMessage } from '../types';
import { speakTextAPI, downloadCalendarEvent } from '../services/apiService';
import { exportAsPDF, exportAsTextFile } from '../services/exportService';
import { DocumentChat } from './DocumentChat';
import { DisputeModal } from './DisputeModal';

interface AnalysisViewProps {
  imageDataUrl: string;
  analysis: ScanAnalysis;
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onReAnalyzeWithLanguage: (lang: LanguageCode) => void;
  onNewScan: () => void;
  chatHistory: ChatMessage[];
  onUpdateChatHistory: (messages: ChatMessage[]) => void;
  isReanalyzing?: boolean;
  onOpen3DDissector?: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  imageDataUrl,
  analysis,
  currentLanguage,
  onLanguageChange,
  onReAnalyzeWithLanguage,
  onNewScan,
  chatHistory,
  onUpdateChatHistory,
  isReanalyzing = false,
  onOpen3DDissector,
}) => {
  const [activeTab, setActiveTab] = useState<'understand' | 'chat' | 'ocr'>('understand');
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [copiedOCR, setCopiedOCR] = useState<boolean>(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState<boolean>(false);
  const [isImageExpanded, setIsImageExpanded] = useState<boolean>(false);

  // Export states
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);
  const [textSuccess, setTextSuccess] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);

  // Toggle checklist items
  const toggleStep = (stepNumber: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  // Text to Speech handle
  const handleListen = async () => {
    if (isSpeaking) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    const speechText = `${analysis.documentTitle}. ${analysis.oneSentenceSummary}. ${analysis.whatItMeans}`;
    try {
      await speakTextAPI(speechText, currentLanguage);
    } finally {
      setTimeout(() => setIsSpeaking(false), 4000);
    }
  };

  // Export as PDF
  const handleExportPDF = () => {
    setIsExportingPDF(true);
    try {
      exportAsPDF(analysis, imageDataUrl, checkedSteps);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Could not generate PDF. You can also export as a Text File.');
    } finally {
      setIsExportingPDF(false);
      setIsExportMenuOpen(false);
    }
  };

  // Export as Text File
  const handleExportText = () => {
    try {
      exportAsTextFile(analysis, checkedSteps);
      setTextSuccess(true);
      setTimeout(() => setTextSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export text file:', err);
    } finally {
      setIsExportMenuOpen(false);
    }
  };

  // Add due date to calendar
  const handleAddToCalendar = () => {
    const dateDetail = analysis.keyDetails.find(
      (d) =>
        d.label.toLowerCase().includes('due') ||
        d.label.toLowerCase().includes('date') ||
        d.label.toLowerCase().includes('deadline') ||
        d.label.toLowerCase().includes('notice')
    );
    const deadlineStr = dateDetail ? dateDetail.value : null;

    downloadCalendarEvent(
      analysis.documentTitle,
      `LifeLens Action: ${analysis.oneSentenceSummary}\n\nChecklist:\n${analysis.nextSteps
        .map((s) => `${s.stepNumber}. ${s.action}`)
        .join('\n')}`,
      deadlineStr
    );
  };

  // Copy structured summary
  const handleCopySummary = () => {
    const text = `=== LifeLens AI Analysis ===
Document: ${analysis.documentTitle} (${analysis.categoryLabel})

Summary:
${analysis.oneSentenceSummary}

What it means:
${analysis.whatItMeans}

Key Figures & Details:
${analysis.keyDetails.map((k) => `- ${k.label}: ${k.value}`).join('\n')}

Potential Concerns:
${analysis.concernsAndFlags.map((c) => `[${c.severity.toUpperCase()}] ${c.title}: ${c.explanation}`).join('\n')}

Action Checklist:
${analysis.nextSteps.map((s) => `[ ] ${s.action} ${s.deadline ? `(Due: ${s.deadline})` : ''}`).join('\n')}

Verification Notice:
${analysis.verificationNotice}`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Category Colors
  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'bill':
        return { badge: 'bg-amber-950/80 text-amber-300 border-amber-800', icon: '⚡' };
      case 'label':
        return { badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800', icon: '🥗' };
      case 'document':
        return { badge: 'bg-sky-950/80 text-sky-300 border-sky-800', icon: '🏢' };
      case 'message':
        return { badge: 'bg-rose-950/80 text-rose-300 border-rose-800', icon: '⚠️' };
      case 'instruction':
        return { badge: 'bg-purple-950/80 text-purple-300 border-purple-800', icon: '☕' };
      default:
        return { badge: 'bg-slate-800 text-slate-300 border-slate-700', icon: '📄' };
    }
  };

  const theme = getCategoryTheme(analysis.category);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8">
      {/* Top Nav Action Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={onNewScan}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Scan Another Item</span>
          </button>

          {/* Quick Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950 to-indigo-950 hover:bg-slate-800 text-xs font-semibold text-cyan-300 border border-cyan-800/60 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Record ▾</span>
            </button>

            {isExportMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl py-1.5 z-30 animate-in fade-in duration-100">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Export Personal Records
                </div>
                <button
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 text-left transition-colors"
                >
                  <span className="p-1 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                    PDF
                  </span>
                  <div>
                    <div className="font-semibold">Export as PDF Document</div>
                    <div className="text-[10px] text-slate-400">Formatted report with sections</div>
                  </div>
                </button>
                <button
                  onClick={handleExportText}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 text-left transition-colors"
                >
                  <span className="p-1 rounded bg-sky-500/20 text-sky-400 font-bold text-[10px]">
                    TXT
                  </span>
                  <div>
                    <div className="font-semibold">Export as Text File (.txt)</div>
                    <div className="text-[10px] text-slate-400">Clean portable plain text</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 3D Spatial AI Dissector quick jump */}
          {onOpen3DDissector && (
            <button
              onClick={onOpen3DDissector}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950 to-indigo-950 hover:bg-slate-800 text-xs font-semibold text-cyan-300 border border-cyan-700/60 shadow-sm transition-all cursor-pointer"
              title="Launch 3D Spatial AI Dissector for appliances & meters"
            >
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">3D Dissector</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-900/60 text-cyan-200 font-mono">3D</span>
            </button>
          )}
        </div>

        {/* Language re-translation toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Explanation Language:</span>
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            {(['en', 'bn', 'es', 'ja'] as LanguageCode[]).map((lang) => {
              const labels: Record<LanguageCode, string> = {
                en: '🇬🇧 EN',
                bn: '🇧🇩 বাংলা',
                es: '🇪🇸 ES',
                ja: '🇯🇵 日本語',
              };
              const isSelected = currentLanguage === lang;
              return (
                <button
                  key={lang}
                  disabled={isReanalyzing}
                  onClick={() => {
                    onLanguageChange(lang);
                    onReAnalyzeWithLanguage(lang);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {labels[lang]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Export notification toasts */}
      {(pdfSuccess || textSuccess) && (
        <div className="mb-5 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>
              {pdfSuccess
                ? 'PDF Analysis Report downloaded successfully to your personal records!'
                : 'Text File (.txt) downloaded successfully to your personal records!'}
            </span>
          </div>
          <span className="text-[10px] text-emerald-400/80">Saved locally</span>
        </div>
      )}

      {isReanalyzing && (
        <div className="mb-6 p-4 rounded-xl bg-cyan-950/40 border border-cyan-800 flex items-center justify-center gap-3 text-cyan-300 text-xs sm:text-sm animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Re-translating analysis into selected language...</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: Visual Document & Quick Actions (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Image Card */}
          <div className="relative group rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl">
            <div className="relative aspect-[3/4] max-h-[460px] w-full flex items-center justify-center bg-slate-950 p-3">
              <img
                src={imageDataUrl}
                alt="Analyzed Document"
                className="w-full h-full object-contain rounded-lg shadow-md cursor-pointer group-hover:scale-[1.01] transition-transform"
                onClick={() => setIsImageExpanded(true)}
              />
              <button
                onClick={() => setIsImageExpanded(true)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                title="Expand image"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Category tag banner under image */}
            <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${theme.badge}`}>
                {theme.icon} {analysis.categoryLabel || analysis.category.toUpperCase()}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Scanned via LifeLens AI</span>
            </div>
          </div>

          {/* Quick Action Tools Card */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Action Tools
            </h4>

            {/* Export as PDF Button */}
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-rose-950/40 to-slate-950 hover:bg-slate-800/80 border border-rose-900/40 hover:border-rose-700/60 text-xs font-semibold text-rose-200 transition-all shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                {isExportingPDF ? (
                  <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 text-rose-400" />
                )}
                <span>{isExportingPDF ? 'Generating PDF...' : 'Export as PDF Document (.pdf)'}</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-900/50 text-rose-300">
                PDF
              </span>
            </button>

            {/* Export as Text File Button */}
            <button
              onClick={handleExportText}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Export as Plain Text (.txt)</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                TXT
              </span>
            </button>

            {/* Add to Calendar Button */}
            <button
              onClick={handleAddToCalendar}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Add Deadline to Calendar</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Dispute / Inquiry Email Generator */}
            <button
              onClick={() => setIsDisputeModalOpen(true)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>Generate Dispute / Inquiry Letter</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Copy Summary */}
            <button
              onClick={handleCopySummary}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {copiedSummary ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-indigo-400" />
                )}
                <span>{copiedSummary ? 'Summary Copied!' : 'Copy Explanation to Clipboard'}</span>
              </div>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: The Core Breakdown (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Header Card with Document Title, One-Sentence Takeaway & TTS */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
              <div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border mb-2 ${theme.badge}`}>
                  {theme.icon} {analysis.categoryLabel}
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                  {analysis.documentTitle}
                </h2>
              </div>

              {/* TTS Listen Button */}
              <button
                onClick={handleListen}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isSpeaking
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 animate-pulse'
                    : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200 shadow-sm'
                }`}
                title="Listen to explanation read aloud"
              >
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>{isSpeaking ? 'Listening...' : 'Listen to Audio Guide'}</span>
              </button>
            </div>

            {/* Punchy One-Sentence Summary */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-purple-950/20 border border-cyan-800/40">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-semibold text-cyan-100 leading-relaxed">
                  {analysis.oneSentenceSummary}
                </p>
              </div>
            </div>
          </div>

          {/* Authenticity & Verification Disclaimer Banner (Mandatory Requirement) */}
          {analysis.verificationNotice && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-300 font-semibold block mb-0.5">
                  LifeLens Transparency Notice:
                </strong>
                {analysis.verificationNotice}
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('understand')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'understand'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Help Me Understand</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Anything ({chatHistory.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('ocr')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'ocr'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Extracted Text</span>
            </button>
          </div>

          {/* TAB 1: HELP ME UNDERSTAND CONTENT */}
          {activeTab === 'understand' && (
            <div className="space-y-6">
              {/* Card 1: What does this actually mean? */}
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    What does this actually mean?
                  </h3>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2.5 whitespace-pre-line font-normal">
                  {analysis.whatItMeans}
                </div>
              </div>

              {/* Card 2: Important Details & Key Figures Grid */}
              {analysis.keyDetails && analysis.keyDetails.length > 0 && (
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Important Details &amp; Key Figures
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400">Extracted from scan</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {analysis.keyDetails.map((detail, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          detail.isHighlighted
                            ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                            : 'bg-slate-950 border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-medium text-slate-400">
                            {detail.label}
                          </span>
                          {detail.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-900/70 text-indigo-300 border border-indigo-700/50">
                              {detail.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-sm sm:text-base font-bold text-white tracking-tight">
                          {detail.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card 3: Potential Concerns & Red Flags */}
              {analysis.concernsAndFlags && analysis.concernsAndFlags.length > 0 && (
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Potential Concerns &amp; Red Flags
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Hidden fees, penalties &amp; fine print
                    </span>
                  </div>

                  <div className="space-y-3">
                    {analysis.concernsAndFlags.map((flag, idx) => {
                      const isHigh = flag.severity === 'high';
                      const isMed = flag.severity === 'medium';
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border ${
                            isHigh
                              ? 'bg-rose-950/30 border-rose-800/60'
                              : isMed
                              ? 'bg-amber-950/30 border-amber-800/60'
                              : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <h4
                              className={`text-xs sm:text-sm font-bold ${
                                isHigh ? 'text-rose-300' : isMed ? 'text-amber-300' : 'text-slate-200'
                              }`}
                            >
                              {flag.title}
                            </h4>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                isHigh
                                  ? 'bg-rose-900/70 text-rose-200 border border-rose-700'
                                  : isMed
                                  ? 'bg-amber-900/70 text-amber-200 border border-amber-700'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {flag.severity} priority
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed mb-2">
                            {flag.explanation}
                          </p>
                          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 text-xs text-slate-300 flex items-start gap-2">
                            <span className="font-bold text-cyan-400 shrink-0">Advice:</span>
                            <span>{flag.advice}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Card 4: Actionable Next Steps Checklist */}
              {analysis.nextSteps && analysis.nextSteps.length > 0 && (
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Next Steps &amp; Action Checklist
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400">Click to check off tasks</span>
                  </div>

                  <div className="space-y-2.5">
                    {analysis.nextSteps.map((step) => {
                      const isDone = !!checkedSteps[step.stepNumber];
                      return (
                        <div
                          key={step.stepNumber}
                          onClick={() => toggleStep(step.stepNumber)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isDone
                              ? 'bg-emerald-950/20 border-emerald-800/50 opacity-60'
                              : 'bg-slate-950 hover:bg-slate-800/60 border-slate-800'
                          }`}
                        >
                          <button
                            type="button"
                            className="shrink-0 mt-0.5 text-cyan-400"
                            aria-label="Toggle step"
                          >
                            {isDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs sm:text-sm font-medium ${
                                isDone ? 'line-through text-slate-400' : 'text-slate-200'
                              }`}
                            >
                              {step.action}
                            </p>
                            {step.deadline && (
                              <span className="inline-block mt-1 text-[11px] font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                                ⏰ Due: {step.deadline}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ASK ANYTHING (DOCUMENT CHAT) */}
          {activeTab === 'chat' && (
            <DocumentChat
              analysis={analysis}
              chatHistory={chatHistory}
              onUpdateHistory={onUpdateChatHistory}
              targetLanguage={currentLanguage}
            />
          )}

          {/* TAB 3: EXTRACTED TEXT OCR */}
          {activeTab === 'ocr' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Raw Extracted Document OCR
                </h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(analysis.extractedText);
                    setCopiedOCR(true);
                    setTimeout(() => setCopiedOCR(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
                >
                  {copiedOCR ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedOCR ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={analysis.extractedText || 'No direct text extracted.'}
                rows={16}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300 font-mono leading-relaxed focus:outline-none resize-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Full Image Zoom Modal */}
      {isImageExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
          onClick={() => setIsImageExpanded(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
            <img
              src={imageDataUrl}
              alt="Full size scan"
              className="max-h-[85vh] w-auto max-w-full object-contain"
            />
            <p className="text-center text-xs text-slate-400 mt-2">Click anywhere to close preview</p>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        analysis={analysis}
      />
    </div>
  );
};
