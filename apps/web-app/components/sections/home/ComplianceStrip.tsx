import React from "react";
import { RevealGroup } from "../../animation";
import { COMPLIANCE_BADGES } from "../../../mock-data/home";
import { ShieldCheck } from "lucide-react";

export const ComplianceStrip: React.FC = () => {
  return (
    <section className="w-full py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <RevealGroup staggerDelay={0.1}>
            {COMPLIANCE_BADGES.map((badge) => (
              <div
                key={badge}
                className="flex items-center gap-2 rounded-full border border-border/30 bg-panel/20 px-6 py-3 shadow-inner-soft backdrop-blur-sm transition-colors hover:border-clinical/40"
              >
                <ShieldCheck size={14} className="text-clinical" />
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  {badge}
                </span>
              </div>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
};
