import React from "react";
import { Reveal, RevealGroup } from "../../animation";
import { DIFFERENTIATORS } from "../../../mock-data/home";
import { Zap } from "lucide-react";

export const DifferentiatorTeaser: React.FC = () => {
  return (
    <section className="w-full py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
              Why Choose 40Labs?
            </h2>
            <p className="mt-4 max-w-2xl text-text-muted">
              We're not just another software vendor. We're building the digital backbone for a healthier Tanzania.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <RevealGroup>
            {DIFFERENTIATORS.map((item) => (
              <div
                key={item.title}
                className="group flex flex-col gap-4 rounded-card border border-border/10 bg-surface/50 p-8 transition-all hover:bg-panel/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Zap size={20} />
                </div>
                <h3 className="text-lg font-bold text-text transition-colors group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  {item.description}
                </p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
};
