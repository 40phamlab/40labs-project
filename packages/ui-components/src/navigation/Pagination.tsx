import * as React from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-8 h-8 flex items-center justify-center rounded-input bg-panel-strong text-text-muted disabled:opacity-50 hover:text-text transition-colors elevation-raised text-xs"
      >
        ←
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-8 h-8 flex items-center justify-center rounded-input text-[10px] font-bold transition-all ${
            currentPage === page
              ? 'bg-primary text-surface elevation-raised'
              : 'bg-panel-strong text-text-muted hover:text-text elevation-raised'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-8 h-8 flex items-center justify-center rounded-input bg-panel-strong text-text-muted disabled:opacity-50 hover:text-text transition-colors elevation-raised text-xs"
      >
        →
      </button>
    </div>
  );
};
