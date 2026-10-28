import React from 'react';
import Link from 'next/link';
import { Cpu, Stethoscope, FileText, CheckCircle2 } from 'lucide-react';

export default function ServicesPage() {
  const services = [
    {
      title: 'Clinical System Deployment & Migration',
      description: 'End-to-end implementation of 40Labs Core across multi-branch hospitals, clinics, and pharmacies with zero downtime during data migration.',
      icon: Stethoscope,
    },
    {
      title: 'TRA Fiscal & Regulatory Integration',
      description: 'Seamless configuration of Tanzania Revenue Authority (EFRIS/EFD) fiscal devices, pharmacy council compliance reporting, and automated auditing.',
      icon: FileText,
    },
    {
      title: 'Genomic & Epidemiological Sequencing Pipelines',
      description: 'Custom bioinformatic data pipelines and AI model integration for high-throughput genomic analysis and pathogen surveillance.',
      icon: Cpu,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-20 flex flex-col gap-16">
      <div className="flex flex-col gap-4 max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
          Professional Services
        </span>
        <h1 className="text-4xl sm:text-5xl font-heading font-bold text-[#1F2A33] tracking-tight">
          Expert Healthcare &amp; Tech Consultation
        </h1>
        <p className="text-lg text-[#4A5568] leading-relaxed">
          Our team of clinical specialists, software architects, and regulatory experts ensure your institution meets the highest operational standards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {services.map((srv) => {
          const Icon = srv.icon;
          return (
            <div
              key={srv.title}
              className="rounded-[28px] border border-[#B6C2CC]/60 bg-white p-8 shadow-lg flex flex-col justify-between gap-8"
              style={{ borderRadius: '28px' }}
            >
              <div className="flex flex-col gap-6">
                <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center">
                  <Icon size={24} />
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-xl font-heading font-bold text-[#1F2A33]">{srv.title}</h3>
                  <p className="text-sm text-[#4A5568] leading-relaxed">{srv.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#16A34A]">
                <CheckCircle2 size={16} />
                <span>Dedicated Enterprise Support</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-[32px] bg-[#1F2A33] text-white p-10 sm:p-14 flex flex-col sm:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-3 max-w-xl">
          <h3 className="text-2xl font-heading font-bold">Ready to modernize your infrastructure?</h3>
          <p className="text-sm text-gray-300">Schedule a technical consultation with our East Africa deployment team.</p>
        </div>
        <Link
          href="/about"
          className="px-8 py-3.5 rounded-full text-sm font-bold bg-[#F97316] text-white hover:bg-orange-600 transition-transform active:scale-95 shrink-0"
        >
          Contact Our Team
        </Link>
      </div>
    </div>
  );
}
