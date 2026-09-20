import React from "react";
import { Reveal, RevealGroup } from "../../animation";
import { MARKETPLACE_CARDS } from "../../../mock-data/home";
import { ArrowUpRight } from "lucide-react";

export const MarketplaceShowcase: React.FC = () => {
  return (
    <section className="w-full py-24 bg-panel-strong/10">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
              Connected Marketplace
            </h2>
            <p className="mt-4 text-text-muted">
              Bridging the gap between patients, pharmacies, and global suppliers.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <RevealGroup>
            {MARKETPLACE_CARDS.map((card) => (
              <div
                key={card.title}
                className="group relative flex flex-col overflow-hidden rounded-card border border-card-border bg-card-surface p-8 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow-accent"
              >
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.03] to-transparent" />

                <h3 className="mb-3 text-xl font-bold text-text group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="mb-8 text-sm leading-relaxed text-text-muted">
                  {card.description}
                </p>

                <div className="mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary transition-all group-hover:gap-3">
                  {card.label} <ArrowUpRight size={14} />
                </div>
              </div>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
};
