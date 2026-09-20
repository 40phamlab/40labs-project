import React from "react";
import { Reveal } from "../../animation";
import { CTA_BAND } from "../../../mock-data/home";
import { Button } from "@40labs/ui-components";

export const CTABand: React.FC = () => {
  return (
    <section className="relative w-full overflow-hidden py-24">
      {/* Background glow effect */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-clinical/10 blur-[120px]" />

      <div className="mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <h2 className="text-4xl font-bold tracking-tight text-text md:text-5xl">
            {CTA_BAND.title}
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-6 text-lg text-text-muted">
            {CTA_BAND.subtitle}
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-10 flex justify-center">
            <Button
              intent="primary"
              size="lg"
              className="rounded-full px-12 py-6 text-lg shadow-glow-accent hover:scale-105 transition-transform"
            >
              {CTA_BAND.buttonText}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
