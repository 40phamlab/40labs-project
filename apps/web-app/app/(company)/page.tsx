import React from 'react';
import { CompanyHero } from '@/components/sections/home/CompanyHero';
import { TrustedBySection } from '@/components/company/TrustedBySection';

export default function CompanyLandingPage() {
  return (
    <div className="flex flex-col w-full pb-20">
      <CompanyHero />
      <TrustedBySection />
    </div>
  );
}
