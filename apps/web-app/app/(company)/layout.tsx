import React from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { BioSceneExperience } from '@/components/company/BioSceneExperience';

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col relative bg-[#0B0F0D]">
      <BioSceneExperience />
      <SiteHeader />
      <main className="flex-1 flex flex-col relative z-10">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
