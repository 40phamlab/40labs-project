import React from 'react';
import { HeroCardData } from '@/mock-data/hero';
import { HeroCardCta } from './HeroCardCta';
import { darkTokens } from '@40labs/design-tokens';

interface HeroCardProps {
  data: HeroCardData;
  className?: string;
}

export function HeroCard({ data, className = '' }: HeroCardProps) {
  let bg = '#FFFFFF';
  let textColor = '#1F2A33';
  let badgeBg = 'rgba(0,0,0,0.06)';
  let badgeText = '#4A5568';
  let shadow = '0 20px 40px rgba(0,0,0,0.1)';

  if (data.tone === 'orange') {
    bg = darkTokens.colors.accent; // #F97316
    textColor = '#FFFFFF';
    badgeBg = 'rgba(0,0,0,0.15)';
    badgeText = '#FFFFFF';
    shadow = '0 20px 40px rgba(249, 115, 22, 0.25)';
  } else if (data.tone === 'green') {
    bg = darkTokens.colors.surfaceDarkRaised; // #14532D
    textColor = '#F8FAFB';
    badgeBg = 'rgba(255,255,255,0.15)';
    badgeText = '#A7F3D0';
    shadow = '0 25px 50px rgba(20, 83, 45, 0.4)';
  } else {
    bg = '#FFFFFF';
    textColor = '#1F2A33';
    badgeBg = '#F1F5F9';
    badgeText = '#475569';
    shadow = '0 20px 40px rgba(0,0,0,0.08)';
  }

  return (
    <div
      className={`web-card p-8 sm:p-10 rounded-[24px] flex flex-col justify-between min-h-[380px] sm:min-h-[420px] transition-all duration-300 hover:scale-[1.02] ${className}`}
      style={{
        backgroundColor: bg,
        color: textColor,
        borderRadius: darkTokens.radius.card,
        boxShadow: `${darkTokens.elevation.skeuOuter}, ${shadow}`,
        border: data.tone === 'white' ? '1px solid #B6C2CC' : '1px solid rgba(255,255,255,0.15)',
      }}
    >
      <div className="space-y-4">
        <span
          className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block"
          style={{ backgroundColor: badgeBg, color: badgeText }}
        >
          {data.tone}
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold leading-tight">
          {data.title}
        </h2>
        {data.subtitle && (
          <h3 className="text-xl sm:text-2xl font-heading font-semibold opacity-90">
            {data.subtitle}
          </h3>
        )}
        <div className="space-y-2 pt-2">
          {data.lines.map((line, idx) => (
            <p key={idx} className="text-sm sm:text-base leading-relaxed opacity-90">
              {line}
            </p>
          ))}
        </div>
      </div>

      <div className="pt-8">
        <HeroCardCta label={data.ctaText} tone={data.tone} />
      </div>
    </div>
  );
}
