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
  isOpen = false,
  onOpen,
  onHover,
  children,
  isActive = false,
  className = '',
  disabled = false,
}: MenuBarItemProps) => {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  const updateCoords = React.useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 220;
      const padding = 8;

      let left = rect.left;
      if (left + dropdownWidth > window.innerWidth - padding) {
        left = Math.max(padding, window.innerWidth - dropdownWidth - padding);
      }

      setCoords({
        top: rect.bottom,
        left,
      });
    }
  }, []);

  React.useLayoutEffect(() => {
    if (isOpen) {
      updateCoords();
    }
  }, [isOpen, updateCoords]);

  React.useEffect(() => {
    if (isOpen) {
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
      return () => {
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords, true);
      };
    }
  }, [isOpen, updateCoords]);

  return (
    <div className="relative flex items-center h-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onOpen?.();
        }}
        onMouseEnter={() => {
          if (!disabled) onHover?.();
        }}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup={children ? 'menu' : undefined}
        className={`
          h-full px-2.5 text-[11px] font-medium transition-colors outline-none select-none flex items-center
          focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset
          ${isOpen ? 'bg-surface-hover text-text-primary' : 'text-text-muted hover:bg-surface-hover hover:text-text-primary'}
          ${isActive ? 'text-action-primary' : ''}
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
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
      className="mt-1 min-w-[200px] bg-surface-elevated border border-border rounded-md shadow-md overflow-hidden select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1 flex flex-col">
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
  const childCount = React.Children.count(children);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenIndex(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (openIndex === null) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        setOpenIndex(null);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setOpenIndex((openIndex + 1) % childCount);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setOpenIndex((openIndex - 1 + childCount) % childCount);
      }
    };

    if (openIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openIndex, childCount]);

  return (
    <div
      ref={containerRef}
      role="menubar"
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
