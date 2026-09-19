import React from 'react';
import { HeroSearch } from '@/components/sections/hero-search';
import { FeatureCards } from '@/components/sections/feature-cards';
import { ToolsShowcase } from '@/components/sections/tools-showcase';
import { TrustedBy } from '@/components/sections/trusted-by';

export default function Home() {
  return (
    <div className="flex flex-col w-full pb-24">
      <HeroSearch />
      <FeatureCards />
      <ToolsShowcase />
      <TrustedBy />
    </div>
  );
}
