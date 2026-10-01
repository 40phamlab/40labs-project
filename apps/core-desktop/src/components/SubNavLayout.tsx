import * as React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ContextualSubNav, IconButton, type SubNavSection } from '@40labs/ui-components';
import { useLayoutStore, type SubNavKey } from '../stores/useLayoutStore';

interface SubNavLayoutProps {
  storageKey: SubNavKey;
  sections: SubNavSection[];
  activeItemId: string;
  onSelect: (id: string) => void;
  /** Full literal Tailwind class (e.g. 'w-52') so the JIT can see it. */
  widthClass?: string;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

// TODO: [reason: i18n hook not verified in this audit; labels must go through sw-TZ/en] [phase: R1]
const LABEL_COLLAPSE = 'Collapse sidebar';
const LABEL_EXPAND = 'Expand sidebar';

export const SubNavLayout: React.FC<SubNavLayoutProps> = ({
  storageKey,
  sections,
  activeItemId,
  onSelect,
  widthClass = 'w-52',
  className = '',
  contentClassName = '',
  children,
}) => {
  const open = useLayoutStore((s) => s.subNavOpen[storageKey]);
  const setOpen = useLayoutStore((s) => s.setSubNavOpen);

  return (
    <div className={`flex w-full h-full overflow-hidden ${className}`}>
      <aside
        aria-hidden={!open}
        inert={!open}
        className={`shrink-0 h-full overflow-hidden transition-all duration-200 ${
          open ? `${widthClass} mr-3.5 opacity-100` : 'w-0 mr-0 opacity-0'
        }`}
      >
        {/* Fixed inner width: content doesn't reflow while the shell animates */}
        <div className={`${widthClass} h-full overflow-y-auto custom-scrollbar border-r border-border/40 pr-3`}>
          <div className="flex justify-end mb-2">
            <IconButton
              icon={<PanelLeftClose size={16} />}
              label={LABEL_COLLAPSE}
              variant="ghost"
              size="xs"
              onClick={() => setOpen(storageKey, false)}
            />
          </div>
          <ContextualSubNav sections={sections} activeItemId={activeItemId} onSelect={onSelect} />
        </div>
      </aside>

      {!open && (
        <div className="shrink-0 mr-2 pt-0.5">
          <IconButton
            icon={<PanelLeftOpen size={16} />}
            label={LABEL_EXPAND}
            variant="neutral"
            size="sm"
            className="shadow-surface-pop border border-border/50"
            onClick={() => setOpen(storageKey, true)}
          />
        </div>
      )}

      <div className={`flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};
