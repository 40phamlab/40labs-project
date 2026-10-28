import React from 'react';
import Link from 'next/link';
import { Database, Beaker, LayoutDashboard, Pill, ShieldCheck, ArrowRight } from 'lucide-react';

export default function ProductsPage() {
  const products = [
    {
      name: '40LabsCore',
      badge: 'ERP & Inventory',
      description: 'Desktop and cloud ERP for modern pharmacies and clinics. Real-time stock management, sales tracking, and automated reordering.',
      icon: Database,
      features: ['TRA EFD Integration', 'Multi-branch sync', 'Batch expiry alerts', 'Offline capability'],
    },
    {
      name: 'vLabs',
      badge: 'Diagnostics',
      description: 'Virtual lab management system connecting diagnostic workflows, test ordering, and electronic health records.',
      icon: Beaker,
      features: ['Automated test results', 'Patient portal sync', 'Quality control tracking', 'Barcode sample scanning'],
    },
    {
      name: 'aDesk',
      badge: 'Analytics & Admin',
      description: 'Administrative command center providing deep financial insights, epidemiological trends, and executive reporting.',
      icon: LayoutDashboard,
      features: ['Revenue analytics', 'Staff performance metrics', 'Custom report builder', 'Audit logging'],
    },
    {
      name: 'e-Pharmacy',
      badge: 'Marketplace',
      description: 'Direct-to-consumer and B2B pharmaceutical procurement marketplace connecting verified suppliers with healthcare providers.',
      icon: Pill,
      features: ['Verified suppliers', 'Secure escrow payments', 'Scheduled bulk orders', 'Regulatory compliance check'],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-20 flex flex-col gap-16">
      <div className="flex flex-col gap-4 max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
          Enterprise Software Suite
        </span>
        <h1 className="text-4xl sm:text-5xl font-heading font-bold text-[#1F2A33] tracking-tight">
          Engineered for East African Healthcare
        </h1>
        <p className="text-lg text-[#4A5568] leading-relaxed">
          Discover our integrated suite of clinical, inventory, and analytical tools designed to eliminate friction across the entire healthcare supply chain.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {products.map((prod) => {
          const Icon = prod.icon;
          return (
            <div
              key={prod.name}
              className="rounded-[28px] border border-[#B6C2CC]/60 bg-white p-8 sm:p-10 shadow-lg flex flex-col justify-between gap-8 transition-all hover:border-[#16A34A]/50 hover:shadow-xl"
              style={{ borderRadius: '28px' }}
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center">
                    <Icon size={24} />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E4E9EC] text-[#1F2A33]">
                    {prod.badge}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-heading font-bold text-[#1F2A33]">{prod.name}</h3>
                  <p className="text-sm text-[#4A5568] leading-relaxed">{prod.description}</p>
                </div>
                <ul className="grid grid-cols-2 gap-2.5 pt-4 border-t border-[#B6C2CC]/30">
                  {prod.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-xs text-[#55636E]">
                      <ShieldCheck size={14} className="text-[#16A34A] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#16A34A] hover:text-[#12803b] group"
              >
                <span>Request a Demo</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
