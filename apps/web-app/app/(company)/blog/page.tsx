import React from 'react';
import Link from 'next/link';
import { Search, Filter, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/animation';

export default function BlogPage() {
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
    <div className="max-w-7xl mx-auto w-full px-6 py-24 flex flex-col gap-16 text-[#F8FAFB]">
      <Reveal>
        <div data-scene-step className="flex flex-col gap-4 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
            Health Blog &amp; Insights
          </span>
          <h1 className="text-4xl sm:text-6xl font-heading font-bold tracking-tight leading-tight">
            Research, Insights &amp; Clinical Updates
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            Expert perspectives on digital healthcare, regulatory compliance, and biotechnology innovations in East Africa.
          </p>
        </div>
      </Reveal>

      {/* Blog Filter Pill Bar */}
      <Reveal delay={0.1}>
        <div
          data-scene-step
          className="w-full h-16 px-6 flex items-center justify-between border border-white/10 bg-[#121814]/90 backdrop-blur-md"
          style={{ borderRadius: '9999px' }}
        >
          <div className="flex items-center gap-4 text-gray-400">
            <Search size={18} />
            <span className="text-sm">Search articles...</span>
          </div>

          <div className="hidden sm:flex items-center gap-6">
            {['All', 'Medical', 'Tech', 'Research'].map((cat, i) => (
              <span
                key={cat}
                className={`text-sm cursor-pointer transition-colors ${i === 0 ? 'text-[#16A34A] font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                {cat}
              </span>
            ))}
            <div className="h-6 w-px bg-white/10 mx-2" />
            <Filter size={18} className="text-gray-400 cursor-pointer hover:text-white" />
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {articles.map((art, index) => (
          <Reveal key={art.title} delay={0.15 + index * 0.08}>
            <div
              data-scene-step
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
  );
}
