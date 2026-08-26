// [PHASE: MVP]
// [SPEC: CONTEXT/04-CONVENTIONS.md, GOTCHAS.md #8]
//
// Built per Ade's default assumption in PROGRESS.md open item #6:
// pure shadow-based depth language, NO literal switch/hardware
// metaphor. If Sairiamu confirms a literal physical-switch look
// instead, this component's visual treatment changes but its props
// API below should not need to change.

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <label className={['inline-flex items-center gap-2 select-none', disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'].join(' ')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={[
          'relative w-11 h-6 rounded-full transition-colors duration-150 ease-out',
          'elevation-inset',
          checked ? 'bg-primary' : 'bg-black/15',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface',
            'elevation-raised',
            'transition-transform duration-150 ease-out',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
      {label && <span className="font-ui text-sm">{label}</span>}
    </label>
  );
}