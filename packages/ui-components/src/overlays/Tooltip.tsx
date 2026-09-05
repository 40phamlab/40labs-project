import * as React from 'react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip = ({ content, children, position = 'top', className = '' }: TooltipProps) => {
  const [isVisible, setIsVisible] = React.useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`
            absolute z-[100] px-2 py-1 bg-surface-strong border border-border rounded-input
            text-[10px] font-bold uppercase tracking-wider text-text elevation-raised whitespace-nowrap
            pointer-events-none
            ${positionClasses[position]} ${className}
          `}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export interface PopoverProps extends TooltipProps {
  title?: string;
  trigger?: 'click' | 'hover';
}

export const Popover = ({
  content,
  children,
  position = 'bottom',
  title,
  trigger = 'click',
  className = '',
}: PopoverProps) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (trigger === 'click' && isVisible) {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsVisible(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, trigger]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const toggle = () => setIsVisible(!isVisible);

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={trigger === 'hover' ? () => setIsVisible(true) : undefined}
      onMouseLeave={trigger === 'hover' ? () => setIsVisible(false) : undefined}
    >
      {React.cloneElement(children, {
        onClick: trigger === 'click' ? toggle : children.props.onClick,
      })}
      {isVisible && (
        <div
          className={`
            absolute z-[100] min-w-[200px] p-4 bg-surface-strong border border-border rounded-card
            elevation-raised text-xs text-text
            ${positionClasses[position]} ${className}
          `}
        >
          {title && <div className="font-bold uppercase tracking-wider mb-2 border-b border-border pb-1">{title}</div>}
          {content}
        </div>
      )}
    </div>
  );
};
