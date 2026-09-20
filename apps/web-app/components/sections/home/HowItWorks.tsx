import React from "react";
import { Reveal, RevealGroup } from "../../animation";
import { HOW_IT_WORKS } from "../../../mock-data/home";
import * as Icons from "lucide-react";

export const HowItWorks: React.FC = () => {
  return (
    <section className="w-full py-24 bg-surface/30">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="mb-20 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-text-muted">
              Integrated records from clinical diagnostic to prescription delivery.
            </p>
          </div>
        </Reveal>

        <div className="relative">
          {/* Connecting line for desktop */}
          <div className="absolute top-1/2 left-0 hidden h-px w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-border/50 to-transparent md:block" />

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
            <RevealGroup>
              {HOW_IT_WORKS.map((item) => {
                const IconComponent = (Icons as any)[item.icon.charAt(0).toUpperCase() + item.icon.slice(1)] || Icons.Circle;

                return (
                  <div key={item.step} className="relative z-10 flex flex-col items-center text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-border/50 bg-surface shadow-surface-pop transition-transform hover:scale-110">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-panel-strong/50 text-clinical">
                        <IconComponent size={32} />
                      </div>
                    </div>

                    <div className="rounded-full bg-clinical/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-clinical mb-4">
                      Step {item.step}
                    </div>

                    <h3 className="mb-2 text-xl font-bold text-text">
                      {item.title}
                    </h3>
                    <p className="max-w-[240px] text-sm text-text-muted">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </RevealGroup>
          </div>
        </div>
      </div>
    </section>
  );
};
