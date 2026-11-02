import React from 'react';
import Link from 'next/link';
import { Search, Filter, Calendar, Clock, ArrowRight, ExternalLink, BookOpen, Bookmark, Share2 } from 'lucide-react';
import { Reveal } from '@/components/animation';
import { getFeed } from '@/lib/research/feed';
import { BOARD_NAME, BOARD_TAGLINE, DEFAULT_TOPICS } from '@/config/board';
import { FeedResult } from '@/lib/research/types';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; topic?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q;
  const topic = resolvedSearchParams.topic;

  let feedResult: FeedResult = { papers: [], total: 0, page: 1, pageSize: 12, degraded: undefined };
  try {
    feedResult = await getFeed({ q, topic, pageSize: 9 });
  } catch (err) {
    console.error('Failed to load research feed on blog page:', err);
  }

  const articles = [
    {
      title: 'Digital Transformation in Tanzanian Pharmacies: TRA Fiscal Sync & Beyond',
      excerpt: 'How automated electronic fiscal device integration is reducing audit friction and boosting financial transparency across independent pharmacies.',
      category: 'Medical Tech',
      date: 'May 12, 2025',
      readTime: '4 min read',
    },
    {
      title: 'Integrating Laboratory Diagnostics with Electronic Medical Records',
      excerpt: 'Bridging the gap between pathology results and clinical prescription workflows to improve patient turnaround times.',
      category: 'Clinical Operations',
      date: 'May 04, 2025',
      readTime: '6 min read',
    },
    {
      title: 'AI-Driven Inventory Forecasting for Essential Medicines in East Africa',
      excerpt: 'Leveraging predictive analytics and historical consumption data to eliminate stockouts of critical pharmaceuticals.',
      category: 'AI & Research',
      date: 'Apr 28, 2025',
      readTime: '5 min read',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-24 flex flex-col gap-20 text-[#F8FAFB]">
      <Reveal>
        <div data-scene-step className="flex flex-col gap-4 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
            {BOARD_NAME} &bull; Health Blog &amp; Scholarly Insights
          </span>
          <h1 className="text-4xl sm:text-6xl font-heading font-bold tracking-tight leading-tight">
            Research, Clinical Intelligence &amp; Updates
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            {BOARD_TAGLINE}. Powered by live scholarly feeds from PubMed, OpenAlex, and Europe PMC.
          </p>
        </div>
      </Reveal>

      {/* Search & Topic Filter Bar */}
      <Reveal delay={0.1}>
        <form
          method="GET"
          data-scene-step
          className="w-full px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10 bg-[#121814]/90 backdrop-blur-md rounded-3xl"
        >
          <div className="flex items-center gap-4 text-gray-400 w-full md:w-auto flex-1">
            <Search size={18} className="shrink-0 text-[#16A34A]" />
            <input
              type="text"
              name="q"
              defaultValue={q || ''}
              placeholder="Search scholarly papers and clinical topics..."
              className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Link
              href="/blog"
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                !topic ? 'bg-[#16A34A] text-black font-bold' : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              All Topics
            </Link>
            {DEFAULT_TOPICS.slice(0, 5).map((t) => (
              <Link
                key={t}
                href={`/blog?topic=${encodeURIComponent(t)}`}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  topic === t ? 'bg-[#16A34A] text-black font-bold' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {t}
              </Link>
            ))}
            <button
              type="submit"
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#16A34A] text-black hover:bg-[#16A34A]/90 transition-all shrink-0"
            >
              Filter
            </button>
          </div>
        </form>
      </Reveal>

      {/* Degradation Warning Banner if any source failed */}
      {feedResult.degraded && feedResult.degraded.length > 0 && (
        <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
          <span>⚠️ Note: Some research sources ({feedResult.degraded.join(', ')}) are temporarily degraded. Showing available results from active sources.</span>
        </div>
      )}

      {/* Live Scholarly Feed Section (Jarida Backend Integration) */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="text-[#16A34A]" size={24} />
            <h2 className="text-2xl font-heading font-bold text-white">
              Live Scholarly Feed ({feedResult.total} papers found)
            </h2>
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">Source: PubMed / OpenAlex / Europe PMC</span>
        </div>

        {feedResult.papers.length === 0 ? (
          <div className="p-12 text-center rounded-[32px] border border-white/10 bg-[#121814]/50 text-gray-400 flex flex-col items-center gap-4">
            <p>No research papers found matching your query. Try searching for broader medical or clinical terms.</p>
            <Link href="/blog" className="px-4 py-2 rounded-full text-xs font-bold bg-[#16A34A] text-black">
              Reset Filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {feedResult.papers.map((paper: any, index: number) => (
              <Reveal key={paper.id} delay={0.05 * (index % 6)}>
                <div
                  className="rounded-[32px] border border-white/10 bg-[#121814]/90 backdrop-blur-md p-8 shadow-xl flex flex-col justify-between gap-6 h-full transition-all hover:border-[#16A34A]/50 hover:shadow-2xl"
                  style={{ borderRadius: '32px' }}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#16A34A]/20 text-[#16A34A] uppercase tracking-wider">
                        {paper.source}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar size={14} />
                        <span>{new Date(paper.publishedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-heading font-bold text-white leading-snug line-clamp-2">
                      {paper.title}
                    </h3>

                    <p className="text-xs text-gray-400 font-medium">
                      Authors: {paper.authors.map((a: any) => a.name).slice(0, 3).join(', ')}
                      {paper.authors.length > 3 ? ' et al.' : ''}
                    </p>

                    {paper.journal && (
                      <p className="text-xs text-[#16A34A] font-semibold italic">{paper.journal}</p>
                    )}

                    <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">
                      {paper.abstract || 'No abstract available for this publication.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {paper.openAccessUrl && (
                        <a
                          href={paper.openAccessUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A] hover:underline"
                        >
                          <span>Open Access</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    <a
                      href={paper.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-gray-300 hover:text-white"
                    >
                      <span>Source</span>
                      <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {/* Editorial Insights Section */}
      <div className="flex flex-col gap-8 pt-12 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold text-white">Editorial Insights &amp; Case Studies</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((art, index) => (
            <Reveal key={art.title} delay={0.15 + index * 0.08}>
              <div
                className="rounded-[32px] border border-white/10 bg-[#121814]/90 backdrop-blur-md p-8 shadow-xl flex flex-col justify-between gap-6 h-full transition-all hover:border-[#16A34A]/50 hover:shadow-2xl"
                style={{ borderRadius: '32px' }}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#16A34A]/20 text-[#16A34A]">
                      {art.category}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock size={14} />
                      <span>{art.readTime}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-heading font-bold text-white leading-snug">{art.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{art.excerpt}</p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar size={14} />
                    <span>{art.date}</span>
                  </div>
                  <Link href="#" className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A] hover:underline">
                    <span>Read</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
