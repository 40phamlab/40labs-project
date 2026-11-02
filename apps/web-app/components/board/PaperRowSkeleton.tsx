import React from 'react';

export function PaperRowSkeleton() {
  return (
    <div
      className="p-4 bg-[#121814]/60 border border-white/5 rounded-[12px] flex items-center justify-between gap-4 animate-pulse"
      style={{ borderRadius: '12px' }}
    >
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="h-3 bg-white/5 rounded w-1/3" />
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-white/5" />
        <div className="w-8 h-8 rounded-lg bg-white/5" />
        <div className="w-8 h-8 rounded-lg bg-white/5" />
      </div>
    </div>
  );
}
