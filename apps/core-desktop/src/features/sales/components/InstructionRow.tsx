import * as React from 'react';
import type { DispensingInstruction, FrequencyType, TimingType, StorageType, SaleLine } from '@40labs/types';
import { Input, Button } from '@40labs/ui-components';
import { Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { t } from '@40labs/i18n';

export interface InstructionRowProps {
  saleLine: SaleLine;
  medicineName: string;
  instruction: DispensingInstruction;
  onChange: (updated: DispensingInstruction) => void;
  onCopyFromPrevious?: () => void;
  canCopy: boolean;
}

const DOSE_PRESETS = ['1 tablet', '2 tablets', '5 ml', '10 ml'];
const FREQUENCY_OPTIONS: { id: FrequencyType; label: string }[] = [
  { id: 'once_daily', label: t('instructions.frequency.once') },
  { id: 'twice_daily', label: t('instructions.frequency.twice') },
  { id: 'three_daily', label: t('instructions.frequency.three') },
  { id: 'four_daily', label: t('instructions.frequency.four') },
  { id: 'as_needed', label: t('instructions.frequency.prn') },
  { id: 'custom', label: t('instructions.frequency.custom') },
];

const TIMING_OPTIONS: { id: TimingType; label: string }[] = [
  { id: 'before_meal', label: t('instructions.timing.beforeMeal') },
  { id: 'after_meal', label: t('instructions.timing.afterMeal') },
  { id: 'with_meal', label: t('instructions.timing.withMeal') },
  { id: 'morning', label: t('instructions.timing.morning') },
  { id: 'night', label: t('instructions.timing.night') },
  { id: 'any', label: t('instructions.timing.any') },
];

const STORAGE_OPTIONS: { id: StorageType; label: string }[] = [
  { id: 'cool_dry', label: t('instructions.storage.coolDry') },
  { id: 'refrigerate', label: t('instructions.storage.refrigerate') },
  { id: 'away_from_light', label: t('instructions.storage.awayLight') },
  { id: 'away_from_children', label: t('instructions.storage.awayChildren') },
  { id: 'shake_well', label: t('instructions.storage.shakeWell') },
];

const DURATION_CHIPS = [3, 5, 7, 14];

export const InstructionRow: React.FC<InstructionRowProps> = ({
  saleLine,
  medicineName,
  instruction,
  onChange,
  onCopyFromPrevious,
  canCopy,
}) => {
  const [expanded, setExpanded] = React.useState(true);

  const updateField = <K extends keyof DispensingInstruction>(key: K, value: DispensingInstruction[K]) => {
    onChange({
      ...instruction,
      [key]: value,
      updated_at: new Date().toISOString(),
    });
  };

  const toggleStorage = (item: StorageType) => {
    const current = instruction.storage || [];
    const exists = current.includes(item);
    const updated = exists ? current.filter((s) => s !== item) : [...current, item];
    updateField('storage', updated);
  };

  return (
    <div className="border border-border/40 rounded-[12px] bg-[#F8FAFB] p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text">{medicineName}</span>
          <span className="text-[10px] text-text-muted font-mono">(Qty: {saleLine.quantity})</span>
        </div>
        <div className="flex items-center gap-2">
          {canCopy && onCopyFromPrevious && (
            <Button
              type="button"
              intent="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCopyFromPrevious();
              }}
              leftIcon={<Copy size={12} />}
              className="text-xs text-text-muted hover:text-primary"
            >
              {t('instructions.copyPrevious')}
            </Button>
          )}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {expanded && (
        <div className="flex flex-col gap-3 pt-2 border-t border-border/20 text-xs">
          {/* Dose */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-text-muted">{t('instructions.dose')}</label>
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                value={instruction.dose}
                onChange={(e) => updateField('dose', e.target.value)}
                placeholder="e.g. 1 tablet"
                className="!h-8 !text-xs !rounded-[8px] flex-1 min-w-[140px]"
              />
              <div className="flex gap-1 flex-wrap">
                {DOSE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => updateField('dose', preset)}
                    className="text-[10px] px-2 py-1 rounded-[8px] border border-border/40 bg-surface-primary hover:border-primary text-text transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Frequency */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-text-muted">{t('instructions.frequency')}</label>
            <div className="flex gap-1.5 flex-wrap">
              {FREQUENCY_OPTIONS.map((freq) => {
                const selected = instruction.frequency === freq.id;
                return (
                  <button
                    key={freq.id}
                    type="button"
                    onClick={() => updateField('frequency', freq.id)}
                    className={[
                      'text-[11px] font-medium px-3 py-1.5 rounded-[8px] border transition-all',
                      selected
                        ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-sm'
                        : 'bg-surface-primary text-text-secondary border-border/40 hover:border-border',
                    ].join(' ')}
                  >
                    {freq.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timing */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-text-muted">{t('instructions.timing')}</label>
            <div className="flex gap-1.5 flex-wrap">
              {TIMING_OPTIONS.map((tm) => {
                const selected = instruction.timing === tm.id;
                return (
                  <button
                    key={tm.id}
                    type="button"
                    onClick={() => updateField('timing', selected ? null : tm.id)}
                    className={[
                      'text-[11px] font-medium px-3 py-1.5 rounded-[8px] border transition-all',
                      selected
                        ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-sm'
                        : 'bg-surface-primary text-text-secondary border-border/40 hover:border-border',
                    ].join(' ')}
                  >
                    {tm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-text-muted">{t('instructions.duration')}</label>
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                type="number"
                value={instruction.duration_days ?? ''}
                onChange={(e) => updateField('duration_days', e.target.value ? Number(e.target.value) : null)}
                placeholder="Days"
                className="!h-8 !text-xs !rounded-[8px] w-24 font-mono"
              />
              <div className="flex gap-1">
                {DURATION_CHIPS.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => updateField('duration_days', days)}
                    className="text-[10px] px-2.5 py-1 rounded-[8px] border border-border/40 bg-surface-primary hover:border-primary text-text transition-colors font-mono"
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Storage / Keep */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-text-muted">{t('instructions.storage')}</label>
            <div className="flex gap-1.5 flex-wrap">
              {STORAGE_OPTIONS.map((st) => {
                const selected = (instruction.storage || []).includes(st.id);
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => toggleStorage(st.id)}
                    className={[
                      'text-[11px] font-medium px-2.5 py-1.5 rounded-[8px] border transition-all',
                      selected
                        ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-sm'
                        : 'bg-surface-primary text-text-secondary border-border/40 hover:border-border',
                    ].join(' ')}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-text-muted">{t('instructions.note')}</label>
            <Input
              value={instruction.note || ''}
              onChange={(e) => updateField('note', e.target.value.substring(0, 200))}
              placeholder="Max 200 characters"
              maxLength={200}
              className="!h-8 !text-xs !rounded-[8px]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
