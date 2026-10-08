"use client";

import React from 'react';
import { Cpu, Sparkles, TrendingUp, ShieldCheck, Network } from 'lucide-react';

export function IntelligenceSection() {
  return (
    <section className="w-full py-28 px-6 relative border-t border-white/5 bg-[#0B0F0D]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            Section D • Ecosystem Intelligence
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-heading">
            Powered by Clinical AI & Advanced Data Modeling.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
            Predictive inventory, disease surveillance, and scientific simulation models built for modern healthcare.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Feature Card */}
          <div className="p-10 rounded-3xl border border-white/10 bg-[#121815] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                <TrendingUp size={26} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-heading">
                Predictive Supply Chain & Stock Optimization
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Machine learning models analyze regional disease incidence, seasonal trends, and consumption velocity to automatically forecast medicine requirements across pharmacies and hospitals.
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>Forecast Precision</span>
              <span className="text-emerald-400 font-bold">98.2% Accuracy</span>
            </div>
          </div>

          {/* Right Feature Card */}
          <div className="p-10 rounded-3xl border border-white/10 bg-[#121815] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                <Network size={26} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-heading">
                Secure Epidemiological Insights & Surveillance
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Anonymized aggregate health metrics empower public health officials with real-time visibility into outbreak patterns, diagnostic trends, and pharmaceutical demand across East Africa.
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>Data Protection</span>
              <span className="text-emerald-400 font-bold">Zero-Knowledge Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
