import React from 'react';
import Link from 'next/link';
import { Database, ShieldCheck, ArrowRight } from 'lucide-react';

export default function CoreSitePage() {
  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-20 flex flex-col gap-16">
      <div className="flex flex-col gap-4 max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
          40LabsCore System
        </span>
        <h1 className="text-4xl sm:text-5xl font-heading font-bold text-[#1F2A33] tracking-tight">
          The Desktop &amp; Cloud ERP for Modern Pharmacies
        </h1>
        <p className="text-lg text-[#4A5568] leading-relaxed">
          40LabsCore combines offline-first desktop reliability with lightning-fast cloud synchronization for inventory, prescription dispensing, and fiscal invoicing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-[28px] border border-[#B6C2CC]/60 bg-white p-8 shadow-lg flex flex-col gap-6" style={{ borderRadius: '28px' }}>
          <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center">
            <Database size={24} />
          </div>
          <h3 className="text-2xl font-heading font-bold text-[#1F2A33]">Offline-First Architecture</h3>
          <p className="text-sm text-[#4A5568] leading-relaxed">
            Never experience downtime during internet outages. 40LabsCore stores transactions locally and syncs securely with cloud databases as soon as connectivity is restored.
          </p>
        </div>

        <div className="rounded-[28px] border border-[#B6C2CC]/60 bg-white p-8 shadow-lg flex flex-col gap-6" style={{ borderRadius: '28px' }}>
          <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-2xl font-heading font-bold text-[#1F2A33]">Regulatory Compliance</h3>
          <p className="text-sm text-[#4A5568] leading-relaxed">
            Pre-integrated with Tanzania Revenue Authority (TRA) fiscal standards and Pharmacy Council guidelines for automated reporting and zero compliance friction.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/products"
          className="px-8 py-3.5 rounded-full text-sm font-bold bg-[#16A34A] text-white hover:bg-[#12803b] transition-transform active:scale-95"
          style={{ borderRadius: '9999px' }}
        >
          Explore All Products
        </Link>
        <Link
          href="/services"
          className="px-8 py-3.5 rounded-full text-sm font-bold bg-[#1F2A33] text-white hover:bg-black transition-transform active:scale-95"
          style={{ borderRadius: '9999px' }}
        >
          View Services
        </Link>
      </div>
    </div>
  );
}
