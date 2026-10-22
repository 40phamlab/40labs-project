// [PHASE MVP — Medicine Product Image Slot]
// [SPEC: CONTEXT/SPEC/inventory.md]

import * as React from 'react';
import { Pill, Droplet, Syringe, FlaskConical, Package } from 'lucide-react';
import { getInitials } from '../../customers/utils/initials';
import { getAvatarColorClass } from '../../customers/utils/avatarColor';
import { useFilePreviewContext } from '../../../providers/FilePreviewProvider';

export interface MedicineAvatarProps {
  id: string;
  name: string;
  category: string;
  imagePath?: string | null;
}

function getCategoryIcon(category: string) {
  const lower = category.toLowerCase();
  if (lower.includes('analgesic') || lower.includes('pain') || lower.includes('antibiotic') || lower.includes('tablet') || lower.includes('capsule')) {
    return Pill;
  }
  if (lower.includes('liquid') || lower.includes('syrup') || lower.includes('drop') || lower.includes('rehydration')) {
    return Droplet;
  }
  if (lower.includes('injection') || lower.includes('vaccine') || lower.includes('syringe')) {
    return Syringe;
  }
  if (lower.includes('vial') || lower.includes('ampoule') || lower.includes('flask') || lower.includes('solution')) {
    return FlaskConical;
  }
  return Package;
}

export const MedicineAvatar: React.FC<MedicineAvatarProps> = React.memo(({
  id,
  name,
  category,
  imagePath,
}) => {
  const [resolvedSrc, setResolvedSrc] = React.useState<string | null>(null);
  const initials = React.useMemo(() => getInitials(name), [name]);
  const colorClass = React.useMemo(() => getAvatarColorClass(id), [id]);
  const CategoryIcon = React.useMemo(() => getCategoryIcon(category), [category]);

  React.useEffect(() => {
    let isMounted = true;
    async function resolveImg() {
      if (!imagePath) {
        if (isMounted) setResolvedSrc(null);
        return;
      }
      if (imagePath.startsWith('data:') || imagePath.startsWith('blob:') || imagePath.startsWith('http')) {
        if (isMounted) setResolvedSrc(imagePath);
        return;
      }
      try {
        const { convertFileSrc } = await import('@tauri-apps/api/core');
        if (isMounted) setResolvedSrc(convertFileSrc(imagePath));
      } catch {
        if (isMounted) setResolvedSrc(imagePath);
      }
    }
    resolveImg();
    return () => {
      isMounted = false;
    };
  }, [imagePath]);

  let openBlob: ((file: { fileName: string; mimeType?: string; blob: Blob }) => void) | undefined;
  try {
    const ctx = useFilePreviewContext();
    openBlob = ctx.openBlob;
  } catch {
    openBlob = undefined;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (resolvedSrc && openBlob) {
      fetch(resolvedSrc)
        .then((res) => res.blob())
        .then((blob) => {
          openBlob({
            fileName: `${name.replace(/[^a-zA-Z0-9]/g, '_')}_photo.webp`,
            mimeType: 'image/webp',
            blob,
          });
        })
        .catch(() => {
          openBlob({
            fileName: 'product_photo.webp',
            mimeType: 'image/webp',
            blob: new Blob([], { type: 'image/webp' }),
          });
        });
    }
  };

  if (resolvedSrc) {
    return (
      <div
        onClick={handleClick}
        className="relative w-10 h-10 rounded-lg overflow-hidden border border-border/40 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
        title={name}
        role="button"
        tabIndex={0}
        aria-label={`View photo of ${name}`}
      >
        <img
          src={resolvedSrc}
          alt={name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-10 h-10 rounded-lg flex items-center justify-center font-semibold shadow-inner select-none border border-border/40 shrink-0 ${colorClass}`}
      title={`${name} (${category})`}
      aria-label={name}
    >
      <span className="font-sora tracking-tight text-xs text-white">{initials}</span>
      <span
        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center bg-surface-elevated border border-border/60 text-text-primary shadow-xs"
        title={category}
      >
        <CategoryIcon size={10} className="text-primary stroke-[2.5]" />
      </span>
    </div>
  );
});

MedicineAvatar.displayName = 'MedicineAvatar';
