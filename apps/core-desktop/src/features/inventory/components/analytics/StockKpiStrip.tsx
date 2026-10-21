// [phase: 8E] Stock KPI Strip with Live Data
import * as React from 'react';
import { Package, AlertTriangle, Clock, Layers } from 'lucide-react';
import type { ComputedStockAnalytics } from '../../analytics/stockAnalytics.queries';

export interface StockKpiStripProps {
  analytics?: ComputedStockAnalytics;
  isLoading?: boolean;
}

export const StockKpiStrip: React.FC<StockKpiStripProps> = ({ analytics, isLoading }) => {
  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-4 gap-2.5 shrink-0">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface-secondary/50 rounded-card p-2.5 h-[68px] animate-pulse" />
        ))}
      </div>
    );
  }

  const { kpis } = analytics;
  const formatTZS = (val: number) => `TZS ${new Intl.NumberFormat('en-US').format(Math.round(val))}`;

  return (
    <div className="grid grid-cols-4 gap-2.5 shrink-0">
      {/* 1. Stock Value (Sell) */}
      <div
        className="bg-surface-elevated rounded-card p-2.5 border border-border/40 flex flex-col justify-between shadow-xs relative group"
        title={`Thamani ya Mauzo: ${formatTZS(kpis.totalValue)}`}
      >
        <div className="flex items-center justify-between text-text-muted text-[11px] font-ui">
          <span className="uppercase tracking-wider font-bold">Thamani ya Mauzo</span>
          <Package size={14} className="text-primary" />
        </div>
        <div className="font-mono text-sm font-bold text-text truncate">
          {formatTZS(kpis.totalValue)}
        </div>
      </div>

      {/* 2. Low / Out */}
      <div
        className="bg-surface-elevated rounded-card p-2.5 border border-border/40 flex flex-col justify-between shadow-xs relative group"
        title={`Pungufu: ${kpis.lowStockCount} | Zimeisha: ${kpis.outStockCount}`}
      >
        <div className="flex items-center justify-between text-text-muted text-[11px] font-ui">
          <span className="uppercase tracking-wider font-bold">Chini / Kwisha</span>
          <AlertTriangle size={14} className="text-warning" />
        </div>
        <div className="font-mono text-sm font-bold text-warning truncate">
          {kpis.lowStockCount} <span className="text-text-muted text-xs font-normal">pungu.</span> / {kpis.outStockCount} <span className="text-text-muted text-xs font-normal">isha</span>
        </div>
      </div>

      {/* 3. Expiring ≤30d */}
      <div
        className="bg-surface-elevated rounded-card p-2.5 border border-border/40 flex flex-col justify-between shadow-xs relative group"
        title={`Inaisha siku 30: ${kpis.expiring30dCount} SKUs`}
      >
        <div className="flex items-center justify-between text-text-muted text-[11px] font-ui">
          <span className="uppercase tracking-wider font-bold">Inaisha Siku 30</span>
          <Clock size={14} className="text-danger" />
        </div>
        <div className="font-mono text-sm font-bold text-danger truncate">
          {kpis.expiring30dCount} <span className="text-text-muted text-xs font-normal">SKUs</span>
        </div>
      </div>

      {/* 4. Total SKUs */}
      <div
        className="bg-surface-elevated rounded-card p-2.5 border border-border/40 flex flex-col justify-between shadow-xs relative group"
        title="Jumla ya bidhaa zilizopo stoo"
      >
        <div className="flex items-center justify-between text-text-muted text-[11px] font-ui">
          <span className="uppercase tracking-wider font-bold">Jumla ya SKUs</span>
          <Layers size={14} className="text-text" />
        </div>
        <div className="font-mono text-sm font-bold text-text truncate">
          {kpis.totalSkus}
        </div>
      </div>
    </div>
  );
};
