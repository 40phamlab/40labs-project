import React from "react";
import { Reveal, NodeNetworkBg } from "../../animation";
import { HERO_CONTENT } from "../../../mock-data/home";
import { Button } from "@40labs/ui-components";
import Image from "next/image";

export const HeroSection: React.FC = () => {
  return (
    <section className="relative flex min-h-[90vh] w-full flex-col items-center justify-center overflow-hidden px-6 pt-32 pb-20 text-center">
      <NodeNetworkBg />

      <div className="z-10 flex flex-col items-center gap-8">
        <Reveal>
          <div className="mb-6 flex justify-center">
            <div className="relative h-16 w-48 opacity-90 brightness-110 grayscale invert filter">
              {/* Assuming logo path exists or placeholder */}
              <div className="text-4xl font-bold tracking-tighter text-primary">
                40LABS
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight text-text md:text-7xl">
            {HERO_CONTENT.title}
          </h1>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="max-w-2xl text-lg text-text-muted md:text-xl">
            {HERO_CONTENT.subtitle}
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <Button intent="primary" size="lg" className="rounded-full px-10 shadow-glow-accent">
              {HERO_CONTENT.ctaText}
            </Button>
            <Button intent="neutral" size="lg" className="rounded-full px-10 border border-border/50 bg-panel/20 backdrop-blur-sm">
              {HERO_CONTENT.secondaryCtaText}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
