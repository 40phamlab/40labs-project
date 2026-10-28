"use client";

import React from 'react';
import { getHeroCards } from '@/mock-data/hero';
import { HeroCard } from './HeroCard';
import { Reveal } from '../../animation';

export function CompanyHero() {
  const cards = getHeroCards();
  const orangeCard = cards.find(c => c.tone === 'orange');
  const greenCard = cards.find(c => c.tone === 'green');
  const whiteCard = cards.find(c => c.tone === 'white');

  return (
    <section data-scene-step className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 lg:pt-40 pb-20 sm:pb-28 overflow-x-hidden relative z-10">
      {/* Mobile view (<768px): Stacked column with layered offset */}
      <div className="flex flex-col gap-6 md:hidden">
        {greenCard && <HeroCard data={greenCard} className="z-30" />}
        {orangeCard && <HeroCard data={orangeCard} className="z-20 -mt-8 sm:-mt-12" />}
        {whiteCard && <HeroCard data={whiteCard} className="z-10 -mt-8 sm:-mt-12" />}
      </div>

      {/* Desktop view (>=768px): Staggered overlap layout */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-0 relative items-center min-h-[520px]">
        {/* Left Orange Card (lowest) */}
        <div className="md:col-span-1 z-10 md:-mr-8 lg:-mr-12 md:translate-y-8">
          <Reveal>
            {orangeCard && <HeroCard data={orangeCard} />}
          </Reveal>
        </div>

        {/* Centre Green Card (tallest/highest, overlapping both) */}
        <div className="md:col-span-1 z-30 md:-translate-y-12 lg:-translate-y-16">
          <Reveal delay={0.1}>
            {greenCard && <HeroCard data={greenCard} />}
          </Reveal>
        </div>

        {/* Right White Card (slightly higher than orange) */}
        <div className="md:col-span-1 z-20 md:-ml-8 lg:-ml-12 md:translate-y-4">
          <Reveal delay={0.2}>
            {whiteCard && <HeroCard data={whiteCard} />}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
