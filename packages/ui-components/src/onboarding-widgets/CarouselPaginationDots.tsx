import React from 'react';

export interface CarouselPaginationDotsProps {
  total: number;
  activeIndex: number;
  onChange?: (index: number) => void;
  className?: string;
}

/**
 * CarouselPaginationDots
 * A primitive for carousel navigation, displaying a series of dots.
 * Active dot uses the brand accent color.
 */
export const CarouselPaginationDots: React.FC<CarouselPaginationDotsProps> = ({
  total,
  activeIndex,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onChange?.(i)}
          disabled={!onChange}
          className={`
            w-2 h-2 rounded-full transition-all duration-200
            ${!onChange ? 'cursor-default' : 'cursor-pointer hover:scale-125'}
            ${i === activeIndex ? 'bg-accent' : 'bg-panel-strong'}
          `}
          aria-label={`Go to slide ${i + 1}`}
          aria-current={i === activeIndex ? 'step' : undefined}
        />
      ))}
    </div>
  );
};
