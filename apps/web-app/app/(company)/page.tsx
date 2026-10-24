import React from 'react';
import { CompanyHero } from '@/components/sections/home/CompanyHero';
import { FeatureRows } from '@/components/company/FeatureZigZagRows';
import { TrustedBy } from '@/components/sections/trusted-by';

export default function CompanyLandingPage() {
  return (
    <div className="flex flex-col w-full">
      <CompanyHero />
      <FeatureRows />
      <TrustedBy />
    </div>
  );
}
