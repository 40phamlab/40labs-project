import React, { useState } from 'react';
import { Input } from './Input';
import { Radio } from './Radio';
import { Button } from '../primitives/Button';

export interface TermsOption {
  label: string;
  value: string;
}

export interface TermsCheckboxGroupProps {
  summary: React.ReactNode;
  fullText: React.ReactNode;
  expandLabel?: string;
  collapseLabel?: string;
  options: TermsOption[];
  groupName: string;
  onOptionChange: (value: string) => void;
}

export function TermsCheckboxGroup({
  summary,
  fullText,
  expandLabel = 'Read more...',
  collapseLabel = 'Show less',
  options,
  groupName,
  onOptionChange,
}: TermsCheckboxGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-3 bg-panel-strong/20 p-4 rounded-card border border-border/10">
      <div className="space-y-2">
        <div className="text-body text-text leading-relaxed font-ui">
          {summary}
        </div>
        {isExpanded && (
          <div className="text-caption text-text-muted leading-relaxed font-ui animate-in fade-in slide-in-from-top-1">
            {fullText}
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-caption font-bold text-primary hover:underline underline-offset-4 transition-all"
        >
          {isExpanded ? collapseLabel : expandLabel}
        </button>
      </div>

      <div className="flex items-center gap-6 pt-2 border-t border-border/10">
        {options.map((opt) => (
          <Radio
            key={opt.value}
            name={groupName}
            label={opt.label}
            value={opt.value}
            onChange={() => onOptionChange(opt.value)}
          />
        ))}
      </div>
    </div>
  );
}

export interface LocationLevel {
  id: string;
  label: string;
  placeholder: string;
}

export interface GpsCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface LocationGpsGroupProps {
  levels: LocationLevel[];
  gpsButtonLabel: string;
  gpsButtonIcon?: React.ReactNode;
  onGeolocate: () => Promise<GpsCoordinates>;
  onLocationChange: (id: string, value: string) => void;
}

export function LocationGpsGroup({
  levels,
  gpsButtonLabel,
  gpsButtonIcon,
  onGeolocate,
  onLocationChange,
}: LocationGpsGroupProps) {
  const [isLocating, setIsLocating] = useState(false);

  const handleGeolocate = async () => {
    setIsLocating(true);
    try {
      const coords = await onGeolocate();
      console.log('Location acquired:', coords);
    } catch (err) {
      console.error('Location error:', err);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        {levels.map((level) => (
          <div key={level.id} className="space-y-1">
            <Input
              placeholder={level.placeholder}
              className="bg-panel/40"
              onChange={(e) => onLocationChange(level.id, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <Button
          intent="secondary"
          size="sm"
          onClick={handleGeolocate}
          loading={isLocating}
          leftIcon={gpsButtonIcon}
          className="rounded-full px-6 elevation-raised hover:elevation-hover active:elevation-pressed transition-all"
        >
          {gpsButtonLabel}
        </Button>
      </div>
    </div>
  );
}
