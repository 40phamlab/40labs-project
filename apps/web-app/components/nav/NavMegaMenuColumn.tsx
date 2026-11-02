import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ProductColumn } from '@/navProducts';
import { StatusBadge } from './StatusBadge';

interface NavMegaMenuColumnProps {
  column: ProductColumn;
  onSelect?: () => void;
}

export function NavMegaMenuColumn({ column, onSelect }: NavMegaMenuColumnProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="font-mono text-xs uppercase tracking-widest text-gray-400 font-medium">
        {column.title}
      </div>
      <ul className="flex flex-col gap-2">
        {column.items.map((item) => {
          const content = (
            <div className="group flex flex-col gap-1 p-3 -mx-2 rounded-xl transition-colors hover:bg-white/5 outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-sans font-medium text-base text-white group-hover:text-[#16A34A] transition-colors inline-flex items-center gap-1.5">
                  {item.title}
                  {item.external && (
                    <ArrowUpRight size={14} className="opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  )}
                </span>
                {item.badge && <StatusBadge status={item.badge} />}
              </div>
              <p className="font-sans text-xs text-gray-400 line-clamp-1 leading-relaxed">
                {item.description}
              </p>
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
                  {content}
                </a>
              ) : (
                <Link href={item.href} onClick={onSelect} className="block outline-none">
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
