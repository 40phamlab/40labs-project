// [PHASE: MVP]
// [SPEC: CONTEXT/04-CONVENTIONS.md]
import { type HTMLAttributes, type ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean; // only interactive cards get hover elevation
  children: ReactNode;
}

// Static display cards: elevation-raised only, never hover.
// Interactive/clickable cards: elevation-raised -> elevation-hover.
// Per CONTEXT/02-DESIGN-TOKENS.md "Application rules" — do not add
// hover elevation to a card that isn't actually clickable.
export function Card({ interactive = false, className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={[
        'bg-surface rounded-card p-4',
        'elevation-raised',
        interactive ? 'hover:elevation-hover cursor-pointer transition-shadow duration-150 ease-out' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}