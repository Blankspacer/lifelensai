import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Search,
  Trash2,
  Calendar,
  ExternalLink,
  History,
  FileText,
  AlertTriangle,
  Clock,
  StickyNote,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { ScanRecord, DocumentCategory } from '../types';

interface ScanHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ScanRecord[];
  onSelectRecord: (record: ScanRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
}

export const ScanHistoryModal: React.FC<ScanHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectRecord,
  onDeleteRecord,
  onClearAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterHasNotesOnly, setFilterHasNotesOnly] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Comprehensive multi-attribute filtering (Content, Date, Note, Category)
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // 1. Category Filter
      if (selectedCategory !== 'all' && item.analysis.category !== selectedCategory) {
        return false;
      }

      // 2. Has Notes filter toggle
      if (filterHasNotesOnly && (!item.userNotes || !item.userNotes.trim())) {
        return false;
      }

      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      // --- DATE MATCHING ---
      const recordDate = new Date(item.timestamp);
      const fullDateStr = recordDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).toLowerCase(); // e.g., "oct 27, 2026"

      const longDateStr = recordDate.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).toLowerCase(); // e.g., "october 27, 2026"

      const isoDateStr = recordDate.toISOString().slice(0, 10); // "2026-10-27"
      const yearStr = recordDate.getFullYear().toString();
      const monthStr = (recordDate.getMonth() + 1).toString();
      const dayStr = recordDate.getDate().toString();

      // Relative date match ("today", "yesterday")
      const todayIso = new Date().toISOString().slice(0, 10);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayIso = yesterday.toISOString().slice(0, 10);

      const matchesRelativeDate =
        (query === 'today' && isoDateStr === todayIso) ||
        (query === 'yesterday' && isoDateStr === yesterdayIso);

      const matchesDate =
        fullDateStr.includes(query) ||
        longDateStr.includes(query) ||
        isoDateStr.includes(query) ||
        (query.length >= 4 && yearStr.includes(query)) ||
        matchesRelativeDate;

      // Also check deadlines inside nextSteps or keyDetails
      const matchesInternalDeadlines =
        item.analysis.nextSteps?.some(
          (s) => s.deadline && s.deadline.toLowerCase().includes(query)
        ) ||
        item.analysis.keyDetails?.some(
          (k) =>
            (k.label.toLowerCase().includes('date') || k.label.toLowerCase().includes('due')) &&
            k.value.toLowerCase().includes(query)
        );

      // --- USER NOTE MATCHING ---
      const matchesNotes = Boolean(item.userNotes?.toLowerCase().includes(query));

      // --- CONTENT MATCHING ---
      const matchesTitle = item.analysis.documentTitle.toLowerCase().includes(query);
      const matchesCategoryLabel = (
        item.analysis.categoryLabel || item.analysis.category
      ).toLowerCase().includes(query);
      const matchesSummary = item.analysis.oneSentenceSummary.toLowerCase().includes(query);
      const matchesWhatItMeans = item.analysis.whatItMeans?.toLowerCase().includes(query) || false;
      const matchesExtractedText = item.analysis.extractedText?.toLowerCase().includes(query) || false;
      const matchesKeyDetails =
        item.analysis.keyDetails?.some(
          (k) =>
            k.label.toLowerCase().includes(query) ||
            k.value.toLowerCase().includes(query) ||
            (k.badge && k.badge.toLowerCase().includes(query))
        ) || false;
      const matchesConcerns =
        item.analysis.concernsAndFlags?.some(
          (c) =>
            c.title.toLowerCase().includes(query) ||
            c.explanation.toLowerCase().includes(query) ||
            c.advice.toLowerCase().includes(query)
        ) || false;
      const matchesNextSteps =
        item.analysis.nextSteps?.some((s) => s.action.toLowerCase().includes(query)) || false;

      return (
        matchesDate ||
        matchesInternalDeadlines ||
        matchesNotes ||
        matchesTitle ||
        matchesCategoryLabel ||
        matchesSummary ||
        matchesWhatItMeans ||
        matchesExtractedText ||
        matchesKeyDetails ||
        matchesConcerns ||
        matchesNextSteps
      );
    });
  }, [history, searchQuery, selectedCategory, filterHasNotesOnly]);

  if (!isOpen) return null;

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Scans' },
    { id: 'bill', label: 'Bills & Fees' },
    { id: 'label', label: 'Product Labels' },
    { id: 'document', label: 'Contracts & Forms' },
    { id: 'message', label: 'Messages & Alerts' },
    { id: 'instruction', label: 'Manuals' },
  ];

  const quickSearchFilters = [
    { label: 'Today', query: 'today' },
    { label: 'Bills', query: 'bill' },
    { label: 'Allergens', query: 'allergen' },
    { label: 'Deadlines / Due', query: 'due' },
    { label: '2026', query: '2026' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col h-[88vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-inner">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Scan Archive &amp; History</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {history.length} {history.length === 1 ? 'record' : 'records'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Search all past items by extracted content, keywords, dates, or personal notes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Enhanced Search Bar & Filter Controls */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-3">
          {/* Main Search Input */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by content, bill fee, date (e.g. 'Oct 27', '2026'), or note..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-2xl pl-10 pr-24 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all shadow-inner"
            />
            {/* Right side controls inside input */}
            <div className="absolute right-3 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                {filteredHistory.length} {filteredHistory.length === 1 ? 'match' : 'matches'}
              </span>
            </div>
          </div>

          {/* Quick Search Suggestions & Note Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            {/* Quick Keyword suggestions */}
            <div className="flex items-center gap-1.5 text-xs overflow-x-auto no-scrollbar">
              <span className="text-[11px] text-slate-500 font-medium shrink-0">Filter by:</span>
              {quickSearchFilters.map((q) => (
                <button
                  key={q.label}
                  onClick={() => setSearchQuery(q.query)}
                  className={`text-[11px] px-2.5 py-0.5 rounded-lg border transition-all ${
                    searchQuery.toLowerCase() === q.query.toLowerCase()
                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500 font-medium'
                      : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Note-only filter toggle */}
            <button
              onClick={() => setFilterHasNotesOnly(!filterHasNotesOnly)}
              className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                filterHasNotesOnly
                  ? 'bg-amber-950/60 text-amber-300 border-amber-600'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-300 border-slate-800'
              }`}
            >
              <StickyNote className="w-3 h-3 text-amber-400" />
              <span>With Notes Only</span>
            </button>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Search className="w-7 h-7" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white mb-1">
                {searchQuery || selectedCategory !== 'all' || filterHasNotesOnly
                  ? 'No matching scan records found'
                  : 'Your scan history is empty'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                {searchQuery || selectedCategory !== 'all' || filterHasNotesOnly
                  ? 'Try clearing the search query or adjusting your category/note filter to see more items.'
                  : 'Scans you perform using LifeLens AI will automatically be saved and indexed here.'}
              </p>
              {(searchQuery || selectedCategory !== 'all' || filterHasNotesOnly) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setFilterHasNotesOnly(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            filteredHistory.map((record) => {
              const recordDate = new Date(record.timestamp);
              const formattedDate = recordDate.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const formattedTime = recordDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              // Check if search query matched specific fields to show badges
              const q = searchQuery.toLowerCase().trim();
              const isDateMatch =
                q &&
                (formattedDate.toLowerCase().includes(q) ||
                  recordDate.getFullYear().toString().includes(q) ||
                  recordDate.toISOString().slice(0, 10).includes(q));

              const isNoteMatch = q && record.userNotes?.toLowerCase().includes(q);

              return (
                <div
                  key={record.id}
                  onClick={() => {
                    onSelectRecord(record);
                    onClose();
                  }}
                  className="group relative p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-cyan-500/50 hover:bg-slate-900/60 transition-all flex items-start gap-3.5 sm:gap-4 cursor-pointer shadow-sm hover:shadow-md"
                >
                  {/* Thumbnail Preview */}
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center relative">
                    {record.thumbnail ? (
                      <img
                        src={record.thumbnail}
                        alt="Scanned item thumbnail"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <FileText className="w-7 h-7 text-slate-500" />
                    )}
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 text-[9px] font-mono text-cyan-300">
                      {record.targetLanguage?.toUpperCase() || 'EN'}
                    </span>
                  </div>

                  {/* Document Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 uppercase">
                        {record.analysis.categoryLabel || record.analysis.category}
                      </span>

                      {/* Date Indicator */}
                      <span
                        className={`text-[11px] flex items-center gap-1 font-medium ${
                          isDateMatch
                            ? 'text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800'
                            : 'text-slate-400'
                        }`}
                      >
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{formattedDate}</span>
                        <span className="text-slate-600">•</span>
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{formattedTime}</span>
                      </span>

                      {/* Matched Note Badge */}
                      {record.userNotes && (
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            isNoteMatch
                              ? 'bg-amber-950 text-amber-300 border border-amber-600 font-bold animate-pulse'
                              : 'bg-slate-900 text-amber-400/90 border border-slate-800'
                          }`}
                        >
                          <StickyNote className="w-2.5 h-2.5" />
                          <span>Has Note</span>
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {record.analysis.documentTitle}
                    </h4>

                    {/* One-Sentence Summary */}
                    <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                      {record.analysis.oneSentenceSummary}
                    </p>

                    {/* Note Snippet preview if present */}
                    {record.userNotes && (
                      <div className="p-2 rounded-xl bg-amber-950/20 border border-amber-900/30 text-[11px] text-amber-300/90 flex items-start gap-1.5 line-clamp-1">
                        <span className="font-semibold text-amber-400 shrink-0">Note:</span>
                        <span className="truncate italic">"{record.userNotes}"</span>
                      </div>
                    )}

                    {/* Q&A count indicator */}
                    {record.chatHistory && record.chatHistory.length > 0 && (
                      <div className="text-[10px] text-cyan-400 flex items-center gap-1 font-medium">
                        <span>💬 {record.chatHistory.length} saved follow-up {record.chatHistory.length === 1 ? 'question' : 'questions'}</span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0 self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRecord(record.id);
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-900 opacity-60 group-hover:opacity-100 transition-all"
                      title="Delete this scan record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="p-2 text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                Showing {filteredHistory.length} of {history.length} archived scans
              </span>
            </div>
            <button
              onClick={onClearAll}
              className="text-rose-400 hover:text-rose-300 hover:underline text-xs font-medium"
            >
              Clear Entire Archive
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
