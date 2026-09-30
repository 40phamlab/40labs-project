import * as React from 'react';

export interface KPIItem {
  title: string;
  value: React.ReactNode;
  rawAmount?: number;
  tone?: string;
  isHero?: boolean;
}

interface KPIStripProps {
  items: KPIItem[];
}

export const KPIStrip: React.FC<KPIStripProps> = ({ items }) => {
  return (
    <div className="bg-panel rounded-card border border-border/40 px-4 py-2.5 flex items-center justify-between elevation-raised shrink-0">
      <div className="grid grid-cols-4 gap-4 w-full items-center">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <div className="h-8 w-[1px] bg-border/30 my-auto" />}
            <div className={`flex flex-col justify-center min-w-0 ${index > 0 ? 'pl-2' : ''}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted truncate">
                {item.title}
              </span>
              <div className={`truncate mt-0.5 ${item.isHero ? 'font-mono text-xl font-bold text-text' : 'font-mono text-sm font-bold'} ${item.tone || 'text-text'}`}>
                {item.value}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
