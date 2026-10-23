import React from 'react';
import { HeroOverlapCards } from '@/components/company/HeroOverlapCards';
import { FeatureZigZagRows } from '@/components/company/FeatureZigZagRows';
import { TrustedBySection } from '@/components/company/TrustedBySection';

export default function CompanyLandingPage() {
  return (
    <div className="flex flex-col w-full pb-16">
      <HeroOverlapCards />
      <FeatureZigZagRows />
      <TrustedBySection />
    </div>
  );
}
