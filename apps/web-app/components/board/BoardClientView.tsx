'use client';

import React, { useState } from 'react';
import { SearchBar } from './SearchBar';
import { TopicChips } from './TopicChips';
import { PaperList } from './PaperList';
import { useBoardSearch } from './useBoardSearch';
import { Paper, ResearchSource } from '@/lib/research/types';
import { X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface BoardClientViewProps {
  initialPapers: Paper[];
  initialTotal: number;
  initialDegraded?: ResearchSource[];
}

export function BoardClientView({ initialPapers, initialTotal, initialDegraded }: BoardClientViewProps) {
  const {
    searchQuery,
    selectedTopic,
    papers,
    total,
    degraded,
    loading,
    hasMore,
    handleSearchChange,
    handleTopicSelect,
    clearSearch,
    loadMore,
  } = useBoardSearch(initialPapers, initialTotal, initialDegraded);

  const [signupGateOpen, setSignupGateOpen] = useState(false);
  const [gatedActionType, setGatedActionType] = useState<string>('');

  const handleGatedAction = (action: string) => {
    setGatedActionType(action);
    setSignupGateOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sticky Search & Topic Chips under Nav */}
      <div className="sticky top-16 z-20 bg-[#0B0F0D]/95 backdrop-blur-md py-3 flex flex-col gap-3 border-b border-white/5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <SearchBar value={searchQuery} onChange={handleSearchChange} onClear={clearSearch} />
        </div>
        <TopicChips selectedTopic={selectedTopic} onSelectTopic={handleTopicSelect} />
      </div>

      {/* Paper List */}
      <PaperList
        papers={papers}
        loading={loading}
        degraded={degraded}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onClearSearch={clearSearch}
        onGatedAction={handleGatedAction}
        searchActive={Boolean(searchQuery || selectedTopic)}
      />

      {/* Signup Gate Modal (Prompt 3) */}
      {signupGateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md bg-[#121814] border border-white/10 p-6 shadow-2xl flex flex-col gap-6 relative"
            style={{ borderRadius: '12px' }}
          >
            <button
              onClick={() => setSignupGateOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-heading font-bold text-white capitalize">
                Sign up to {gatedActionType}
              </h3>
              <p className="text-sm text-gray-300 font-sans">
                Join Jarida to save papers, participate in discussions, and access clinical intelligence feeds.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/signup"
                onClick={() => setSignupGateOpen(false)}
                className="flex-1 py-2.5 px-4 bg-[#F97316] text-white text-xs font-bold rounded-lg hover:bg-[#F97316]/90 transition-colors text-center inline-flex items-center justify-center gap-2"
              >
                <span>Create Account</span>
                <ArrowRight size={14} />
              </Link>
              <button
                onClick={() => setSignupGateOpen(false)}
                className="py-2.5 px-4 bg-white/5 text-gray-300 hover:text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
