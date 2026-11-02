'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react';
import { Paper } from '@/lib/research/types';
import { ProgressBar } from './ProgressBar';
import { ReaderControls } from './ReaderControls';
import { ActionRail } from './ActionRail';
import { CommentsEmpty } from './CommentsEmpty';
import { SignupGateDialog } from '@/components/gate/SignupGateDialog';
import { GatedAction } from '@/config/board';

interface ReaderShellProps {
  paper: Paper;
}

export function ReaderShell({ paper }: ReaderShellProps) {
  const [navVisible, setNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    if (typeof window !== 'undefined') {
      try {
        return (localStorage.getItem('jarida_reader_fontsize') as any) || 'medium';
      } catch (e) {
        return 'medium';
      }
    }
    return 'medium';
  });

  const [theme, setTheme] = useState<'dark' | 'light' | 'sepia'>(() => {
    if (typeof window !== 'undefined') {
      try {
        return (localStorage.getItem('jarida_reader_theme') as any) || 'dark';
      } catch (e) {
        return 'dark';
      }
    }
    return 'dark';
  });

  const [copiedDoi, setCopiedDoi] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<GatedAction>('comment');

  useEffect(() => {
    try {
      localStorage.setItem('jarida_reader_fontsize', fontSize);
    } catch (e) {}
  }, [fontSize]);

  useEffect(() => {
    try {
      localStorage.setItem('jarida_reader_theme', theme);
    } catch (e) {}
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setNavVisible(false);
      } else {
        setNavVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleCopyDoi = async () => {
    if (!paper.doi) return;
    try {
      await navigator.clipboard.writeText(paper.doi);
      setCopiedDoi(true);
      setTimeout(() => setCopiedDoi(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGatedAction = (action: GatedAction) => {
    if (action === 'fullpaper' && paper.openAccessUrl) {
      const submitted = localStorage.getItem('jarida_waitlist_submitted');
      if (submitted) {
        window.open(paper.openAccessUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    }
    setActiveAction(action);
    setGateOpen(true);
  };

  const handleGateSuccess = () => {
    if (activeAction === 'fullpaper' && paper.openAccessUrl) {
      window.open(paper.openAccessUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const themeClasses = {
    dark: 'bg-[#0B0F0D] text-[#F8FAFB]',
    light: 'bg-[#F9FAFB] text-[#111827]',
    sepia: 'bg-[#FDF6E2] text-[#3F3D32]',
  }[theme];

  const bodySizeClasses = {
    small: 'text-base leading-[1.6]',
    medium: 'text-[18px] leading-[1.7]',
    large: 'text-xl leading-[1.75]',
  }[fontSize];

  return (
    <div className={`min-h-screen transition-colors duration-200 ${themeClasses}`}>
      <ProgressBar />

      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 backdrop-blur-md bg-opacity-90 border-b ${
          theme === 'dark' ? 'bg-[#0B0F0D] border-white/10' : theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#FDF6E2] border-[#E5DEB2]'
        } ${navVisible ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-semibold hover:opacity-80 transition-opacity font-sans"
          >
            <ArrowLeft size={16} />
            <span>← Back</span>
          </Link>

          <ReaderControls
            fontSize={fontSize}
            setFontSize={setFontSize}
            theme={theme}
            setTheme={setTheme}
          />
        </div>
      </nav>

      <main className="max-w-[680px] mx-auto px-4 sm:px-6 pt-28 pb-32 flex flex-col gap-8">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono opacity-80">
            <span className="px-2.5 py-1 rounded-md bg-[#16A34A]/15 text-[#16A34A] font-semibold uppercase tracking-wider">
              {paper.source}
            </span>
            {paper.journal && <span>· {paper.journal}</span>}
            <span>· {new Date(paper.publishedAt).toLocaleDateString()}</span>
            {paper.doi && (
              <button
                onClick={handleCopyDoi}
                title="Click to copy DOI"
                className="inline-flex items-center gap-1 hover:underline ml-auto"
              >
                <span>DOI: {paper.doi}</span>
                {copiedDoi ? <Check size={12} className="text-[#16A34A]" /> : <Copy size={12} />}
              </button>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight leading-snug">
            {paper.title}
          </h1>

          <div className="text-sm font-sans opacity-95">
            {paper.authors.map((a) => a.name).join(', ')}
          </div>
        </header>

        <article className={`flex flex-col gap-6 font-sans ${bodySizeClasses}`}>
          <div className="font-semibold text-xs uppercase tracking-widest opacity-60 font-mono">Abstract</div>
          <p className="whitespace-pre-line opacity-90">{paper.abstract || 'No abstract available.'}</p>
        </article>

        <div className="pt-4">
          {paper.openAccessUrl ? (
            <button
              onClick={() => handleGatedAction('fullpaper')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#16A34A] text-black font-bold text-sm rounded-xl hover:bg-[#16A34A]/90 transition-colors shadow-lg font-sans"
            >
              <span>Read full paper</span>
              <ExternalLink size={16} />
            </button>
          ) : (
            <a
              href={paper.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl transition-colors font-sans"
            >
              <span>View source publication</span>
              <ExternalLink size={16} />
            </a>
          )}
        </div>

        <ActionRail paper={paper} onGatedAction={handleGatedAction} />

        <CommentsEmpty onGatedAction={handleGatedAction} />
      </main>

      <SignupGateDialog
        isOpen={gateOpen}
        onClose={() => setGateOpen(false)}
        action={activeAction}
        onSuccess={handleGateSuccess}
      />
    </div>
  );
}
