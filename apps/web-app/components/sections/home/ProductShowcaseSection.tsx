"use client";

import React, { useState } from 'react';
import { Database, Microscope, Pill, Activity, ShieldCheck, CheckCircle2, ArrowUpRight } from 'lucide-react';

const TABS = [
  { id: 'core', label: '40LabsCore ERP', icon: Database, badge: 'Pharmacy & Inventory' },
  { id: 'vlabs', label: 'vLabs Diagnostics', icon: Microscope, badge: 'Laboratory Workflow' },
  { id: 'telehealth', label: 'Telehealth & Care', icon: Pill, badge: 'Patient Management' },
  { id: 'analytics', label: 'Intelligence & Reports', icon: Activity, badge: 'Executive Analytics' },
];

export function ProductShowcaseSection() {
  const [activeTab, setActiveTab] = useState('core');

  return (
    <section className="w-full py-28 px-6 relative border-t border-white/5 bg-gradient-to-b from-[#0B0F0D] via-[#101713] to-[#0B0F0D]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            Section C • Product Interface Showcase
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-heading">
            Built Like Real Enterprise Software.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
            Experience the high-performance interface designed for speed, accuracy, and clinical reliability.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 border ${
                  isActive
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20 font-bold'
                    : 'bg-[#141C17] text-zinc-300 border-white/10 hover:border-emerald-500/40 hover:text-white'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Mock Interface Window */}
        <div className="max-w-5xl mx-auto rounded-3xl border border-white/15 bg-[#121815] shadow-2xl overflow-hidden">
          {/* Window Header Bar */}
          <div className="px-6 py-4 bg-[#0B0F0D] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs font-mono text-zinc-400">40labs-secure-gateway://workspace</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono uppercase tracking-wider">
                {TABS.find(t => t.id === activeTab)?.badge}
              </span>
            </div>
          </div>

          {/* Window Content */}
          <div className="p-8 sm:p-12">
            {activeTab === 'core' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white font-heading">40LabsCore ERP — Pharmacy Dispensary</h3>
                    <p className="text-xs text-zinc-400 mt-1">Live inventory sync, TRA fiscal logging, and point-of-sale.</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 size={14} /> TRA EFD Connected
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-5 rounded-2xl bg-[#16201A] border border-white/10">
                    <div className="text-xs text-zinc-400 uppercase tracking-wider">Today Sales (TZS)</div>
                    <div className="text-2xl font-bold text-white mt-2 font-mono">4,850,200 TZS</div>
                    <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">↑ +14.2% vs yesterday</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#16201A] border border-white/10">
                    <div className="text-xs text-zinc-400 uppercase tracking-wider">Prescriptions Filled</div>
                    <div className="text-2xl font-bold text-white mt-2 font-mono">142 Orders</div>
                    <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">100% Verified</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#16201A] border border-white/10">
                    <div className="text-xs text-zinc-400 uppercase tracking-wider">Inventory Alerts</div>
                    <div className="text-2xl font-bold text-yellow-400 mt-2 font-mono">3 Items Low</div>
                    <div className="text-xs text-zinc-400 mt-1">Auto-reorder queued</div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#0E1410] border border-white/10">
                  <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-4">Recent Dispensary Activity</div>
                  <div className="space-y-3">
                    {[
                      { item: 'Amoxicillin 500mg Capsules', qty: '2 Boxes', time: '2 mins ago', status: 'Completed' },
                      { item: 'Paracetamol 500mg Tabs', qty: '10 Strips', time: '7 mins ago', status: 'Completed' },
                      { item: 'Insulin Glargine 100IU/ml', qty: '1 Vial', time: '15 mins ago', status: 'Verified' },
                    ].map((row, idx) => (
                      <div key={idx} className="flex items-center justify-between py-3 border-b border-white/5 text-xs">
                        <div className="font-medium text-white">{row.item}</div>
                        <div className="text-zinc-400 font-mono">{row.qty}</div>
                        <div className="text-zinc-500">{row.time}</div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">{row.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vlabs' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-xl font-bold text-white font-heading">vLabs — Laboratory Diagnostics Workflow</h3>
                  <p className="text-xs text-zinc-400 mt-1">Automated sample intake, analyzer integration, and instant clinician alerts.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-[#16201A] border border-white/10 space-y-4">
                    <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Active Sample Queue</div>
                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-black/40 flex justify-between items-center border border-white/5">
                        <span className="font-mono text-white">#LAB-8902 • Complete Blood Count</span>
                        <span className="text-yellow-400 font-mono">Analyzing (85%)</span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/40 flex justify-between items-center border border-white/5">
                        <span className="font-mono text-white">#LAB-8901 • Malaria Rapid Screen</span>
                        <span className="text-emerald-400 font-mono">Completed (Negative)</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-[#16201A] border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Quality Assurance</div>
                      <p className="text-xs text-zinc-300 leading-relaxed">All diagnostic analyzers maintain automated calibration logs verified against national health standards.</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                      <span>System Accuracy</span>
                      <span className="font-bold text-emerald-400 font-mono">99.94%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'telehealth' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-xl font-bold text-white font-heading">Telehealth & Care Management</h3>
                  <p className="text-xs text-zinc-400 mt-1">Connecting patients with verified specialists across Tanzania.</p>
                </div>
                <div className="p-6 rounded-2xl bg-[#16201A] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Secure Video Consultation</span>
                    <h4 className="text-lg font-bold text-white">Dr. Amina Mhando & Patient #40-9921</h4>
                    <p className="text-xs text-zinc-400">Encrypted peer-to-peer connection with live vitals streaming.</p>
                  </div>
                  <div className="px-6 py-3 rounded-xl bg-emerald-500 text-black font-bold text-xs">
                    Session Active (14:22)
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-xl font-bold text-white font-heading">Executive Intelligence & Analytics</h3>
                  <p className="text-xs text-zinc-400 mt-1">Real-time health ecosystem metrics and predictive supply forecasting.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-5 rounded-2xl bg-[#16201A] border border-white/10">
                    <div className="text-xs text-zinc-400 uppercase tracking-wider">Network Utilization</div>
                    <div className="text-2xl font-bold text-white mt-2 font-mono">88.4%</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#16201A] border border-white/10">
                    <div className="text-xs text-zinc-400 uppercase tracking-wider">Active Providers</div>
                    <div className="text-2xl font-bold text-white mt-2 font-mono">1,420+</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#16201A] border border-white/10">
                    <div className="text-xs text-zinc-400 uppercase tracking-wider">Data Latency</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">&lt; 45ms</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
