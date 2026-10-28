import React from 'react';
import Link from 'next/link';
import { FileText, Download, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/animation';

export default function PublicationsPage() {
  const papers = [
    {
      title: 'Pathogen Surveillance via High-Throughput Genomic Sequencing in East African Clinical Centers',
      journal: 'East African Journal of Medical Informatics & AI',
      date: 'March 2025',
      type: 'Whitepaper',
    },
    {
      title: 'Automated Fiscal Compliance in Pharmaceutical Supply Chains: TRA EFRIS Integration Study',
      journal: 'Journal of Health Economics & Regulatory Policy',
      date: 'January 2025',
      type: 'Research Article',
    },
    {
      title: 'Optimizing Inventory Turnover and Preventing Stockouts in Resource-Constrained Dispensaries',
      journal: 'Clinical Operations & Pharmacy Review',
      date: 'November 2024',
      type: 'Case Study',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-24 flex flex-col gap-16 text-[#F8FAFB]">
      <Reveal>
        <div data-scene-step className="flex flex-col gap-4 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
            Research &amp; Publications
          </span>
          <h1 className="text-4xl sm:text-6xl font-heading font-bold tracking-tight leading-tight">
            Peer-Reviewed Research &amp; Clinical Whitepapers
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            Explore our scientific contributions, clinical trial summaries, and empirical research reports on digital healthcare technology.
          </p>
        </div>
      </Reveal>

      <div className="flex flex-col gap-6">
        {papers.map((paper, index) => (
          <Reveal key={paper.title} delay={index * 0.1}>
            <div
              data-scene-step
              className="rounded-[32px] border border-white/10 bg-[#121814]/90 backdrop-blur-md p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all hover:border-[#16A34A]/50"
              style={{ borderRadius: '32px' }}
            >
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/20 text-[#16A34A] flex items-center justify-center shrink-0 mt-1 md:mt-0">
                  <FileText size={24} />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-gray-200">
                      {paper.type}
                    </span>
                    <span className="text-xs text-gray-400">{paper.date}</span>
                  </div>
                  <h3 className="text-xl font-heading font-bold text-white leading-snug">{paper.title}</h3>
                  <p className="text-sm font-medium text-[#16A34A]">{paper.journal}</p>
                </div>
              </div>

              <Link
                href="#"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold bg-[#F97316] text-white hover:bg-orange-600 transition-transform active:scale-95 shrink-0"
                style={{ borderRadius: '9999px' }}
              >
                <Download size={14} />
                <span>Download PDF</span>
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
