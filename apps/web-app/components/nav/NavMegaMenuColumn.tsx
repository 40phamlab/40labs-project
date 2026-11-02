import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import type { ProductColumn } from '@/navProducts';
import { StatusBadge } from './StatusBadge';

interface NavMegaMenuColumnProps {
  column: ProductColumn;
  onSelect?: () => void;
}

export function NavMegaMenuColumn({ column, onSelect }: NavMegaMenuColumnProps) {
  const isPlatform = column.title === 'PLATFORM';

  return (
    <div className="flex flex-col">
      <div className="font-mono text-xs uppercase tracking-widest text-gray-400 font-medium border-b border-white/10 pb-3 mb-5">
        {column.title}
      </div>

      {isPlatform ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {column.items.map((item) => {
            const cardContent = (
              <div className="rounded-xl p-4 hover:bg-white/5 transition-colors flex flex-col justify-between min-w-0 group h-full border border-white/5 hover:border-white/10">
                <div className="flex items-start justify-between gap-3 w-full min-w-0">
                  <span className="font-display text-base sm:text-lg lg:text-xl font-semibold text-white group-hover:text-[#16A34A] transition-colors leading-snug break-words flex-1 min-w-0">
                    {item.title}
                  </span>
                  {item.badge && (
                    <div className="shrink-0 pt-0.5">
                      <StatusBadge status={item.badge} />
                    </div>
                  )}
                </div>
                <p className="font-sans text-xs sm:text-sm text-gray-400 line-clamp-2 mt-2 leading-relaxed">
                  {item.description}
                </p>
                {item.external && (
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#16A34A] opacity-80 group-hover:opacity-100">
                    <span>Visit site</span>
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                )}
              </div>
            );

            return (
              <div key={item.title} className="min-w-0">
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onSelect}
                    className="block outline-none"
                  >
                    {cardContent}
                  </a>
                ) : (
                  <Link href={item.href} onClick={onSelect} className="block outline-none">
                    {cardContent}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {column.items.map((item) => {
            const linkContent = (
              <div className="group flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]">
                <span className="font-sans text-base sm:text-lg text-white group-hover:text-[#16A34A] transition-colors whitespace-normal">
                  {item.title}
                </span>
                <ArrowRight size={16} className="text-gray-500 group-hover:text-[#16A34A] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </div>
            );

            return (
              <li key={item.title}>
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onSelect}
                    className="block outline-none"
                  >
                    {linkContent}
                  </a>
                ) : (
                  <Link href={item.href} onClick={onSelect} className="block outline-none">
                    {linkContent}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
