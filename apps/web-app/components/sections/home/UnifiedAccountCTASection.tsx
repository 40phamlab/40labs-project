"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { darkTokens } from '@40labs/design-tokens';

export function UnifiedAccountCTASection() {
  return (
    <section className="w-full py-28 px-6 relative border-t border-white/5 bg-gradient-to-t from-[#0B0F0D] via-[#101713] to-[#0B0F0D] text-center">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles size={14} /> One Unified Ecosystem
        </div>

        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white font-heading leading-tight">
          Ready to enter the future of African healthcare?
        </h2>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-400 leading-relaxed">
          Create your <span className="text-white font-semibold">One 40Labs Account</span> today and instantly unlock access to pharmacies, laboratories, clinics, and intelligent tools.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href="/products"
            className="px-8 py-4 rounded-full bg-emerald-500 text-black font-bold text-base hover:bg-emerald-400 transition-transform active:scale-95 shadow-xl shadow-emerald-500/20 flex items-center gap-2.5"
          >
            Get Started with 40Labs
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/about"
            className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-semibold text-base transition-colors border border-white/10"
          >
            Learn More About Our Mission
          </Link>
        </div>

        <div className="pt-8 flex flex-wrap justify-center items-center gap-6 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-400" /> TMDA & Pharmacy Council Aligned</span>
          <span>•</span>
          <span>TRA EFD Fiscal Ready</span>
          <span>•</span>
          <span>Secure Cloud Infrastructure</span>
        </div>
      </div>
    </section>
  );
}
