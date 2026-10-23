"use client";

import React from 'react';
import { ArrowRight } from 'lucide-react';

export function HeroOverlapCards() {
  const handleAction = (actionName: string) => {
    // TODO: wire auth [no backend yet] [post-MVP]
    console.log(`${actionName} stub clicked`);
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-20 lg:py-28 flex flex-col items-center relative">
      {/* Central Hero Staggered Overlap Area */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-0 lg:items-center relative min-h-[520px] py-12">

        {/* LEFT CARD: Orange Telemed Card */}
        <div
          className="lg:absolute lg:left-0 lg:top-1/2 lg:-translate-y-1/2 lg:w-[380px] z-10 p-8 rounded-[24px] flex flex-col justify-between shadow-2xl transition-all duration-300 hover:scale-[1.02]"
          style={{
            backgroundColor: '#F97316',
            color: '#FFFFFF',
            borderRadius: '24px',
            minHeight: '380px',
            boxShadow: '0 20px 40px rgba(249, 115, 22, 0.25)',
          }}
        >
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest bg-black/10 px-3 py-1 rounded-full inline-block">
              Telemed
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold leading-snug">
              Meet with Your patients Easily &amp; Remotely
            </h2>
            <p className="text-sm opacity-90 leading-relaxed">
              Deliver your most best service
            </p>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleAction("Start Free (Telemed)")}
              className="px-6 py-3 rounded-full text-sm font-bold flex items-center justify-between gap-3 shadow-lg transition-transform active:scale-95 w-full sm:w-auto"
              style={{
                backgroundColor: '#1F2A33',
                color: '#FFFFFF',
                borderRadius: '9999px',
              }}
            >
              Start Free
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* CENTRE & HIGHEST CARD: Deep-Green Management Card */}
        <div
          className="lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:top-1/2 lg:-translate-y-[58%  lg:w-[420px] z-30 p-10 rounded-[28px] flex flex-col justify-between shadow-2xl transition-all duration-300 hover:scale-[1.03]"
          style={{
            backgroundColor: '#14532D',
            color: '#F8FAFB',
            borderRadius: '28px',
            minHeight: '440px',
            boxShadow: '0 25px 50px rgba(20, 83, 45, 0.4)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full inline-block">
              Enterprise Hub
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold leading-tight">
              Manage Your Health Business
            </h2>
            <p className="text-sm text-zinc-200 leading-relaxed">
              Meet &amp; Create Distribution Chains. Do more with us!!
            </p>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleAction("Start Free (Management)")}
              className="px-8 py-3.5 rounded-full text-sm font-bold flex items-center justify-between gap-3 shadow-xl transition-transform active:scale-95 w-full sm:w-auto"
              style={{
                backgroundColor: '#1F2A33',
                color: '#FFFFFF',
                borderRadius: '9999px',
              }}
            >
              Start Free
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* RIGHT CARD: White Insights Card */}
        <div
          className="lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 lg:w-[380px] z-20 p-8 rounded-[24px] flex flex-col justify-between shadow-2xl transition-all duration-300 hover:scale-[1.02]"
          style={{
            backgroundColor: '#FFFFFF',
            color: '#1F2A33',
            borderRadius: '24px',
            minHeight: '380px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            border: '1px solid #B6C2CC',
          }}
        >
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest bg-slate-100 text-slate-700 px-3 py-1 rounded-full inline-block">
              Intelligence
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold leading-snug">
              Generating insights From Your Med Data
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Utilize Our Best computation and AI intelligent tools
            </p>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleAction("Explore More (Insights)")}
              className="px-6 py-3 rounded-full text-sm font-bold flex items-center justify-between gap-3 shadow-lg transition-transform active:scale-95 w-full sm:w-auto"
              style={{
                backgroundColor: '#1F2A33',
                color: '#FFFFFF',
                borderRadius: '9999px',
              }}
            >
              Explore More
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
