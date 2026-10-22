// [PHASE: marketplace-preview]
import * as React from 'react';
import { EntityProfileHeader, EntityProfileAction, Button } from '@40labs/ui-components';
import { ArrowLeft } from 'lucide-react';
import { ExtendedSupplier } from './SupplierListItem';

export interface SupplierStorefrontHeaderProps {
  supplier: ExtendedSupplier;
  supplierName: string;
  phoneFormatted: string;
  isFollowed: boolean;
  onBack?: () => void;
  onClose?: () => void;
  onToggleFollow: () => void;
  onViewProfile: () => void;
}

export const SupplierStorefrontHeader: React.FC<SupplierStorefrontHeaderProps> = ({
  supplier,
  supplierName,
  phoneFormatted,
  isFollowed,
  onBack,
  onClose,
  onToggleFollow,
  onViewProfile,
}) => {
  const handleBack = React.useCallback(() => {
    if (onBack) onBack();
    else if (onClose) onClose();
  }, [onBack, onClose]);

  const verifications = [
    supplier.tmda_verified ? 'TMDA Verified' : null,
    supplier.tra_verified ? 'TRA Verified' : null,
  ].filter(Boolean) as string[];

  const headerActions: EntityProfileAction[] = [
    {
      id: 'profile',
      label: 'Profile',
      variant: 'secondary',
      onClick: onViewProfile,
    },
    {
      id: 'follow',
      label: isFollowed ? 'Following' : 'Follow',
      variant: isFollowed ? 'primary' : 'secondary',
      onClick: onToggleFollow,
    },
  ];

  return (
    <div className="flex flex-col gap-3 shrink-0">
      {(onBack || onClose) && (
        <div className="flex items-center gap-2">
          <Button
            intent="secondary"
            size="sm"
            leftIcon={<ArrowLeft size={16} />}
            onClick={handleBack}
          >
            Back to Suppliers Directory
          </Button>
        </div>
      )}

      <EntityProfileHeader
        entity={{
          id: supplier.id,
          name: supplierName,
          phone: phoneFormatted,
          statusIndicator: 'active',
          verifications,
        }}
        actions={headerActions}
      />
    </div>
  );
};
