import React from 'react';
import Link from 'next/link';
import { Search, Calendar, Clock, ArrowRight } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto w-full px-6 py-20 flex flex-col gap-16">
      <div className="flex flex-col gap-4 max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
          Health Blog &amp; Insights
        </span>
        <h1 className="text-4xl sm:text-5xl font-heading font-bold text-[#1F2A33] tracking-tight">
          Research, Insights &amp; Clinical Updates
        </h1>
        <p className="text-lg text-[#4A5568] leading-relaxed">
          Expert perspectives on digital healthcare, regulatory compliance, and biotechnology innovations in East Africa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {articles.map((art) => (
          <div
            key={art.title}
            className="rounded-[28px] border border-[#B6C2CC]/60 bg-white p-8 shadow-lg flex flex-col justify-between gap-6 transition-all hover:border-[#16A34A]/50 hover:shadow-xl"
            style={{ borderRadius: '28px' }}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#16A34A]/10 text-[#16A34A]">
                  {art.category}
                </span>
                <div className="flex items-center gap-2 text-xs text-[#55636E]">
                  <Clock size={14} />
                  <span>{art.readTime}</span>
                </div>
              </div>
              <h3 className="text-xl font-heading font-bold text-[#1F2A33] leading-snug">{art.title}</h3>
              <p className="text-sm text-[#4A5568] leading-relaxed">{art.excerpt}</p>
            </div>

            <div className="pt-4 border-t border-[#B6C2CC]/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#55636E]">
                <Calendar size={14} />
                <span>{art.date}</span>
              </div>
              <Link href="#" className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A] hover:underline">
                <span>Read</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
