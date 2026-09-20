import React from "react";
import { RevealGroup } from "../../animation";
import { TRUSTED_BY } from "../../../mock-data/home";

export const TrustBar: React.FC = () => {
  return (
    <section className="w-full border-y border-border/10 bg-surface/50 py-12 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-8 text-center text-xs font-bold uppercase tracking-widest text-text-muted opacity-50">
          Trusted By Healthcare Leaders
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 md:gap-x-20">
          <RevealGroup>
            {TRUSTED_BY.map((partner) => (
              <div
                key={partner.name}
                className="text-sm font-semibold text-text-muted grayscale transition-all hover:text-text hover:grayscale-0"
              >
                {partner.name}
              </div>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
};
