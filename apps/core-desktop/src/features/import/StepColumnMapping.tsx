import * as React from 'react';
import { Button, Badge } from '@40labs/ui-components';
import { ArrowRight } from 'lucide-react';
import { ImportConfig } from './types';

interface StepColumnMappingProps {
  config: ImportConfig;
  fileName: string;
  headers: string[];
  rawRows: Record<string, string>[];
  mapping: Record<string, string>;
  setMapping: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onBack: () => void;
  onNext: () => void;
}

export const StepColumnMapping: React.FC<StepColumnMappingProps> = ({
  config,
  fileName,
  headers,
  rawRows,
  mapping,
  setMapping,
  onBack,
  onNext,
}) => {
  const missingRequired = config.fields
    .filter((f) => f.required)
    .some((f) => !mapping[f.key] || mapping[f.key] === '');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-secondary">
          File: <span className="text-text-primary font-mono">{fileName}</span> ({rawRows.length} rows)
        </span>
        <Button size="sm" variant="secondary" onClick={onBack}>Choose Different File</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-auto p-1">
        {config.fields.map((field) => {
          const isUnmappedRequired = field.required && (!mapping[field.key] || mapping[field.key] === '');
          return (
            <div
              key={field.key}
              className={`p-3 rounded-card bg-surface-secondary/40 border flex flex-col gap-1.5 ${
                isUnmappedRequired ? 'border-danger' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">
                  {field.label} {field.required && <span className="text-danger">*</span>}
                </span>
                <Badge variant={field.required ? 'success' : 'outline'} size="sm">
                  {field.required ? 'Required' : 'Optional'}
                </Badge>
              </div>
              <select
                value={mapping[field.key] || ''}
                onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                className="w-full bg-app-bg border border-border rounded px-2.5 py-1 text-xs text-text-primary"
              >
                <option value="">-- Select Column --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="secondary" size="sm" onClick={onBack}>Back</Button>
        <Button
          size="sm"
          disabled={missingRequired}
          onClick={onNext}
          className="flex items-center gap-1.5 bg-action-primary text-text-inverse"
        >
          <span>Next: Validate & Review</span>
          <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
};
