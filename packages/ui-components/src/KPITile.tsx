import { type ReactNode } from 'react';
export type KPITone = 'default' | 'primary' | 'accent' | 'danger';
export interface KPITileProps { label:string; value:string|number; tone?:KPITone; icon?:ReactNode; subtext?:string; }
const toneClasses:Record<KPITone,string>={default:'text-text',primary:'text-primary',accent:'text-accent',danger:'text-danger'};
export function KPITile({label,value,tone='default',icon,subtext}:KPITileProps){return <div className="bg-panel rounded-card p-4 elevation-raised flex flex-col gap-1 text-text"><div className="flex items-center justify-between"><span className="font-ui text-xs uppercase tracking-wide text-text-muted">{label}</span>{icon}</div><span className={['font-mono text-2xl font-semibold',toneClasses[tone]].join(' ')}>{value}</span>{subtext&&<span className="font-ui text-xs text-text-muted">{subtext}</span>}</div>}
