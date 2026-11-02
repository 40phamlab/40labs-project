'use client';

import React, { useState } from 'react';
import { MessageSquare, Bookmark, Share2, Quote, Check } from 'lucide-react';
import { Paper } from '@/lib/research/types';
import { GatedAction } from '@/config/board';

interface ActionRailProps {
  paper: Paper;
  onGatedAction: (action: GatedAction) => void;
}

export function ActionRail({ paper, onGatedAction }: ActionRailProps) {
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedCite, setCopiedCite] = useState(false);

  const handleShare = async () => {
    const url = paper.openAccessUrl || paper.sourceUrl;
    if (navigator.share) {
      try {
        await navigator.share({ title: paper.title, url });
        return;
      } catch (e) {
        // cancelled
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCite = async () => {
    // Generate APA Citation
    const authors = paper.authors.map((a) => a.name).join(', ') || 'Unknown Author';
    const year = new Date(paper.publishedAt).getFullYear() || 'n.d.';
    const title = paper.title;
    const journal = paper.journal ? `${paper.journal}.` : '';
    const doi = paper.doi ? `https://doi.org/${paper.doi}` : paper.sourceUrl;

    const apa = `${authors} (${year}). ${title}. ${journal} ${doi}`;
    try {
      await navigator.clipboard.writeText(apa);
      setCopiedCite(true);
      setTimeout(() => setCopiedCite(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 sm:static sm:mt-8 z-40 bg-[#0B0F0D]/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t sm:border-t-0 border-white/10 py-3 sm:py-0 px-4 sm:px-0">
      <div className="max-w-[680px] mx-auto flex items-center justify-around sm:justify-start sm:gap-4 bg-[#121814] sm:bg-white/5 border border-white/10 p-2 sm:px-4 sm:py-2 rounded-xl">
        <button
          onClick={() => onGatedAction('comment')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-sans"
        >
          <MessageSquare size={16} className="text-[#16A34A]" />
          <span>Comment</span>
        </button>

        <button
          onClick={() => onGatedAction('save')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-sans"
        >
          <Bookmark size={16} className="text-[#16A34A]" />
          <span>Save</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-sans"
        >
          {copiedShare ? <Check size={16} className="text-[#16A34A]" /> : <Share2 size={16} className="text-[#16A34A]" />}
          <span>{copiedShare ? 'Copied' : 'Share'}</span>
        </button>

        <button
          onClick={handleCite}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-sans"
        >
          {copiedCite ? <Check size={16} className="text-[#16A34A]" /> : <Quote size={16} className="text-[#16A34A]" />}
          <span>{copiedCite ? 'APA Copied' : 'Cite'}</span>
        </button>
      </div>
    </div>
  );
}
