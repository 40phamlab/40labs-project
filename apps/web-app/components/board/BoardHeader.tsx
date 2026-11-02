import React from 'react';
import { BOARD_NAME, BOARD_TAGLINE } from '@/config/board';

export function BoardHeader() {
  return (
    <header className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-6 border-b border-white/10">
      <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-tight">
        {BOARD_NAME}
      </h1>
      <p className="text-xs sm:text-sm text-gray-400 font-sans">
        {BOARD_TAGLINE}
      </p>
    </header>
  );
}
