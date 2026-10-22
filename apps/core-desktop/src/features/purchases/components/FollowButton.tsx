// [PHASE: marketplace-preview — Supplier profile]
import * as React from 'react';
import { Button } from '@40labs/ui-components';
import { Heart, Info } from 'lucide-react';

export interface FollowButtonProps {
  isFollowed: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  isFollowed,
  onToggle,
  isLoading = false,
}) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="relative inline-flex items-center gap-2">
      <Button
        intent={isFollowed ? 'primary' : 'secondary'}
        size="sm"
        leftIcon={<Heart size={14} className={isFollowed ? 'fill-current' : ''} />}
        onClick={onToggle}
        disabled={isLoading}
      >
        {isFollowed ? 'Following' : 'Follow Supplier'}
      </Button>

      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-text-muted hover:text-text transition-colors"
        aria-label="Info about following suppliers"
      >
        <Info size={16} />
      </button>

      {showTooltip && (
        <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-panel-strong border border-border/50 rounded-card shadow-lg text-[11px] text-text z-50">
          Followed suppliers are recommended when an item is out of stock.
        </div>
      )}
    </div>
  );
};
