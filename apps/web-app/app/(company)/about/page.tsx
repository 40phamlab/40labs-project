import React from 'react';
import Link from 'next/link';
import { Shield, Users, Globe, Award, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { label: 'Partner Clinics & Pharmacies', value: '250+' },
    { label: 'Patient Records Managed', value: '1.2M+' },
    { label: 'TRA Compliant Invoices', value: '15M+' },
    { label: 'Regional Team Experts', value: '40+' },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-20 flex flex-col gap-20">
      <div className="flex flex-col gap-4 max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
          About 40Labs
        </span>
        <h1 className="text-4xl sm:text-5xl font-heading font-bold text-[#1F2A33] tracking-tight">
          Powering the Digital Future of East African Healthcare
        </h1>
        <p className="text-lg text-[#4A5568] leading-relaxed">
          Founded with a vision to eliminate friction across clinical operations, 40Labs builds secure, high-performance software connecting patients, pharmacies, and suppliers.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((st) => (
          <div
            key={st.label}
            className="rounded-[24px] border border-[#B6C2CC]/60 bg-white p-6 shadow-md flex flex-col gap-2 text-center"
            style={{ borderRadius: '24px' }}
          >
            <span className="text-3xl sm:text-4xl font-heading font-bold text-[#16A34A]">{st.value}</span>
            <span className="text-xs font-medium text-[#55636E]">{st.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            title: 'Clinical Excellence',
            description: 'Designed in close collaboration with leading medical practitioners and regulatory bodies in Tanzania.',
            icon: Shield,
          },
          {
            title: 'Patient-Centric Security',
            description: 'Strict adherence to medical data privacy standards, secure encryption, and role-based access control.',
            icon: Users,
          },
          {
            title: 'Regional Impact',
            description: 'Empowering independent pharmacies and multi-department hospitals with world-class cloud and desktop ERP tools.',
            icon: Globe,
          },
        ].map((val) => {
          const Icon = val.icon;
          return (
            <div
              key={val.title}
              className="rounded-[28px] border border-[#B6C2CC]/60 bg-white p-8 shadow-lg flex flex-col gap-6"
              style={{ borderRadius: '28px' }}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center">
                <Icon size={24} />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-heading font-bold text-[#1F2A33]">{val.title}</h3>
                <p className="text-sm text-[#4A5568] leading-relaxed">{val.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
