"use client";

import React from 'react';
import { ShieldCheck, Activity, Database, Microscope, Pill, Stethoscope, Cpu, Sparkles } from 'lucide-react';

const CAPABILITIES = [
  {
    title: 'Healthcare Operations',
    desc: 'Complete ERP and clinic management designed for East African healthcare providers with fiscal and inventory compliance.',
    icon: Database,
  },
  {
    title: 'Laboratory Infrastructure',
    desc: 'vLabs automated diagnostic ordering, sample tracking, and secure result delivery straight to patient records.',
    icon: Microscope,
  },
  {
    title: 'Pharmacy & Dispensary',
    desc: 'Real-time stock control, prescription verification, TRA EFD fiscal receipts, and supplier reordering in one workflow.',
    icon: Pill,
  },
  {
    title: 'Telehealth & Care',
    desc: 'Secure remote consultations, digital prescriptions, and continuous patient monitoring across regions.',
    icon: Stethoscope,
  },
  {
    title: 'Healthcare Professionals',
    desc: 'Verified network of doctors, specialists, nurses, and pharmacists collaborating under strict security standards.',
    icon: ShieldCheck,
  },
  {
    title: 'Intelligence & Research',
    desc: 'Advanced predictive analytics, disease surveillance reporting, and clinical data insights for public health impact.',
    icon: Cpu,
  },
];

export function DiscoverEcosystemSection() {
  return (
    <section className="w-full py-28 px-6 relative border-t border-white/5 bg-[#0B0F0D]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            Section B • Unified Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-heading">
            Discover the 40Labs Capability Spectrum.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
            All capabilities are engineered as modules of a single cohesive platform—not competing standalone products.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CAPABILITIES.map((cap, i) => {
            const IconComp = cap.icon;
            return (
              <div
                key={i}
                className="group p-8 rounded-3xl border border-white/10 bg-[#121815] transition-all duration-300 hover:border-emerald-500/50 hover:bg-[#16201A] shadow-xl relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />

                <div>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                    <IconComp size={26} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 font-heading">
                    {cap.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {cap.desc}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-emerald-400 font-semibold">
                  <span>Explore Module</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
