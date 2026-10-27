import React, { useState } from 'react';
import { X, Copy, Check, Mail, Sparkles, Send } from 'lucide-react';
import { ScanAnalysis } from '../types';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: ScanAnalysis;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({ isOpen, onClose, analysis }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate a high quality letter if analysis didn't have one pre-set
  const defaultSubject = `Inquiry regarding charges on ${analysis.documentTitle || 'recent statement'}`;
  const defaultBody =
    analysis.disputeLetterTemplate ||
    `Dear Customer Support / Billing Department,

I am writing regarding my recent statement (${analysis.documentTitle}).

Upon reviewing the itemized breakdown, I noticed several charges that appear unclear or unexpectedly high:
${analysis.concernsAndFlags
  .map((c) => `- ${c.title}: ${c.explanation}`)
  .join('\n')}

Could you please provide formal clarification regarding the contractual or regulatory justification for these fees? If any fee was assessed in error or qualifies for a waiver, I kindly request an adjustment to my account.

Thank you for your prompt assistance in resolving this matter.

Sincerely,
[Your Name]
[Account Number / Contact Information]`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${defaultSubject}\n\n${defaultBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMailto = () => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(
      defaultSubject
    )}&body=${encodeURIComponent(defaultBody)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Dispute &amp; Clarification Letter
              </h3>
              <p className="text-xs text-slate-400">
                Ready-to-send polite inquiry drafted from your scan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Email Subject
            </label>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 font-medium">
              {defaultSubject}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Drafted Message Body
            </label>
            <textarea
              readOnly
              value={defaultBody}
              rows={12}
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 font-mono leading-relaxed focus:outline-none resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Tip: Fill in your account number and name before sending to your service provider or landlord.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Letter'}</span>
          </button>
          <button
            onClick={handleMailto}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Open in Mail App</span>
          </button>
        </div>
      </div>
    </div>
  );
};
