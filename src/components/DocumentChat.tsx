import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Mic,
  MicOff,
  Copy,
  Check,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { ChatMessage, LanguageCode, ScanAnalysis } from '../types';
import { askDocumentQuestionAPI } from '../services/apiService';

interface DocumentChatProps {
  analysis: ScanAnalysis;
  chatHistory: ChatMessage[];
  onUpdateHistory: (messages: ChatMessage[]) => void;
  targetLanguage: LanguageCode;
}

export const DocumentChat: React.FC<DocumentChatProps> = ({
  analysis,
  chatHistory,
  onUpdateHistory,
  targetLanguage,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  // Speech recognition setup for voice asking
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      const langMap: Record<LanguageCode, string> = {
        en: 'en-US',
        bn: 'bn-BD',
        es: 'es-ES',
        ja: 'ja-JP',
      };
      recognition.lang = langMap[targetLanguage] || 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, [targetLanguage]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    const newHistory = [...chatHistory, userMessage];
    onUpdateHistory(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const answer = await askDocumentQuestionAPI(
        query,
        {
          documentTitle: analysis.documentTitle,
          oneSentenceSummary: analysis.oneSentenceSummary,
          whatItMeans: analysis.whatItMeans,
          keyDetails: analysis.keyDetails,
          concernsAndFlags: analysis.concernsAndFlags,
          nextSteps: analysis.nextSteps,
          extractedText: analysis.extractedText,
        },
        newHistory,
        targetLanguage
      );

      const botMessage: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        role: 'assistant',
        content: answer,
        timestamp: Date.now(),
      };

      onUpdateHistory([...newHistory, botMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: `Sorry, I couldn't answer that: ${err.message || 'Unknown error'}. Please try again.`,
        timestamp: Date.now(),
      };
      onUpdateHistory([...newHistory, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[520px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-3.5 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs sm:text-sm font-bold text-white">
            Ask LifeLens About This Document
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          Grounded directly in extracted contents
        </span>
      </div>

      {/* Messages stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {chatHistory.length === 0 && (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-2 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-300">
              Have questions about this scanned item?
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
              Ask about hidden clauses, fee breakdowns, cancellation policies, or allergen safety.
            </p>

            {/* Contextual Suggested Questions */}
            {analysis.suggestedFollowUps && analysis.suggestedFollowUps.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-lg mx-auto">
                {analysis.suggestedFollowUps.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(question)}
                    className="text-left text-xs bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-700/80 hover:border-cyan-500/50 rounded-lg px-3 py-1.5 transition-all"
                  >
                    💡 {question}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`group relative max-w-[85%] sm:max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-line'
              }`}
            >
              {msg.content}

              {msg.role === 'assistant' && (
                <button
                  onClick={() => copyToClipboard(msg.content, msg.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 transition-opacity"
                  title="Copy response"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 text-xs">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Analyzing document context...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question chips on footer if chat is already active */}
      {chatHistory.length > 0 && analysis.suggestedFollowUps && (
        <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-900 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-slate-400 shrink-0 font-medium">Suggestions:</span>
          {analysis.suggestedFollowUps.slice(0, 3).map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="shrink-0 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 rounded px-2 py-0.5 whitespace-nowrap transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question about this document..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${
                isListening
                  ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={isListening ? 'Stop listening' : 'Speak your question'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`p-2.5 rounded-xl font-medium transition-all ${
              inputText.trim() && !isLoading
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md active:scale-95'
                : 'bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
