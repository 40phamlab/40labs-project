import * as React from 'react';
import { createPortal } from 'react-dom';

export interface MenuBarItemProps {
  label: React.ReactNode;
  isOpen?: boolean;
  onOpen?: () => void;
  onHover?: () => void;
  children?: React.ReactNode;
  isActive?: boolean;
  className?: string;
  disabled?: boolean;
}

export const MenuBarItem = ({
  label,
  isOpen,
  onOpen,
  onHover,
  children,
  isActive,
  className = '',
  disabled = false,
}: MenuBarItemProps) => {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  React.useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
      });
    }
  }, [isOpen]);

  return (
    <div className="relative flex items-center h-full">
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onOpen?.();
        }}
        onMouseEnter={() => {
          if (!disabled) onHover?.();
        }}
        disabled={disabled}
        className={`
          h-full px-3 text-[11px] font-medium transition-colors outline-none select-none
          ${isOpen ? 'bg-panel text-primary' : 'text-text-muted hover:bg-panel hover:text-text'}
          ${isActive ? 'text-primary' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-default'}
          ${className}
        `}
      >
        {label}
      </button>

      {isOpen && children && (
        <MenuDropdown
          top={coords.top}
          left={coords.left}
          onClose={() => onOpen?.()}
        >
          {children}
        </MenuDropdown>
      )}
    </div>
  );
};

interface MenuDropdownProps {
  children: React.ReactNode;
  top: number;
  left: number;
  onClose: () => void;
}

const MenuDropdown = ({ children, top, left }: MenuDropdownProps) => {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 9999,
      }}
      className="mt-1 min-w-[200px] bg-surface-strong border border-border rounded-[12px] shadow-surface-pop overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1.5 flex flex-col">
        {children}
      </div>
    </div>,
    document.body
  );
};

export interface MenuBarProps {
  children: React.ReactNode;
  className?: string;
}

export const MenuBar = ({ children, className = '' }: MenuBarProps) => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenIndex(null);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenIndex(null);
    };

    if (openIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [openIndex]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center h-full ${className}`}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement<MenuBarItemProps>(child)) {
          return React.cloneElement(child, {
            isOpen: openIndex === index,
            onOpen: () => setOpenIndex(openIndex === index ? null : index),
            onHover: () => {
              if (openIndex !== null) setOpenIndex(index);
            },
          });
        }
        return child;
      })}
    </div>
  );
};
