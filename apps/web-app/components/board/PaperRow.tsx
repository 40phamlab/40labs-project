'use client';

import React, { useState } from 'react';
import { MessageSquare, Bookmark, Share2, MoreVertical, Check } from 'lucide-react';
import { Paper } from '@/lib/research/types';

interface PaperRowProps {
  paper: Paper;
  onGatedAction: (action: string) => void;
}

export function PaperRow({ paper, onGatedAction }: PaperRowProps) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const authorsDisplay = (() => {
    const authors = paper.authors || [];
    if (authors.length === 0) return 'Unknown Author';
    const first3 = authors.slice(0, 3).map((a) => a.name).join(', ');
    if (authors.length > 3) {
      return `${first3} +${authors.length - 3}`;
    }
    return first3;
  })();

  const handleShare = async () => {
    const shareUrl = paper.openAccessUrl || paper.sourceUrl;
    if (navigator.share) {
      try {
        await navigator.share({
          title: paper.title,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or not supported
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const formattedDate = new Date(paper.publishedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className="p-4 bg-[#121814] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
      style={{ borderRadius: '12px' }}
    >
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <a
          href={paper.openAccessUrl || paper.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-heading font-semibold text-white text-sm sm:text-base line-clamp-2 hover:text-[#16A34A] transition-colors leading-snug"
        >
          {paper.title}
        </a>

        <div className="text-xs text-gray-400 font-sans truncate">
          {authorsDisplay}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-gray-500 pt-0.5">
          {paper.journal && <span className="text-gray-400 truncate max-w-[200px] sm:max-w-xs">{paper.journal}</span>}
          {paper.journal && <span>·</span>}
          <span>{formattedDate}</span>
          <span>·</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#16A34A]/15 text-[#16A34A]">
            {paper.source}
          </span>
          {typeof paper.citedByCount === 'number' && paper.citedByCount > 0 && (
            <>
              <span>·</span>
              <span>Cited: {paper.citedByCount}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions: Desktop / Normal vs Kebab under 420px */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <div className="hidden [@media(min-width:420px)]:flex items-center gap-1.5">
          <button
            onClick={() => onGatedAction('comment')}
            title="Comment"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            aria-label="Comment"
          >
            <MessageSquare size={16} />
          </button>
          <button
            onClick={() => onGatedAction('save')}
            title="Save"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            aria-label="Save"
          >
            <Bookmark size={16} />
          </button>
          <button
            onClick={handleShare}
            title={copied ? 'Link Copied!' : 'Share'}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors relative"
            aria-label="Share"
          >
            {copied ? <Check size={16} className="text-[#16A34A]" /> : <Share2 size={16} />}
          </button>
        </div>

        <div className="relative [@media(min-width:420px)]:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white"
            aria-label="More actions"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-36 py-1 bg-[#1A221C] border border-white/10 rounded-lg shadow-xl z-30">
              <button
                onClick={() => { setMenuOpen(false); onGatedAction('comment'); }}
                className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2"
              >
                <MessageSquare size={14} /> Comment
              </button>
              <button
                onClick={() => { setMenuOpen(false); onGatedAction('save'); }}
                className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2"
              >
                <Bookmark size={14} /> Save
              </button>
              <button
                onClick={() => { setMenuOpen(false); handleShare(); }}
                className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2"
              >
                <Share2 size={14} /> {copied ? 'Copied' : 'Share'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
