// [PHASE: marketplace-preview — Product catalog UI v2]
import * as React from 'react';
import { Pill, Droplets, Package, Syringe } from 'lucide-react';

export interface ProductImageProps {
  src?: string;
  alt?: string;
  form?: string;
  variant?: 'card' | 'thumb' | 'cart';
  className?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = 'Product image',
  form = 'tablet',
  variant = 'card',
  className = '',
}) => {
  const [hasError, setHasError] = React.useState(false);

  // TODO: offline image cache [V2]

  const getFormIcon = (formType: string) => {
    const f = (formType || 'tablet').toLowerCase();
    const iconSize = variant === 'card' ? 32 : 20;
    if (f.includes('capsule') || f.includes('tablet')) return <Pill size={iconSize} />;
    if (f.includes('syrup') || f.includes('liquid') || f.includes('suspension')) return <Droplets size={iconSize} />;
    if (f.includes('sachet') || f.includes('powder')) return <Package size={iconSize} />;
    if (f.includes('injection') || f.includes('vial') || f.includes('ampoule')) return <Syringe size={iconSize} />;
    return <Pill size={iconSize} />;
  };

  const containerClasses =
    variant === 'card'
      ? 'w-full aspect-[4/3] rounded-t-card bg-surface border-b border-border/20 flex items-center justify-center overflow-hidden relative'
      : 'w-12 h-12 rounded-input bg-surface border border-border/20 flex items-center justify-center overflow-hidden shrink-0 relative';

  if (src && !hasError) {
    return (
      <div className={`${containerClasses} ${className}`}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`${containerClasses} text-primary/70 bg-primary/10 ${className}`}>
      {getFormIcon(form)}
    </div>
  );
};
