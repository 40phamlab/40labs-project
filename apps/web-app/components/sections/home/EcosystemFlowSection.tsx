"use client";

import React from 'react';
import { Users, Stethoscope, Building2, Microscope, Pill, Truck, Cpu, ArrowRight } from 'lucide-react';
import { darkTokens } from '@40labs/design-tokens';

const ECOSYSTEM_STEPS = [
  { step: '01', title: 'Patient', desc: 'Unified digital health record and care access.', icon: Users },
  { step: '02', title: 'Doctor', desc: 'Clinical consultations, e-prescriptions & history.', icon: Stethoscope },
  { step: '03', title: 'Clinic', desc: 'Facility scheduling, patient flow & triage.', icon: Building2 },
  { step: '04', title: 'Laboratory', desc: 'vLabs automated diagnostic orders & results.', icon: Microscope },
  { step: '05', title: 'Pharmacy', desc: '40LabsCore dispensing, inventory & TRA EFD.', icon: Pill },
  { step: '06', title: 'Supply Chain', desc: 'Wholesale distribution & medicine tracking.', icon: Truck },
  { step: '07', title: 'Intelligence', desc: 'AI predictive analytics & clinical research.', icon: Cpu },
];

export function EcosystemFlowSection() {
  return (
    <section className="w-full py-28 px-6 relative border-t border-white/5 bg-gradient-to-b from-[#0B0F0D] via-[#0E1410] to-[#0B0F0D]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            Section A • The Living Ecosystem
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-heading">
            One 40Labs Ecosystem. Connecting Every Healthcare Touchpoint.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
            Patients, doctors, clinics, laboratories, pharmacies, and suppliers are connected seamlessly through a single continuous digital fabric.
          </p>
        </div>

        {/* Ecosystem Pipeline Visual */}
        <div className="relative">
          {/* Connecting gradient line for desktop */}
          <div className="hidden lg:block absolute top-1/2 left-10 right-10 h-0.5 -translate-y-1/2 bg-gradient-to-r from-emerald-500/20 via-emerald-500/60 to-emerald-500/20 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 relative z-10">
            {ECOSYSTEM_STEPS.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.step}
                  className="group relative flex flex-col p-6 rounded-2xl border border-white/10 bg-[#141C17]/80 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-emerald-500/60 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                      <IconComp size={22} />
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-500 group-hover:text-emerald-400 transition-colors">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 font-heading">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>

                  {idx < ECOSYSTEM_STEPS.length - 1 && (
                    <div className="lg:hidden flex justify-center my-3 text-emerald-500/40">
                      <ArrowRight size={16} className="rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Callout */}
        <div className="mt-16 p-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/30 via-[#141C17] to-emerald-950/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-lg font-bold text-white font-heading">No fragmented software silos.</h4>
            <p className="text-sm text-zinc-400 mt-1">Every stakeholder logs into the same unified 40Labs account, accessing the exact tools required for their role.</p>
          </div>
          <div className="px-6 py-3 rounded-full bg-emerald-500 text-black font-bold text-sm shrink-0 shadow-lg shadow-emerald-500/20">
            One Account for All Services
          </div>
        </div>
      </div>
    </section>
  );
}
