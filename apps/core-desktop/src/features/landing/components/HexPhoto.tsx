import * as React from 'react';

interface HexPhotoProps {
  src: string;
  alt?: string;
  size?: 'large' | 'medium' | 'small';
  className?: string;
  style?: React.CSSProperties;
  parallaxOffset?: { x: number; y: number };
  depth?: number;
}

export const HexPhoto: React.FC<HexPhotoProps> = ({
  src,
  alt = '',
  size = 'medium',
  className = '',
  style = {},
  parallaxOffset = { x: 0, y: 0 },
  depth = 1,
}) => {
  const sizeMap = {
    large: 'w-48 h-48 lg:w-56 lg:h-56',
    medium: 'w-36 h-36 lg:w-44 lg:h-44',
    small: 'w-24 h-24 lg:w-32 lg:h-32',
  };

  const clampedX = Math.max(-12, Math.min(12, parallaxOffset.x * depth));
  const clampedY = Math.max(-12, Math.min(12, parallaxOffset.y * depth));

  return (
    <div
      className={`absolute transition-transform duration-75 ease-out ${sizeMap[size]} ${className}`}
      style={{
        transform: `translate(${clampedX}px, ${clampedY}px)`,
        ...style,
      }}
      aria-hidden={!alt ? 'true' : undefined}
    >
      <div className="hex-border-wrapper w-full h-full shadow-lg">
        <div className="hex-border-inner">
          <img
            src={src}
            alt={alt}
            aria-hidden={!alt ? 'true' : undefined}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
    </div>
  );
};
