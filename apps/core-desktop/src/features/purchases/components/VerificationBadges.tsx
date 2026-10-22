// [PHASE: marketplace-preview — Supplier profile]
import * as React from 'react';
import { ShieldCheck, Shield } from 'lucide-react';

export interface VerificationBadgesProps {
  verification: {
    verified40Labs: boolean;
    tmda: boolean;
    tra: boolean;
  };
}

export const VerificationBadges: React.FC<VerificationBadgesProps> = ({ verification }) => {
  const badges = [
    { label: '40Labs Verified', active: verification.verified40Labs },
    { label: 'TMDA', active: verification.tmda },
    { label: 'TRA', active: verification.tra },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {badges.map((b) => (
        <div
          key={b.label}
          title={`${b.label}: ${b.active ? 'Verified' : 'Unverified'}`}
          className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all
            ${
              b.active
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-panel-strong text-text-muted border-border/30 opacity-60'
            }
          `}
        >
          {b.active ? <ShieldCheck size={14} className="text-primary" /> : <Shield size={14} className="text-text-muted" />}
          <span>{b.label}</span>
        </div>
      ))}
    </div>
  );
};
