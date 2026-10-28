import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Database, Beaker, LayoutDashboard, Pill, ShieldCheck, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/animation';

export default function ProductsPage() {
  const products = [
    {
      name: '40LabsCore',
      badge: 'ERP & Inventory',
      description: 'Desktop and cloud ERP for modern pharmacies and clinics. Real-time stock management, sales tracking, and automated reordering with offline capability.',
      icon: Database,
      features: ['TRA EFD Integration', 'Multi-branch sync', 'Batch expiry alerts', 'Offline capability'],
      image: '/media/picture/medd_accounting.png',
    },
    {
      name: 'vLabs',
      badge: 'Diagnostics',
      description: 'Virtual lab management system connecting diagnostic workflows, test ordering, and electronic health records seamlessly.',
      icon: Beaker,
      features: ['Automated test results', 'Patient portal sync', 'Quality control tracking', 'Barcode sample scanning'],
      image: '/media/picture/seq.png',
    },
    {
      name: 'aDesk',
      badge: 'Analytics & Admin',
      description: 'Administrative command center providing deep financial insights, epidemiological trends, and executive reporting across operations.',
      icon: LayoutDashboard,
      features: ['Revenue analytics', 'Staff performance metrics', 'Custom report builder', 'Audit logging'],
      image: '/media/picture/telemed_doctor.png',
    },
    {
      name: 'e-Pharmacy',
      badge: 'Marketplace',
      description: 'Direct-to-consumer and B2B pharmaceutical procurement marketplace connecting verified suppliers with healthcare providers.',
      icon: Pill,
      features: ['Verified suppliers', 'Secure escrow payments', 'Scheduled bulk orders', 'Regulatory compliance check'],
      image: '/media/picture/medd_accounting.png',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-24 flex flex-col gap-20 text-[#F8FAFB]">
      {/* Header */}
      <Reveal>
        <div data-scene-step className="flex flex-col gap-4 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
            Enterprise Software Suite
          </span>
          <h1 className="text-4xl sm:text-6xl font-heading font-bold tracking-tight leading-tight">
            Engineered for East African Healthcare
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            Discover our integrated suite of clinical, inventory, and analytical tools designed to eliminate friction across the entire healthcare supply chain.
          </p>
        </div>
      </Reveal>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {products.map((prod, index) => {
          const Icon = prod.icon;
          return (
            <Reveal key={prod.name} delay={index * 0.1}>
              <div
                data-scene-step
                className="rounded-[32px] border border-white/10 bg-[#121814]/90 backdrop-blur-md p-8 sm:p-10 shadow-xl flex flex-col justify-between gap-8 h-full transition-all hover:border-[#16A34A]/50 hover:shadow-2xl"
                style={{ borderRadius: '32px' }}
              >
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/20 text-[#16A34A] flex items-center justify-center">
                      <Icon size={24} />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-gray-200">
                      {prod.badge}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <h3 className="text-2xl font-heading font-bold text-white">{prod.name}</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{prod.description}</p>
                  </div>

                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 my-2">
                    <Image
                      src={prod.image}
                      alt={prod.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <ul className="grid grid-cols-2 gap-2.5 pt-4 border-t border-white/10">
                    {prod.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-xs text-gray-300">
                        <ShieldCheck size={14} className="text-[#16A34A] shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#16A34A] hover:text-[#1ab752] group"
                >
                  <span>Request a Demo</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
