import React from 'react';
import { Paper, ResearchSource } from '@/lib/research/types';
import { PaperRow } from './PaperRow';
import { PaperRowSkeleton } from './PaperRowSkeleton';

interface PaperListProps {
  papers: Paper[];
  loading: boolean;
  degraded?: ResearchSource[];
  hasMore: boolean;
  onLoadMore: () => void;
  onClearSearch: () => void;
  onGatedAction: (action: string) => void;
  searchActive: boolean;
}

export function PaperList({
  papers,
  loading,
  degraded,
  hasMore,
  onLoadMore,
  onClearSearch,
  onGatedAction,
  searchActive,
}: PaperListProps) {
  return (
    <div className="flex flex-col gap-4">
      {degraded && degraded.length > 0 && (
        <div className="text-xs text-amber-400/90 font-mono">
          Some sources are unavailable.
        </div>
      )}

      {papers.length === 0 && !loading ? (
        <div className="py-16 text-center flex flex-col items-center gap-4 bg-[#121814]/50 border border-white/10 rounded-[12px]">
          <p className="text-sm text-gray-400 font-sans">No papers found</p>
          {searchActive && (
            <button
              onClick={onClearSearch}
              className="px-4 py-2 bg-[#16A34A] text-black text-xs font-bold rounded-lg hover:bg-[#16A34A]/90 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {papers.map((paper) => (
            <PaperRow key={paper.id} paper={paper} onGatedAction={onGatedAction} />
          ))}

          {loading && (
            <>
              <PaperRowSkeleton />
              <PaperRowSkeleton />
              <PaperRowSkeleton />
            </>
          )}
        </div>
      )}

      {hasMore && !loading && (
        <div className="pt-4 flex justify-center">
          <button
            onClick={onLoadMore}
            className="px-6 py-2.5 bg-[#121814] border border-white/10 hover:border-white/30 text-white text-xs font-semibold rounded-lg transition-colors font-sans"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
