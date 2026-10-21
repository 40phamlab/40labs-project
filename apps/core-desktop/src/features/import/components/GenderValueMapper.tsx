import * as React from 'react';
import { ImportRowResult } from '../types';
import { normalizeGender } from '../configs/patientImportConfig';

interface GenderValueMapperProps {
  validatedRows: ImportRowResult[];
  genderMappings: Record<string, 'male' | 'female' | 'blank'>;
  onGenderMappingChange: (rawVal: string, choice: 'male' | 'female' | 'blank') => void;
}

export const GenderValueMapper: React.FC<GenderValueMapperProps> = ({
  validatedRows,
  genderMappings,
  onGenderMappingChange,
}) => {
  // Extract distinct unrecognised gender values and counts
  const unrecognisedEntries = React.useMemo(() => {
    const counts = new Map<string, number>();

    for (const r of validatedRows) {
      const raw = r.record.gender;
      if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
        const strVal = String(raw).trim();
        const norm = normalizeGender(strVal);
        if (norm.warning) {
          counts.set(strVal, (counts.get(strVal) || 0) + 1);
        }
      }
    }

    return Array.from(counts.entries()).map(([value, count]) => ({
      value,
      count,
    }));
  }, [validatedRows]);

  if (unrecognisedEntries.length === 0) {
    return null;
  }

  return (
    <div className="p-4 rounded-card bg-surface-secondary border border-border flex flex-col gap-3">
      <div className="flex flex-col">
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Sex Value Mapping (Jinsia)
        </span>
        <span className="text-[11px] text-text-muted">
          Unrecognised gender/sex values detected. Map them to Male, Female, or leave blank.
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {unrecognisedEntries.map(({ value, count }) => {
          const currentChoice = genderMappings[value] || 'blank';
          return (
            <div
              key={value}
              className="flex items-center justify-between gap-4 p-2.5 rounded bg-surface-primary border border-border text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono bg-warning/10 text-warning px-2 py-0.5 rounded font-bold">
                  "{value}"
                </span>
                <span className="text-text-muted">({count} rows affected)</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-muted">Map to:</span>
                <select
                  value={currentChoice}
                  onChange={(e) =>
                    onGenderMappingChange(value, e.target.value as 'male' | 'female' | 'blank')
                  }
                  className="bg-app-bg border border-border rounded px-2 py-1 text-xs text-text-primary cursor-pointer font-medium"
                >
                  <option value="blank">Leave blank</option>
                  <option value="male">Male (Mwanaume)</option>
                  <option value="female">Female (Mwanamke)</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
