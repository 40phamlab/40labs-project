import React from 'react';
import { Shield, Users, Globe } from 'lucide-react';
import { Reveal } from '@/components/animation';
import { TrustedBySection } from '@/components/company/TrustedBySection';

export default function AboutPage() {
  const stats = [
    { label: 'Partner Clinics & Pharmacies', value: '250+' },
    { label: 'Patient Records Managed', value: '1.2M+' },
    { label: 'TRA Compliant Invoices', value: '15M+' },
    { label: 'Regional Team Experts', value: '40+' },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-24 flex flex-col gap-20 text-[#F8FAFB]">
      <Reveal>
        <div data-scene-step className="flex flex-col gap-4 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">
            About 40Labs
          </span>
          <h1 className="text-4xl sm:text-6xl font-heading font-bold tracking-tight leading-tight">
            Powering the Digital Future of East African Healthcare
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            Founded with a vision to eliminate friction across clinical operations, 40Labs builds secure, high-performance software connecting patients, pharmacies, and suppliers.
          </p>
        </div>
      </Reveal>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((st, index) => (
          <Reveal key={st.label} delay={index * 0.08}>
            <div
              data-scene-step
              className="rounded-[28px] border border-white/10 bg-[#121814]/90 backdrop-blur-md p-6 shadow-xl flex flex-col gap-2 text-center"
              style={{ borderRadius: '28px' }}
            >
              <span className="text-3xl sm:text-4xl font-heading font-bold text-[#16A34A]">{st.value}</span>
              <span className="text-xs font-medium text-gray-400">{st.label}</span>
            </div>
          </Reveal>
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
        ].map((val, index) => {
          const Icon = val.icon;
          return (
            <Reveal key={val.title} delay={0.2 + index * 0.1}>
              <div
                data-scene-step
                className="rounded-[32px] border border-white/10 bg-[#121814]/90 backdrop-blur-md p-8 shadow-xl flex flex-col gap-6 h-full"
                style={{ borderRadius: '32px' }}
              >
                <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/20 text-[#16A34A] flex items-center justify-center">
                  <Icon size={24} />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-heading font-bold text-white">{val.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{val.description}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      <div className="flex flex-col gap-12 pt-8 border-t border-white/10">
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center">Institutional Partners &amp; Collaborators</h2>
        <TrustedBySection />
      </div>
    </div>
  );
}
