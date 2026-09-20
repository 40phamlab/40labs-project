import React from "react";
import { Reveal, RevealGroup } from "../../animation";
import { TOOLS } from "../../../mock-data/home";
import * as Icons from "lucide-react";

export const ToolsShowcase: React.FC = () => {
  return (
    <section className="w-full py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
              Professional Tools for Health Professionals
            </h2>
            <p className="mt-4 text-text-muted">
              Specialized software designed for every node in the healthcare chain.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <RevealGroup>
            {TOOLS.map((tool) => {
              const IconComponent = (Icons as any)[tool.icon.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join("")] || Icons.Activity;

              return (
                <div
                  key={tool.name}
                  className="group relative flex flex-col overflow-hidden rounded-card border border-card-border bg-card-surface p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-clinical/30 hover:bg-panel-strong/40 hover:shadow-glow-accent"
                >
                  {/* Skeuomorphic inner highlight */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.05]" />

                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-clinical/10 text-clinical shadow-inner-soft">
                    <IconComponent size={24} />
                  </div>

                  <h3 className="mb-2 text-xl font-bold text-text group-hover:text-clinical transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-muted">
                    {tool.description}
                  </p>

                  <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-clinical opacity-0 transition-opacity group-hover:opacity-100">
                    Explore Platform <Icons.ArrowRight size={14} />
                  </div>
                </div>
              );
            })}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
};
