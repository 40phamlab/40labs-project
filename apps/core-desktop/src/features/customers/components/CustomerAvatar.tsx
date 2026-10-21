import * as React from 'react';
import { Mars, Venus } from 'lucide-react';
import { getInitials } from '../utils/initials';
import { getAvatarColorClass } from '../utils/avatarColor';

export interface CustomerAvatarProps {
  id: string;
  name: string;
  gender?: 'male' | 'female' | null;
  size?: 'sm' | 'md';
}

export const CustomerAvatar: React.FC<CustomerAvatarProps> = React.memo(({
  id,
  name,
  gender,
  size = 'md',
}) => {
  const initials = React.useMemo(() => getInitials(name), [name]);
  const colorClass = React.useMemo(() => getAvatarColorClass(id), [id]);

  const isSmall = size === 'sm';
  const dimensionClass = isSmall ? 'w-8 h-8 text-[11px]' : 'w-9 h-9 text-xs';
  const dotSizeClass = isSmall ? 'w-3 h-3' : 'w-4 h-4';
  const iconSize = isSmall ? 8 : 10;

  const normalizedGender = gender === 'male' || gender === 'female' ? gender : null;
  const genderLabel = normalizedGender === 'male' ? 'Male' : normalizedGender === 'female' ? 'Female' : '';

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center rounded-full font-semibold shadow-inner select-none ${dimensionClass} ${colorClass}`}
      title={`${name}${normalizedGender ? ` (${genderLabel})` : ''}`}
      aria-label={normalizedGender ? `${name}, ${genderLabel}` : name}
    >
      <span className="font-sora tracking-tight">{initials}</span>

      {normalizedGender && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center ring-2 ring-surface-primary ${dotSizeClass} ${
            normalizedGender === 'male' ? 'bg-[#3B82F6]' : 'bg-[#EC4899]'
          }`}
          aria-label={genderLabel}
        >
          {normalizedGender === 'male' ? (
            <Mars size={iconSize} className="text-white stroke-[2.5]" />
          ) : (
            <Venus size={iconSize} className="text-white stroke-[2.5]" />
          )}
        </span>
      )}
    </div>
  );
});

CustomerAvatar.displayName = 'CustomerAvatar';
