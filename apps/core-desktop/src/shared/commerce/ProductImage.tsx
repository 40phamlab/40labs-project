import * as React from 'react';
import { Pill } from 'lucide-react';

export interface ProductImageProps {
  src?: string;
  alt?: string;
  fallbackIcon?: React.ReactNode;
  className?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = 'Product image',
  fallbackIcon,
  className = '',
}) => {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`w-10 h-10 object-cover rounded-input border border-border/20 shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`w-10 h-10 shrink-0 rounded-input bg-panel border border-border/20 flex items-center justify-center text-primary ${className}`}
    >
      {fallbackIcon || <Pill size={18} />}
    </div>
  );
};
