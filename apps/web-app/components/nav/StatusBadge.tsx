import React from 'react';
import type { ProductBadgeStatus } from '@/navProducts';

interface StatusBadgeProps {
  status: ProductBadgeStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const isAvailable = status === 'Available';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium tracking-wider uppercase shrink-0 whitespace-nowrap ${
        isAvailable
          ? 'bg-[#16A34A]/20 text-[#22C55E] border border-[#16A34A]/30'
          : 'bg-white/10 text-gray-300 border border-white/10'
      }`}
    >
      {status}
    </span>
  );
}
