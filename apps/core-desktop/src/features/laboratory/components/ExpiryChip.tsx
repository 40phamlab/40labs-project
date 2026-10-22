import * as React from 'react';
import { Badge, BadgeVariant } from '@40labs/ui-components';
import type { LabSample } from '@40labs/types';
import { useSampleExpiry } from '../hooks/useSampleExpiry';
import { formatDateTime } from '@40labs/i18n';

export interface ExpiryChipProps {
  sample: LabSample;
}

export const ExpiryChip: React.FC<ExpiryChipProps> = ({ sample }) => {
  const expiryStatus = useSampleExpiry(sample);

  if (!sample.expires_at) {
    return <span className="text-text-muted font-mono text-xs">—</span>;
  }

  const dateStr = formatDateTime(sample.expires_at) || sample.expires_at;

  let variant: BadgeVariant = 'success';
  let label = 'Fresh';
  let badgeColorStyle = { backgroundColor: '#16A34A', color: '#ffffff' }; // green

  if (expiryStatus === 'expired') {
    variant = 'danger';
    label = 'Expired';
    badgeColorStyle = { backgroundColor: '#EF4444', color: '#ffffff' }; // danger
  } else if (expiryStatus === 'expiring_soon') {
    variant = 'warning';
    label = 'Expiring Soon';
    badgeColorStyle = { backgroundColor: '#F97316', color: '#ffffff' }; // orange
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={variant} style={badgeColorStyle}>
        {label}
      </Badge>
      <span className="font-mono text-xs text-text-muted">{dateStr}</span>
    </div>
  );
};
