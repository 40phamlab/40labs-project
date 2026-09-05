import * as React from 'react';

export interface PackagingUnit {
  unitName: string;
  conversionRate: number;
  price: number;
}

export interface UnitPackSelectorProps {
  units: PackagingUnit[];
  selectedUnitName: string;
  totalBaseQuantity: number; // e.g., total tablets
  onChange: (unit: PackagingUnit) => void;
  className?: string;
}

export const UnitPackSelector = ({
  units,
  selectedUnitName,
  totalBaseQuantity,
  onChange,
  className = '',
}: UnitPackSelectorProps) => {
  const selectedUnit = units.find((u) => u.unitName === selectedUnitName) || units[0];

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex bg-panel-strong p-1.5 rounded-card shadow-inner-soft gap-2">
        {units.map((unit) => {
          const isSelected = unit.unitName === selectedUnitName;

          return (
            <button
              key={unit.unitName}
              type="button"
              onClick={() => onChange(unit)}
              className={`
                flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-input transition-all duration-200
                ${
                  isSelected
                    ? 'bg-panel-strong shadow-inner-soft text-primary'
                    : 'bg-surface text-text shadow-surface-pop hover:opacity-95 active:shadow-inner-soft active:translate-y-0.5'
                }
              `}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">{unit.unitName}</span>
              <span className="text-tiny font-mono opacity-60">1:{unit.conversionRate}</span>
            </button>
          );
        })}
      </div>

      {selectedUnit && (
        <div className="flex justify-between items-center bg-panel/30 p-2 rounded-input border border-border/20">
          <div className="flex flex-col">
            <span className="text-[9px] text-text-muted uppercase font-bold tracking-tighter">Price / {selectedUnit.unitName}</span>
            <span className="text-xs font-mono font-bold text-primary">
              TZS {selectedUnit.price.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-[9px] text-text-muted uppercase font-bold tracking-tighter">Inventory Level</span>
            <span className="text-xs font-mono font-bold text-text">
              {Math.floor(totalBaseQuantity / selectedUnit.conversionRate)} {selectedUnit.unitName}s
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
